import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => readFileSync(path.join(root, relative), 'utf8');
const manifest = JSON.parse(read('template.json'));
for (const relative of manifest.installPaths) assert.ok(existsSync(path.join(root, relative)), `Missing: ${relative}`);
const skillRoot = path.join(root, '.agents/skills');
const names = new Set();
for (const folder of readdirSync(skillRoot)) {
  const skill = read(`.agents/skills/${folder}/SKILL.md`);
  const frontmatter = skill.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n/);
  assert.ok(frontmatter, `${folder}: missing frontmatter`);
  const name = frontmatter[1].match(/^name: (.+)$/m)?.[1];
  const description = frontmatter[1].match(/^description: (.+)$/m)?.[1];
  assert.equal(name, folder);
  assert.match(name, /^[a-z0-9-]{1,64}$/);
  assert.ok(description?.trim());
  assert.ok(!names.has(name));
  names.add(name);
}

// Check local Markdown links in all maintained docs; external URLs are not fetched.
function walk(directory) {
  return readdirSync(directory).filter(name => name !== '.git').flatMap(name => {
    const file = path.join(directory, name);
    return statSync(file).isDirectory() ? walk(file) : [file];
  });
}
for (const file of walk(root).filter(file => file.endsWith('.md'))) {
  for (const match of readFileSync(file, 'utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (/^(https?:|#)/.test(target)) continue;
    assert.ok(existsSync(path.resolve(path.dirname(file), target.split('#')[0])), `Broken link in ${file}: ${target}`);
  }
}
console.log(`模板结构通过：${names.size} 个 Skills，安装路径与本地文档链接有效。`);
