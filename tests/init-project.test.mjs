import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { install } from '../scripts/init-project.mjs';

function sandbox(t) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ai-template-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('installs AI files and source metadata without template repo files', t => {
  const target = path.join(sandbox(t), '中文项目 with spaces');
  const result = install({ target, name: '我的应用' });
  assert.ok(result.files.length > 10);
  assert.match(readFileSync(path.join(target, 'docs/ai/PROJECT.md'), 'utf8'), /项目名称：我的应用/);
  assert.equal(JSON.parse(readFileSync(path.join(target, 'ai-assistant.json'))).version, '1.0.0');
  assert.ok(existsSync(path.join(target, 'docs/ai/TEMPLATE-LICENSE.txt')));
  assert.doesNotMatch(readFileSync(path.join(target, 'AGENTS.md'), 'utf8'), /node scripts\/check-template/);
  for (const file of ['.git', 'README.md', '.github', 'scripts', 'tests']) assert.ok(!existsSync(path.join(target, file)));
});

test('dry run creates no target directory', t => {
  const target = path.join(sandbox(t), 'preview');
  install({ target, dryRun: true });
  assert.ok(!existsSync(target));
});

test('late conflict prevents all writes and preserves existing data', t => {
  const target = sandbox(t);
  mkdirSync(path.join(target, 'docs/ai'), { recursive: true });
  const file = path.join(target, 'docs/ai/PROJECT.md');
  writeFileSync(file, 'existing project');
  assert.throws(() => install({ target }), /冲突/);
  assert.equal(readFileSync(file, 'utf8'), 'existing project');
  assert.ok(!existsSync(path.join(target, 'AGENTS.md')));
});

test('existing project application files are preserved', t => {
  const target = sandbox(t);
  writeFileSync(path.join(target, 'README.md'), 'business readme');
  install({ target });
  assert.equal(readFileSync(path.join(target, 'README.md'), 'utf8'), 'business readme');
  assert.throws(() => install({ target }), /冲突/);
});

test('parent file conflict prevents partial writes', t => {
  const target = sandbox(t);
  writeFileSync(path.join(target, 'rules'), 'not a directory');
  assert.throws(() => install({ target }), /冲突/);
  assert.ok(!existsSync(path.join(target, 'AGENTS.md')));
});

test('rejects target within template and invalid names', t => {
  assert.throws(() => install({ target: fileURLToPath(new URL('../nested', import.meta.url)) }), /目标不能/);
  assert.throws(() => install({ target: path.join(sandbox(t), 'invalid'), name: 'a\nb' }), /单行/);
});

test('rejects symlink or junction targets', t => {
  const temp = sandbox(t);
  const real = path.join(temp, 'real');
  const link = path.join(temp, 'link');
  mkdirSync(real);
  symlinkSync(real, link, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => install({ target: path.join(link, 'project') }), /符号链接/);
  assert.ok(!existsSync(path.join(real, 'project')));
});

test('CLI rejects unknown arguments without writes', t => {
  const target = path.join(sandbox(t), 'no-write');
  const result = spawnSync(process.execPath, ['scripts/init-project.mjs', '--target', target, '--force'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /未知参数/);
  assert.ok(!existsSync(target));
});
