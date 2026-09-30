// Run with: node --test .github/actions/ci-tree-reuse/
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { resolveTestedTree, resolveTreeReuse, workflowFile } from "./reuse.mjs";

const repository = "langlink-tech/example";
const sha = "a".repeat(40), head = "b".repeat(40), tree = "c".repeat(40), other = "e".repeat(40);
const pr = { number: 7, merged_at: "2026-09-28T00:00:00Z", merge_commit_sha: sha, base: { ref: "main" }, head: { sha: head, repo: { full_name: repository } } };
const prRun = { id: 99, head_sha: head, event: "pull_request", conclusion: "success", created_at: "2026-09-28T00:00:00Z", head_repository: { full_name: repository } };
const mgRun = { id: 77, head_sha: sha, event: "merge_group", conclusion: "success", created_at: "2026-09-28T00:01:00Z", head_repository: { full_name: repository } };
const evidence = (name = tree, expired = false) => ({ artifacts: [{ name: `tested-tree-${name}`, expired }] });

// Routes are keyed by path plus the `event` query so merge_group and pull_request lookups differ.
function github(overrides = {}) {
  const routes = {
    [`/git/commits/${sha}`]: { tree: { sha: tree } },
    "/actions/workflows/ci.yml/runs?merge_group": { workflow_runs: [] },
    "/actions/workflows/ci.yml/runs?pull_request": { workflow_runs: [prRun] },
    [`/commits/${sha}/pulls`]: [pr],
    "/actions/runs/99/artifacts": evidence(),
    "/actions/runs/77/artifacts": evidence(),
    ...overrides,
  };
  const calls = [];
  const fetchImpl = async (url) => {
    const parsed = new URL(url);
    let path = parsed.pathname.replace(`/repos/${repository}`, "");
    if (parsed.searchParams.get("event")) path += `?${parsed.searchParams.get("event")}`;
    calls.push(path);
    if (routes[path] === undefined) return { ok: false, status: 404, json: async () => ({}) };
    if (routes[path] === 500) return { ok: false, status: 500, json: async () => ({}) };
    return { ok: true, json: async () => routes[path] };
  };
  return Object.assign(fetchImpl, { calls });
}

const resolve = (fetchImpl, extra = {}) =>
  resolveTreeReuse({ repository, sha, token: "t", workflow: "ci.yml", branch: "main", event: "push", fetchImpl, ...extra });

