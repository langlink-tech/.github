// Run with: node --test tests/quality-checkout-credentials.test.mjs
// Reusable quality workflows run caller-controlled install/lint/test/build commands
// (PR code); actions/checkout must not leave the job token in .git/config for them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const FILES = [".github/workflows/reusable-node-quality.yml", ".github/workflows/reusable-python-quality.yml"];
const read = (f) => readFileSync(path.join(root, f), "utf8");

for (const f of FILES) {
  test(`${f}: every checkout sets persist-credentials: false`, () => {
    const wf = read(f);
    const steps = [...wf.matchAll(/\n( +)- uses: actions\/checkout@[^\n]*\n((?:\1  .*\n)*)/g)];
    assert.ok(steps.length > 0);
    for (const [, , body] of steps) assert.match(body, /^\s+with:\n\s+persist-credentials: false$/m, body);
  });

  test(`${f}: base-commit fetch gets the token only via a one-shot extraheader`, () => {
    const wf = read(f);
    assert.doesNotMatch(wf, /\|\| git fetch /, "bare fetch would now be unauthenticated on private repos");
    const fetches = [...wf.matchAll(/git -c "http\.\$\{GITHUB_SERVER_URL\}\/\.extraheader=AUTHORIZATION: basic \$\(printf 'x-access-token:%s' "\$\{FETCH_TOKEN\}" \| base64 -w0\)"/g)];
    const decide = [...wf.matchAll(/- name: Decide whether workflow files changed\n((?:\s{8,}.*\n|\s*\n)+?)\s+run: \|/g)];
    assert.equal(fetches.length, decide.length);
    for (const [, head] of decide) assert.match(head, /FETCH_TOKEN: \$\{\{ github\.token \}\}/);
    assert.doesNotMatch(wf.split("jobs:")[0], /FETCH_TOKEN/);
  });
}

function decideScript(f) {
  const wf = read(f);
  const m = wf.match(/- name: Decide whether workflow files changed\n(?:\s{8,}.*\n|\s*\n)+?\s+run: \|\n((?:\s{10}.*\n|\s*\n)+)/);
  return m[1].split("\n").map((l) => l.replace(/^ {10}/, "")).join("\n");
}

const GIT_ENV = { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" };
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", env: GIT_ENV }).trim();

for (const f of FILES) {
  test(`${f}: decide step still fetches a missing base into a shallow clone (local repo)`, () => {
    const dir = mkdtempSync(path.join(tmpdir(), "qcc-"));
    const origin = path.join(dir, "origin");
    git(dir, "init", "-q", "-b", "main", origin);
    writeFileSync(path.join(origin, "a.txt"), "1");
    git(origin, "add", ".");
    git(origin, "commit", "-qm", "base");
    const base = git(origin, "rev-parse", "HEAD");
    writeFileSync(path.join(origin, "a.txt"), "2");
    git(origin, "commit", "-qam", "head");
    const head = git(origin, "rev-parse", "HEAD");
    git(origin, "config", "uploadpack.allowReachableSHA1InWant", "true");
    const clone = path.join(dir, "clone");
    git(dir, "clone", "-q", "--depth=1", `file://${origin}`, clone);
    const out = path.join(dir, "out");
    writeFileSync(out, "");
    const r = spawnSync("bash", ["-c", decideScript(f)], {
      cwd: clone,
      encoding: "utf8",
      env: { ...GIT_ENV, EVENT_NAME: "pull_request", PR_BASE_SHA: base, PR_HEAD_SHA: head, GITHUB_SHA_VALUE: head, GITHUB_OUTPUT: out, GITHUB_SERVER_URL: "https://github.com", FETCH_TOKEN: "dummy", ACTIONLINT_SHELLCHECK: "off" },
    });
    assert.equal(r.status, 0, r.stderr);
    assert.match(readFileSync(out, "utf8"), /run=false/);
    assert.doesNotMatch(git(clone, "config", "--local", "--list"), /extraheader|dummy/);
  });
}
