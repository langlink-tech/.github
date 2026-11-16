// Run with: node --test tests/reusable-node-runner.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const workflow = readFileSync(path.join(root, ".github/workflows/reusable-node-quality.yml"), "utf8");

test("reusable Node quality keeps ubuntu-latest as the default runner", () => {
  const input = workflow.match(/      runs-on:\n(?:        .*\n)+/);
  assert.ok(input);
  assert.match(input[0], /type: string/);
  assert.match(input[0], /default: ubuntu-latest/);
});

test("every quality job consumes the optional runner input", () => {
  const jobs = workflow.split(/^  [a-z][a-z-]*:\n/m).slice(1);
  assert.equal(jobs.length, 7);
  for (const job of jobs) assert.match(job, /    runs-on: \$\{\{ inputs\.runs-on \}\}/);
  assert.doesNotMatch(workflow, /^    runs-on: ubuntu-latest$/m);
});
