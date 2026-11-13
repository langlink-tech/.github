import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
test('reusable-secret-scan Infisical CLI curl bounds redirects', () => {
  const src = readFileSync('.github/workflows/reusable-secret-scan.yml', 'utf8');
  assert.match(src, /curl\s+-fsSL\s+--max-redirs\s+5/);
  assert.ok(src.includes('Infisical/cli/releases'));
});
