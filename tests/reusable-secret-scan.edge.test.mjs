// Edge/negative tests for reusable-secret-scan.yml (verification 2026-10-11).
// Runs the install step's shell locally with a stubbed `curl` (no network).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, existsSync, chmodSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const wf = readFileSync(path.join(root, ".github/workflows/reusable-secret-scan.yml"), "utf8");

function step(name) {
  const re = new RegExp(`\\n      - name: ${name.replace(/[()]/g, "\\$&")}\\n((?:        .*\\n|\\s*\\n)+)`);
  const m = wf.match(re);
  assert.ok(m, `step ${name} not found`);
  return m[1];
}
function runBlock(body) {
  const m = body.match(/        run: \|\n((?:          .*\n|\s*\n)+)/);
  assert.ok(m);
  return m[1].split("\n").map((l) => l.replace(/^ {10}/, "")).join("\n");
}

const install = step("Install Infisical CLI (pinned, checksum-verified)");
const installScript = runBlock(install);

function makeTarball(dir, content) {
  const src = path.join(dir, "src");
  mkdirSync(src, { recursive: true });
  writeFileSync(path.join(src, "infisical"), `#!/bin/sh\necho "${content}"\n`);
  chmodSync(path.join(src, "infisical"), 0o755);
  writeFileSync(path.join(src, "README.md"), "x");
  const tgz = path.join(dir, "cli.tar.gz");
  execFileSync("tar", ["-czf", tgz, "-C", src, "infisical", "README.md"]);
  return { tgz, sha: createHash("sha256").update(readFileSync(tgz)).digest("hex") };
}

function runInstall({ tarball, sha }) {
  const dir = mkdtempSync(path.join(tmpdir(), "secscan-"));
  const bin = path.join(dir, "stubbin");
  mkdirSync(bin);
  // curl stub: copy the local tarball to the -o target, record the URL.
  writeFileSync(
    path.join(bin, "curl"),
    `#!/bin/bash\nout="";url=""\nwhile [ $# -gt 0 ]; do case "$1" in -o) out="$2"; shift 2;; -*) shift;; *) url="$1"; shift;; esac; done\necho "$url" > "${dir}/url"\ncp "${tarball}" "$out"\n`,
  );
  chmodSync(path.join(bin, "curl"), 0o755);
  const runnerTemp = path.join(dir, "rt");
  mkdirSync(runnerTemp);
  const ghPath = path.join(dir, "GITHUB_PATH");
  writeFileSync(ghPath, "");
  const r = spawnSync("bash", ["-c", installScript], {
    env: { PATH: `${bin}:${process.env.PATH}`, RUNNER_TEMP: runnerTemp, GITHUB_PATH: ghPath, INFISICAL_CLI_VERSION: "0.43.138", INFISICAL_CLI_SHA256: sha },
    encoding: "utf8",
  });
  return { r, dir, runnerTemp, ghPath: readFileSync(ghPath, "utf8"), url: existsSync(path.join(dir, "url")) ? readFileSync(path.join(dir, "url"), "utf8").trim() : "" };
}

test("install: good archive is verified, only the binary extracted, PATH appended", () => {
  const work = mkdtempSync(path.join(tmpdir(), "tgz-"));
  const { tgz, sha } = makeTarball(work, "ok");
  const { r, runnerTemp, ghPath, url } = runInstall({ tarball: tgz, sha });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(url, "https://github.com/Infisical/cli/releases/download/v0.43.138/cli_0.43.138_linux_amd64.tar.gz");
  assert.ok(existsSync(path.join(runnerTemp, "infisical-cli/bin/infisical")));
  assert.ok(!existsSync(path.join(runnerTemp, "infisical-cli/bin/README.md")));
  assert.equal(ghPath.trim(), path.join(runnerTemp, "infisical-cli/bin"));
});

test("install: tampered archive fails before extraction and PATH is untouched", () => {
  const work = mkdtempSync(path.join(tmpdir(), "tgz-"));
  const good = makeTarball(work, "ok");
  const evil = makeTarball(mkdtempSync(path.join(tmpdir(), "tgz-")), "evil");
  const { r, runnerTemp, ghPath } = runInstall({ tarball: evil.tgz, sha: good.sha });
  assert.notEqual(r.status, 0);
  assert.ok(!existsSync(path.join(runnerTemp, "infisical-cli/bin/infisical")));
  assert.equal(ghPath, "");
});

test("install: empty/short checksum value is never accepted", () => {
  const work = mkdtempSync(path.join(tmpdir(), "tgz-"));
  const { tgz, sha } = makeTarball(work, "ok");
  for (const bad of ["", sha.slice(0, 63), sha.toUpperCase().replace(/./, "X")]) {
    const { r, ghPath } = runInstall({ tarball: tgz, sha: bad });
    assert.notEqual(r.status, 0, JSON.stringify(bad));
    assert.equal(ghPath, "");
  }
});

test("install: pinned values are well-formed and tied to the same version", () => {
  assert.match(install, /INFISICAL_CLI_VERSION: "0\.43\.138"/);
  assert.match(install, /INFISICAL_CLI_SHA256: "[0-9a-f]{64}"/);
  assert.match(installScript, /^set -euo pipefail/m);
  assert.doesNotMatch(installScript, /\bsudo\b|apt-get|\|\s*(ba)?sh\b|-k\b|--insecure/);
  assert.match(installScript, /curl -fsSL/); // -f: HTTP errors fail the step
});

// GitHub expression `inputs.blocking && 1 || 0` evaluated with Actions semantics.
const ghaAndOr = (blocking) => (blocking ? 1 : 0) || 0;
test("scan exit-code expression: blocking true -> 1, false -> 0, default -> 1", () => {
  assert.equal(ghaAndOr(true), 1);
  assert.equal(ghaAndOr(false), 0);
  const def = wf.match(/\n      blocking:\n(?:        .*\n)+/)[0];
  assert.match(def, /default: true/);
  assert.match(def, /type: boolean/);
});

test("scan step: redacted, fail-fast shell, no verbose/secret echo", () => {
  const s = runBlock(step("Run redacted secret scan"));
  assert.match(s, /^set -euo pipefail/m);
  assert.match(s, /--redact\b/);
  assert.doesNotMatch(s, /--verbose|set -x|\becho\b.*\$\{?\w*(TOKEN|SECRET)/i);
  assert.match(s, /--exit-code "\$\{SCAN_EXIT_CODE\}"/);
});

test("every checkout in the workflow drops credentials", () => {
  const checkouts = [...wf.matchAll(/- uses: actions\/checkout@[^\n]*\n((?:\s{8,}.*\n)*)/g)];
  assert.ok(checkouts.length > 0);
  for (const [, body] of checkouts) assert.match(body, /persist-credentials: false/);
});

test("no secrets inheritance, no pull_request_target, actions pinned by SHA", () => {
  assert.doesNotMatch(wf, /secrets:\s*inherit|pull_request_target/);
  for (const m of wf.matchAll(/uses: ([^\s]+)/g)) assert.match(m[1], /@[0-9a-f]{40}$/, m[1]);
});

test("SARIF upload cannot fail the scan and only runs when opted in", () => {
  const up = step("Upload SARIF to code scanning");
  assert.match(up, /if: \$\{\{ always\(\) && inputs\.upload-sarif \}\}/);
  assert.match(up, /continue-on-error: true/);
});
