// Run with: node --test tests/
// Audit 2026-10-11 (Low/Med): reusable-remote-image-build.yml trusted the SSH
// host key on first use and ran `git checkout --force` before the dirty check.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workflow = readFileSync(path.join(root, ".github/workflows/reusable-remote-image-build.yml"), "utf8");

function dedent(block) {
  const lines = block.split("\n");
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(indent)).join("\n");
}

function between(start, end) {
  const found = workflow.indexOf(start);
  const to = workflow.indexOf(end, found);
  assert.ok(found !== -1 && to !== -1, `markers not found: ${start} .. ${end}`);
  const from = workflow.lastIndexOf("\n", found) + 1;
  return dedent(workflow.slice(from, to + end.length));
}

test("pins the SSH host key when SERVER_HOST_KEY is set", () => {
  const snippet = between("mkdir -p ~/.ssh", "chmod 600 ~/.ssh/config");
  const home = mkdtempSync(path.join(tmpdir(), "rrib-home-"));
  const run = (hostKey) =>
    execFileSync("bash", ["-euo", "pipefail", "-c", snippet], {
      env: { PATH: process.env.PATH, HOME: home, SSH_HOST: "build-host", SSH_USER: "ci", SSH_HOST_KEY: hostKey },
      encoding: "utf8",
    });

  run("ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExampleKey\r\n");
  assert.equal(readFileSync(path.join(home, ".ssh/known_hosts"), "utf8"), "build-host ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExampleKey\n");
  assert.match(readFileSync(path.join(home, ".ssh/config"), "utf8"), /StrictHostKeyChecking yes/);

  const out = run("");
  assert.match(out, /::warning::SERVER_HOST_KEY is not set/);
  assert.match(readFileSync(path.join(home, ".ssh/config"), "utf8"), /StrictHostKeyChecking accept-new/);
});

test("refuses to check out over local tracked changes and never forces", () => {
  assert.doesNotMatch(workflow, /git checkout --force/);
  const snippet = between('# Check for local tracked changes BEFORE checkout', 'git checkout --detach "${BUILD_SHA}"');

  const repo = mkdtempSync(path.join(tmpdir(), "rrib-repo-"));
  const git = (...args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" }).trim();
  git("init", "-q");
  git("config", "user.email", "t@example.com");
  git("config", "user.name", "t");
  writeFileSync(path.join(repo, "app.txt"), "v1\n");
  git("add", ".");
  git("commit", "-qm", "v1");
  writeFileSync(path.join(repo, "app.txt"), "v2\n");
  git("commit", "-qam", "v2");
  const buildSha = git("rev-parse", "HEAD~1");

  writeFileSync(path.join(repo, "app.txt"), "hotfix on host\n");
  const runGuard = () =>
    execFileSync("bash", ["-euo", "pipefail", "-c", `cd "${repo}"\n${snippet}`], {
      env: { PATH: process.env.PATH, BUILD_SHA: buildSha },
      encoding: "utf8",
      stdio: "pipe",
    });
  assert.throws(runGuard, /Refusing to check out over local tracked changes/);
  assert.equal(readFileSync(path.join(repo, "app.txt"), "utf8"), "hotfix on host\n");

  git("checkout", "--", "app.txt");
  writeFileSync(path.join(repo, "untracked.log"), "x");
  runGuard();
  assert.equal(git("rev-parse", "HEAD"), buildSha);
});

test("documents the publish-needs-every-gate rule and uses no internal host paths", () => {
  const reuseDoc = readFileSync(path.join(root, "docs/ci-tree-reuse.md"), "utf8");
  assert.match(reuseDoc, /`needs:` \*\*every\*\* gate/);
  const remoteDoc = readFileSync(path.join(root, "docs/reusable-remote-image-build.md"), "utf8");
  assert.doesNotMatch(remoteDoc, /tech-dept/);
  assert.match(remoteDoc, /SERVER_HOST_KEY/);
});

test("notification webhook is host-allowlisted before curl (Wave-23)", () => {
  assert.match(workflow, /hooks\.slack\.com/);
  assert.match(workflow, /open\.feishu\.cn/);
  assert.match(workflow, /open\.larksuite\.com/);
  assert.match(workflow, /open\.larkoffice\.com/);
  assert.match(workflow, /NORMALIZED=/);
  const notify = workflow.slice(workflow.indexOf("Send notification"));
  assert.match(notify, /"\$\{NORMALIZED\}"/);
  assert.doesNotMatch(notify, /curl[\s\S]*"\$\{SLACK_WEBHOOK\}"/);
  const allowMatch = notify.match(/allowed = \{([^}]+)\}/);
  assert.ok(allowMatch);
  assert.doesNotMatch(allowMatch[1], /feishu\.net/);
});

test("python allowlist accepts Slack/Feishu and rejects evil hosts", () => {
  const notify = workflow.slice(workflow.indexOf("Send notification"));
  const m = notify.match(/python3 - "\$SLACK_WEBHOOK" <<'PY'\n([\s\S]*?)\nPY\n\)"/);
  assert.ok(m, "python heredoc allowlist snippet missing");
  const py = m[1];
  const run = (url) => {
    try {
      return execFileSync("python3", ["-", url], {
        input: py + "\n",
        env: { ...process.env },
        encoding: "utf8",
      }).trim();
    } catch (err) {
      const e = /** @type {any} */ (err);
      throw new Error(String(e.stderr || e.message));
    }
  };
  assert.equal(run("https://hooks.slack.com/services/T/B/x"), "https://hooks.slack.com/services/T/B/x");
  assert.equal(
    run("https://open.feishu.cn/open-apis/bot/v2/hook/abc"),
    "https://open.feishu.cn/open-apis/bot/v2/hook/abc",
  );
  assert.equal(
    run("https://open.larkoffice.com/open-apis/bot/v2/hook/abc"),
    "https://open.larkoffice.com/open-apis/bot/v2/hook/abc",
  );
  assert.throws(() => run("https://evil.example/hook"), /not allowlisted/);
  assert.throws(() => run("https://open.feishu.net/open-apis/bot/v2/hook/x"), /not allowlisted/);
  assert.throws(() => run("http://hooks.slack.com/x"), /https without credentials/);
});
