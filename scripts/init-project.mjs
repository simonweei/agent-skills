import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(path.join(root, 'template.json'), 'utf8'));

function inside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function assertNoSymlinks(file) {
  let current = path.resolve(file);
  while (true) {
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) throw new Error(`不支持符号链接路径：${current}`);
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
}

function collect(relative) {
  const source = path.resolve(root, relative);
  if (!inside(root, source)) throw new Error(`模板路径越界：${relative}`);
  const stat = lstatSync(source);
  if (stat.isSymbolicLink()) throw new Error(`模板中不允许符号链接：${relative}`);
  if (stat.isDirectory()) return readdirSync(source).sort().flatMap(name => collect(path.join(relative, name)));
  if (!stat.isFile()) throw new Error(`不支持模板条目：${relative}`);
  return [relative];
}

export function install({ target, name, dryRun = false }) {
  if (!target) throw new Error('必须提供 --target。');
  const destination = path.resolve(target);
  if (inside(root, destination) || inside(destination, root)) throw new Error('目标不能是模板目录、其子目录或祖先目录。');
  if (name !== undefined && (!name.trim() || /[\r\n\x00-\x1f]/.test(name))) throw new Error('项目名称必须是非空单行文本。');
  assertNoSymlinks(destination);
  const files = manifest.installPaths.flatMap(collect);
  const outputs = files.map(relative => {
    let content = readFileSync(path.join(root, relative), 'utf8');
    if (relative === 'AGENTS.md') content = content.split('## 本模板维护命令')[0] + '## 项目命令\n从 docs/ai/PROJECT.md 和实际依赖配置确认命令；尚未配置时先初始化，不执行模板维护命令。\n';
    if (relative === path.join('docs', 'ai', 'PROJECT.md') && name) content = content.replace('项目名称：待确定', `项目名称：${name.trim()}`);
    return { relative, content };
  });
  outputs.push({ relative: path.join('docs', 'ai', 'TEMPLATE-LICENSE.txt'), content: readFileSync(path.join(root, 'LICENSE'), 'utf8') });
  outputs.push({ relative: 'ai-assistant.json', content: JSON.stringify({ template: manifest.name, version: manifest.version, source: manifest.repository }, null, 2) + '\n' });

  // Preflight every output and parent before creating any directory or file.
  const conflicts = [];
  for (const { relative } of outputs) {
    const file = path.join(destination, relative);
    assertNoSymlinks(file);
    if (existsSync(file)) conflicts.push(relative);
    let current = path.dirname(file);
    while (inside(destination, current)) {
      if (existsSync(current) && !lstatSync(current).isDirectory()) conflicts.push(path.relative(destination, current) || '.');
      if (current === destination) break;
      current = path.dirname(current);
    }
  }
  if (conflicts.length) throw new Error(`发现路径冲突，未写入任何文件：\n${[...new Set(conflicts)].join('\n')}`);
  if (!dryRun) {
    for (const { relative, content } of outputs) {
      const file = path.join(destination, relative);
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, content, { encoding: 'utf8', flag: 'wx' });
    }
  }
  return { target: destination, dryRun, files: outputs.map(({ relative }) => relative) };
}

function main(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help') {
      console.log('node scripts/init-project.mjs --target <目录> [--name <名称>] [--dry-run]');
      return;
    }
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--target' || arg === '--name') {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`${arg} 缺少值。`);
      options[arg.slice(2)] = value;
    } else throw new Error(`未知参数：${arg}`);
  }
  const result = install(options);
  console.log(`${result.dryRun ? '预览' : '已安装'}：${result.target}\n${result.files.join('\n')}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