describe("resolveTreeReuse", () => {
  it("reuses a successful same-repository PR run that recorded this exact tree", async () => {
    assert.deepEqual(await resolve(github()), {
      reuse: true, reason: "pull_request-tested-this-tree", tree, runId: 99, sourceEvent: "pull_request", pr: 7,
    });
  });

  it("prefers a merge-group run on the pushed commit and skips the PR lookup", async () => {
    const fetchImpl = github({ "/actions/workflows/ci.yml/runs?merge_group": { workflow_runs: [mgRun] } });
    assert.deepEqual(await resolve(fetchImpl), {
      reuse: true, reason: "merge_group-tested-this-tree", tree, runId: 77, sourceEvent: "merge_group",
    });
    assert.ok(!fetchImpl.calls.some((path) => path.includes("/pulls")));
  });

  it("does not trust the PR head when the run tested a different synthetic merge", async () => {
    const result = await resolve(github({ "/actions/runs/99/artifacts": evidence(other) }));
    assert.equal(result.reuse, false);
    assert.equal(result.reason, "tested-tree-mismatch");
  });

  it("checks older successful runs when the newest one lacks evidence", async () => {
    const newer = { ...prRun, id: 100, created_at: "2026-09-29T00:00:00Z" };
    const fetchImpl = github({
      "/actions/workflows/ci.yml/runs?pull_request": { workflow_runs: [prRun, newer] },
      "/actions/runs/100/artifacts": { artifacts: [] },
    });
    assert.equal((await resolve(fetchImpl)).runId, 99);
  });

  it("runs full CI when a newer run of the same head failed after an older success", async () => {
    const newerFailure = { ...prRun, id: 100, conclusion: "failure", created_at: "2026-09-29T00:00:00Z" };
    const result = await resolve(github({ "/actions/workflows/ci.yml/runs?pull_request": { workflow_runs: [prRun, newerFailure] } }));
    assert.deepEqual(result, { reuse: false, reason: "newer-source-run-not-successful", tree, runId: 100, pr: 7 });
  });

  it("runs full CI when the newest merge-group run was cancelled after an older success", async () => {
    const newerCancel = { ...mgRun, id: 78, conclusion: "cancelled", created_at: "2026-09-28T00:02:00Z" };
    const result = await resolve(github({ "/actions/workflows/ci.yml/runs?merge_group": { workflow_runs: [mgRun, newerCancel] } }));
    assert.equal(result.reuse, false);
    assert.equal(result.reason, "newer-source-run-not-successful");
  });

  it("still reuses when an older run failed and the newest run succeeded", async () => {
    const olderFailure = { ...prRun, id: 98, conclusion: "failure", created_at: "2026-09-27T00:00:00Z" };
    const result = await resolve(github({ "/actions/workflows/ci.yml/runs?pull_request": { workflow_runs: [olderFailure, prRun] } }));
    assert.equal(result.reuse, true);
    assert.equal(result.runId, 99);
  });

  it("ignores newer runs from forks when choosing the latest applicable run", async () => {
    const forkFailure = { ...prRun, id: 100, conclusion: "failure", created_at: "2026-09-29T00:00:00Z", head_repository: { full_name: "fork/example" } };
    const result = await resolve(github({ "/actions/workflows/ci.yml/runs?pull_request": { workflow_runs: [prRun, forkFailure] } }));
    assert.equal(result.reuse, true);
  });

  const failClosed = [
    ["not-a-push", {}, { event: "pull_request" }],
    ["missing-input", {}, { token: "" }],
    ["missing-input", {}, { sha: "main" }],
    ["missing-input", {}, { workflow: "" }],
    ["missing-input", {}, { prefix: "Bad/Prefix" }],
    ["tree-unavailable", { [`/git/commits/${sha}`]: { tree: {} } }],
    ["no-merge-group-or-merged-pr", { [`/commits/${sha}/pulls`]: [] }],
    ["no-merge-group-or-merged-pr", { [`/commits/${sha}/pulls`]: [{ ...pr, merged_at: null }] }],
    ["no-merge-group-or-merged-pr", { [`/commits/${sha}/pulls`]: [{ ...pr, merge_commit_sha: head }] }],
    ["no-merge-group-or-merged-pr", { [`/commits/${sha}/pulls`]: [{ ...pr, base: { ref: "release" } }] }],
    ["no-merge-group-or-merged-pr", { [`/commits/${sha}/pulls`]: [{ ...pr, head: { sha: head, repo: { full_name: "fork/example" } } }] }],
    ["no-successful-source-run", { "/actions/workflows/ci.yml/runs?pull_request": { workflow_runs: [{ ...prRun, conclusion: "failure" }] } }],
    ["no-successful-source-run", { "/actions/workflows/ci.yml/runs?pull_request": { workflow_runs: [{ ...prRun, event: "push" }] } }],
    ["no-successful-source-run", { "/actions/workflows/ci.yml/runs?pull_request": { workflow_runs: [{ ...prRun, head_sha: other }] } }],
    ["no-successful-source-run", { "/actions/workflows/ci.yml/runs?pull_request": { workflow_runs: [{ ...prRun, head_repository: { full_name: "fork/example" } }] } }],
    ["no-successful-source-run", { "/actions/workflows/ci.yml/runs?merge_group": { workflow_runs: [{ ...mgRun, conclusion: "cancelled" }] } }],
    ["tested-tree-mismatch", { "/actions/runs/99/artifacts": { artifacts: [] } }],
    ["tested-tree-mismatch", { "/actions/runs/99/artifacts": evidence(tree, true) }],
    ["github-api-error", { [`/git/commits/${sha}`]: 500 }],
    ["github-api-error", { [`/commits/${sha}/pulls`]: 500 }],
  ];
  for (const [reason, overrides, extra] of failClosed) {
    it(`runs full CI when ${reason} (${JSON.stringify(extra ?? Object.keys(overrides))})`, async () => {
      const result = await resolve(github(overrides), extra);
      assert.equal(result.reuse, false);
      assert.equal(result.reason, reason);
    });
  }
});

