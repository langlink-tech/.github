// Tested-tree evidence for skipping duplicate CI on default-branch pushes.
//
// publish: a successful pull_request or merge_group run names the git tree it actually
//          checked out (GitHub's synthetic merge or the merge-group commit, not the PR head).
// resolve: a push may skip work only when a successful same-repository run of the same
//          workflow published evidence for exactly the pushed tree. Any doubt returns
//          reuse=false so the caller runs its full graph.
import { appendFile } from "node:fs/promises";

const SHA_RE = /^[a-f0-9]{40}$/;
const PREFIX_RE = /^[a-z0-9][a-z0-9-]{0,40}$/;
const EVIDENCE_EVENTS = new Set(["pull_request", "merge_group"]);

async function githubJson(path, { apiUrl, repository, token, fetchImpl }) {
  const response = await fetchImpl(`${apiUrl}/repos/${repository}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) throw new Error(`github-api-${response.status}`);
  return response.json();
}

/** Workflow file name from GITHUB_WORKFLOW_REF (`owner/repo/.github/workflows/ci.yml@refs/...`). */
export function workflowFile(workflowRef) {
  const match = /\/\.github\/workflows\/([^/@]+\.ya?ml)@/.exec(workflowRef || "");
  return match ? match[1] : "";
}

const list = (payload, key) => (Array.isArray(payload?.[key]) ? payload[key] : []);

async function treeOf(api, sha) {
  const tree = (await api(`/git/commits/${sha}`))?.tree?.sha;
  return SHA_RE.test(tree || "") ? tree : "";
}

export async function resolveTestedTree({ repository, sha, token, apiUrl = "https://api.github.com", fetchImpl = fetch }) {
  if (!repository || !SHA_RE.test(sha || "") || !token) return { tree: "", reason: "missing-input" };
  try {
    const tree = await treeOf((path) => githubJson(path, { apiUrl, repository, token, fetchImpl }), sha);
    return tree ? { tree, reason: "tree-resolved" } : { tree: "", reason: "tree-unavailable" };
  } catch {
    return { tree: "", reason: "github-api-error" };
  }
}

export async function resolveTreeReuse({
  repository, sha, token, workflow, branch, event, prefix = "tested-tree",
  apiUrl = "https://api.github.com", fetchImpl = fetch,
}) {
  if (event !== "push") return { reuse: false, reason: "not-a-push" };
  if (!repository || !SHA_RE.test(sha || "") || !token || !workflow || !branch || !PREFIX_RE.test(prefix)) {
    return { reuse: false, reason: "missing-input" };
  }
  const api = (path) => githubJson(path, { apiUrl, repository, token, fetchImpl });
  try {
    const pushedTree = await treeOf(api, sha);
    if (!pushedTree) return { reuse: false, reason: "tree-unavailable" };

    // Candidates, strongest first: a merge-group run on the pushed commit itself, then the
    // pull_request runs of the same-repository PR whose merge produced this commit.
    const candidates = [];
    const mergeGroup = await api(`/actions/workflows/${workflow}/runs?head_sha=${sha}&event=merge_group&status=completed&per_page=20`);
    candidates.push(...list(mergeGroup, "workflow_runs").filter((run) => run?.head_sha === sha && run.event === "merge_group"));

    let pr;
    if (candidates.length === 0) {
      const pulls = await api(`/commits/${sha}/pulls?per_page=10`);
      pr = (Array.isArray(pulls) ? pulls : []).find((candidate) =>
        candidate?.merged_at && candidate.merge_commit_sha === sha && candidate.base?.ref === branch
        && candidate.head?.repo?.full_name === repository && SHA_RE.test(candidate.head?.sha || ""));
      if (!pr) return { reuse: false, reason: "no-merge-group-or-merged-pr", tree: pushedTree };
      const head = pr.head.sha;
      const prRuns = await api(`/actions/workflows/${workflow}/runs?head_sha=${head}&event=pull_request&status=completed&per_page=20`);
      candidates.push(...list(prRuns, "workflow_runs").filter((run) => run?.head_sha === head && run.event === "pull_request"));
    }

    const newestFirst = (left, right) =>
      String(right.created_at || "").localeCompare(String(left.created_at || "")) || (right.id || 0) - (left.id || 0);
    const sameRepository = candidates
      .filter((run) => run.head_repository?.full_name === repository)
      .sort(newestFirst);
    const successful = sameRepository.filter((run) => run.conclusion === "success");
    if (successful.length === 0) {
      return { reuse: false, reason: "no-successful-source-run", tree: pushedTree, ...(pr && { pr: pr.number }) };
    }
    // Latest applicable run wins: a newer completed run that did not succeed (failure,
    // cancelled, timed out, ...) supersedes any older success, so run full CI.
    if (sameRepository[0].conclusion !== "success") {
      return { reuse: false, reason: "newer-source-run-not-successful", tree: pushedTree, runId: sameRepository[0].id, ...(pr && { pr: pr.number }) };
    }

    const evidence = `${prefix}-${pushedTree}`;
    for (const run of successful) {
      const artifacts = await api(`/actions/runs/${run.id}/artifacts?name=${evidence}&per_page=10`);
      if (list(artifacts, "artifacts").some((artifact) => artifact?.name === evidence && artifact.expired === false)) {
        return { reuse: true, reason: `${run.event}-tested-this-tree`, tree: pushedTree, runId: run.id, sourceEvent: run.event, ...(pr && { pr: pr.number }) };
      }
    }
    return { reuse: false, reason: "tested-tree-mismatch", tree: pushedTree, runId: successful[0].id, ...(pr && { pr: pr.number }) };
  } catch {
    return { reuse: false, reason: "github-api-error" };
  }
}

async function writeOutputs(values) {
  const lines = Object.entries(values).map(([key, value]) => `${key}=${value ?? ""}`).join("\n");
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `${lines}\n`, "utf8");
}

async function main() {
  const env = process.env;
  const common = {
    repository: env.GITHUB_REPOSITORY,
    token: env.INPUT_TOKEN,
    apiUrl: env.GITHUB_API_URL || "https://api.github.com",
  };
  const mode = env.INPUT_MODE;

  if (mode === "publish") {
    if (!PREFIX_RE.test(env.INPUT_EVIDENCE_PREFIX || "tested-tree")) {
      console.log("::error::evidence-prefix must match ^[a-z0-9][a-z0-9-]{0,40}$");
      process.exitCode = 1;
      return;
    }
    if (!EVIDENCE_EVENTS.has(env.GITHUB_EVENT_NAME)) {
      console.log(`publish=false reason=event-${env.GITHUB_EVENT_NAME}-publishes-no-evidence`);
      await writeOutputs({ publish: false, tree: "" });
      return;
    }
    const result = await resolveTestedTree({ ...common, sha: env.INPUT_TESTED_SHA || env.GITHUB_SHA });
    if (!result.tree) {
      // Evidence is optional; missing evidence only means a later push runs full CI.
      console.log(`::warning::tested-tree evidence not published (${result.reason})`);
      await writeOutputs({ publish: false, tree: "" });
      return;
    }
    console.log(`publish=true tree=${result.tree}`);
    await writeOutputs({ publish: true, tree: result.tree });
    return;
  }

  if (mode === "resolve") {
    const result = await resolveTreeReuse({
      ...common,
      sha: env.INPUT_EXPECTED_SHA || env.GITHUB_SHA,
      workflow: env.INPUT_WORKFLOW || workflowFile(env.GITHUB_WORKFLOW_REF),
      branch: env.GITHUB_REF_NAME,
      event: env.GITHUB_EVENT_NAME,
      prefix: env.INPUT_EVIDENCE_PREFIX || "tested-tree",
    });
    const line = `reuse=${result.reuse} reason=${result.reason}`
      + `${result.pr ? ` pr=#${result.pr}` : ""}${result.runId ? ` run=${result.runId}` : ""}`;
    console.log(line);
    await writeOutputs({ reuse: result.reuse, reason: result.reason, tree: result.tree, "source-run-id": result.runId, "source-event": result.sourceEvent });
    if (env.GITHUB_STEP_SUMMARY) await appendFile(env.GITHUB_STEP_SUMMARY, `CI tree reuse: \`${line}\`\n`, "utf8");
    return;
  }

  console.log(`::error::Unsupported mode '${mode}'. Use 'publish' or 'resolve'.`);
  process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
