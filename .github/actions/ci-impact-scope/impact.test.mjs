import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { classify, collect } from './impact.mjs';
const rules = { version: 1, frontend: { prefixes: ['frontend/'], files: [] }, backend: { prefixes: ['src/', 'tests/', 'migrations/'], files: [] }, full: { prefixes: ['shared/'], files: ['src/types.ts'] } };
const run = (paths, expected = paths.length) => classify(paths.map((x) => typeof x === 'string' ? { filename: x } : x), expected, rules);
test('independent scopes and harmless documentation companions', () => {
  assert.equal(run(['README.md']).scope, 'docs');
  assert.equal(run(['README.md', 'frontend/app.tsx']).scope, 'frontend');
  assert.deepEqual(run(['src/service.ts']), { scope: 'backend', migrations: false, reason: 'complete-files' });
  assert.equal(run(['migrations/001.sql']).migrations, true);
});
test('global, shared, agent controls, unknown, and mixed paths require all gates', () => {
  for (const paths of [['shared/types.ts'], ['src/types.ts'], ['AGENTS.md'], ['.github/a.md'], ['package.json'], ['new-area/code.ts'], ['src/a.ts', 'frontend/a.tsx']]) assert.equal(run(paths).scope, 'full');
});
test('file-object count remains correct for renames; old and new paths both matter', () => {
  assert.equal(run([{ filename: 'src/new.ts', previous_filename: 'src/old.ts' }], 1).scope, 'backend');
  assert.equal(run([{ filename: 'frontend/a.ts', previous_filename: 'src/a.ts' }], 1).scope, 'full');
  assert.equal(run([{ filename: 'README.md', previous_filename: 'src/a.ts' }], 1).scope, 'full');
});
test('specific frontend boundaries override a broad backend prefix; full still wins', () => {
  const nested = { ...rules, frontend: { prefixes: ['src/frontend/'], files: ['tests/ui.tsx'] } };
  assert.equal(classify([{ filename: 'src/frontend/App.tsx' }], 1, nested).scope, 'frontend');
  assert.equal(classify([{ filename: 'tests/ui.tsx' }], 1, nested).scope, 'frontend');
  assert.equal(classify([{ filename: 'src/types.ts' }], 1, nested).scope, 'full');
});
test('missing, malformed, incomplete, and capped data fail closed', () => {
  assert.equal(run([]).scope, 'full');
  assert.equal(run(['README.md'], 2).scope, 'full');
  assert.equal(run(['README.md', 'README.md'], 2).scope, 'full');
  assert.equal(run(Array.from({ length: 3000 }, (_, i) => `docs/${i}.md`)).scope, 'full');
  assert.equal(run([{ filename: '../outside.md' }]).scope, 'full');
  assert.equal(classify([{ filename: 'README.md' }], 1, {}).scope, 'full');
  assert.equal(collect({ PR_NUMBER: '2', GITHUB_REPOSITORY: 'a/b' }, () => { throw new Error('403'); }).scope, 'full');
});
test('collection verifies the event head before and after complete pagination', () => {
  const dir = mkdtempSync(`${tmpdir()}/impact-rules-`);
  try {
    const path = `${dir}/rules.json`; writeFileSync(path, JSON.stringify(rules));
    const sha = 'a'.repeat(40);
    const env = { PR_NUMBER: '2', GITHUB_REPOSITORY: 'a/b', EXPECTED_HEAD: sha, DOMAINS_FILE: path };
    const read = (endpoint) => endpoint.includes('/files?') ? [[{ filename: 'frontend/app.tsx' }]] : { head: { sha }, changed_files: 1 };
    assert.equal(collect(env, read).scope, 'frontend');
    let n = 0;
    assert.equal(collect(env, (endpoint) => endpoint.includes('/files?') ? read(endpoint) : { head: { sha: n++ ? 'b'.repeat(40) : sha }, changed_files: 1 }).scope, 'full');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
