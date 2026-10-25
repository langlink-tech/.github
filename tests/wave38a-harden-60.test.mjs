import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
test('wave38a-harden-60: reusable-secret-scan keeps checksum after bounded curl', () => {
  const src = readFileSync('.github/workflows/reusable-secret-scan.yml', 'utf8');
  assert.match(src, /--max-redirs\s+5/);
  assert.ok(src.includes('sha256sum'));
  assert.ok(src.includes('INFISICAL_CLI_SHA256'));
  // must not drop --location semantics: -fsSL includes L
  assert.match(src, /curl\s+-fsSL/);
});
