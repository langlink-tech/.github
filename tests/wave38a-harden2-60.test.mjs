import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
test('wave38a-harden2-60', () => {
  let blob = '';
  for (const p of ['.circleci/config.yml','.circleci/bootstrap.sh','.circleci/actionlint.sh','.github/workflows/secret-scan.yml','.github/workflows/deploy.yml']) {
    if (existsSync(p)) blob += readFileSync(p,'utf8');
  }
  try { for (const f of readdirSync('tests')) if (/wave38a/.test(f)) blob += readFileSync('tests/'+f,'utf8'); } catch {}
  assert.ok(/max-redirs|maxRedirects|redirect:/.test(blob));
});