describe("resolveTestedTree", () => {
  it("names the tree of the tested commit", async () => {
    assert.deepEqual(await resolveTestedTree({ repository, sha, token: "t", fetchImpl: github() }), { tree, reason: "tree-resolved" });
  });

  it("fails without evidence on API errors or bad input", async () => {
    assert.equal((await resolveTestedTree({ repository, sha, token: "t", fetchImpl: github({ [`/git/commits/${sha}`]: 500 }) })).tree, "");
    assert.equal((await resolveTestedTree({ repository, sha: "HEAD", token: "t", fetchImpl: github() })).tree, "");
  });
});

describe("workflowFile", () => {
  it("extracts the calling workflow file", () => {
    assert.equal(workflowFile("langlink-tech/example/.github/workflows/ci.yml@refs/heads/main"), "ci.yml");
    assert.equal(workflowFile("langlink-tech/example/.github/workflows/quality-gates.yaml@refs/pull/3/merge"), "quality-gates.yaml");
    assert.equal(workflowFile(""), "");
  });
});

describe("CLI entrypoint", () => {
  const script = fileURLToPath(new URL("./reuse.mjs", import.meta.url));
  const run = async (env) => {
    const dir = await mkdtemp(join(tmpdir(), "ci-tree-reuse-"));
    const output = join(dir, "out");
    const baseEnv = { PATH: process.env.PATH, GITHUB_OUTPUT: output, GITHUB_REPOSITORY: repository, GITHUB_API_URL: "http://127.0.0.1:9" };
    let code = 0, stdout = "";
    try {
      ({ stdout } = await promisify(execFile)(process.execPath, [script], { env: { ...baseEnv, ...env } }));
    } catch (error) {
      code = error.code; stdout = error.stdout;
    }
    const written = await readFile(output, "utf8").catch(() => "");
    return { code, stdout, written };
  };

  it("resolve on a non-push event reports reuse=false without calling GitHub", async () => {
    const { code, written } = await run({ INPUT_MODE: "resolve", INPUT_TOKEN: "t", GITHUB_EVENT_NAME: "pull_request", GITHUB_SHA: sha, GITHUB_REF_NAME: "7/merge", GITHUB_WORKFLOW_REF: `${repository}/.github/workflows/ci.yml@refs/pull/7/merge` });
    assert.equal(code, 0);
    assert.match(written, /^reuse=false$/m);
    assert.match(written, /^reason=not-a-push$/m);
  });

  it("resolve fails closed when GitHub is unreachable", async () => {
    const { code, written } = await run({ INPUT_MODE: "resolve", INPUT_TOKEN: "t", GITHUB_EVENT_NAME: "push", GITHUB_SHA: sha, GITHUB_REF_NAME: "main", GITHUB_WORKFLOW_REF: `${repository}/.github/workflows/ci.yml@refs/heads/main` });
    assert.equal(code, 0);
    assert.match(written, /^reuse=false$/m);
    assert.match(written, /^reason=github-api-error$/m);
  });

  it("publish on a push event publishes nothing", async () => {
    const { code, written } = await run({ INPUT_MODE: "publish", INPUT_TOKEN: "t", GITHUB_EVENT_NAME: "push", GITHUB_SHA: sha });
    assert.equal(code, 0);
    assert.match(written, /^publish=false$/m);
  });

  it("publish rejects an unsafe evidence prefix", async () => {
    const { code } = await run({ INPUT_MODE: "publish", INPUT_TOKEN: "t", GITHUB_EVENT_NAME: "pull_request", GITHUB_SHA: sha, INPUT_EVIDENCE_PREFIX: "../x" });
    assert.equal(code, 1);
  });

  it("rejects an unknown mode", async () => {
    assert.equal((await run({ INPUT_MODE: "skip" })).code, 1);
  });
});
