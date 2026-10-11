// Run with: node --test tests/reusable-secret-scan.test.mjs
// Contract test for .github/workflows/reusable-secret-scan.yml (audit 2026-10-11).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const wf = readFileSync(
  fileURLToPath(new URL("../.github/workflows/reusable-secret-scan.yml", import.meta.url)),
  "utf8",
);
const code = wf
  .split("\n")
  .filter((l) => !l.trim().startsWith("#"))
  .join("\n");

function inputBlock(name) {
  const m = code.match(new RegExp(`\\n      ${name}:\\n((?:        .*\\n)+)`));
  assert.ok(m, `input ${name} not found`);
  return m[1];
}

test("blocking input defaults to true", () => {
  const block = inputBlock("blocking");
  assert.match(block, /^\s+type: boolean$/m);
  assert.match(block, /^\s+default: true$/m);
});

test("scan exit code follows the blocking input", () => {
  assert.match(code, /SCAN_EXIT_CODE: \$\{\{ inputs\.blocking && 1 \|\| 0 \}\}/);
  assert.match(code, /--exit-code "\$\{SCAN_EXIT_CODE\}"/);
});

test("checkout does not persist the job token", () => {
  const m = code.match(/- uses: actions\/checkout@[0-9a-f]{40}[^\n]*\n\s+with:\n((?:\s{10}.*\n)+)/);
  assert.ok(m, "pinned checkout step with `with:` block not found");
  assert.match(m[1], /persist-credentials: false/);
});

test("Infisical CLI is not installed via a piped remote script", () => {
  assert.doesNotMatch(code, /curl[^\n]*\|\s*(sudo\s+(-E\s+)?)?(ba)?sh/);
  assert.doesNotMatch(code, /apt-get install[^\n]*infisical/);
});

test("Infisical CLI download is version-pinned and checksum-verified", () => {
  assert.match(code, /INFISICAL_CLI_VERSION: "\d+\.\d+\.\d+"/);
  assert.match(code, /INFISICAL_CLI_SHA256: "[0-9a-f]{64}"/);
  assert.match(code, /sha256sum -c -/);
  const shaIdx = code.indexOf("sha256sum -c -");
  const tarIdx = code.indexOf("tar -xzf");
  assert.ok(tarIdx > shaIdx, "archive must be verified before it is extracted");
});
