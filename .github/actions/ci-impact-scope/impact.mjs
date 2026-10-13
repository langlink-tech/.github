import { appendFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const keys = ['frontend', 'backend', 'full'];
const control = /(^|\/)(AGENTS|CLAUDE|REVIEW|SKILL)\.md$|^(\.github|\.circleci|\.agents|\.cursor|\.codex|scripts)\//i;
const validPath = (p) => typeof p === 'string' && p.length > 0 && !p.startsWith('/') && !p.includes('\\') && !p.split('/').includes('..') && !/[\r\n\0]/.test(p);

export function classify(files, expected, rules) {
  const full = (reason) => ({ scope: 'full', migrations: true, reason });
  if (!Number.isInteger(expected) || expected <= 0 || expected >= 3000 || !Array.isArray(files) || files.length !== expected) return full('incomplete-files');
  if (!rules || rules.version !== 1 || !keys.every((k) => rules[k] && ['prefixes', 'files'].every((f) => Array.isArray(rules[k][f]) && rules[k][f].every(validPath)))) return full('invalid-rules');
  const domain = (p) => {
    if (!validPath(p) || control.test(p)) return 'full';
    const matches = keys.map((k) => ({ key: k, score: Math.max(rules[k].files.includes(p) ? p.length + 1 : 0, ...rules[k].prefixes.filter((s) => p.startsWith(s)).map((s) => s.length), 0) })).filter((x) => x.score > 0);
    if (matches.some((x) => x.key === 'full')) return 'full';
    const best = Math.max(...matches.map((x) => x.score), 0);
    const winners = matches.filter((x) => x.score === best);
    if (winners.length > 1) return 'full';
    if (winners.length === 1) return winners[0].key;
    return p.endsWith('.md') ? 'docs' : 'full';
  };
  const domains = new Set();
  let migrations = false;
  for (const file of files) {
    if (!file || !validPath(file.filename) || (file.previous_filename !== undefined && !validPath(file.previous_filename))) return full('invalid-path');
    const current = domain(file.filename);
    if (file.previous_filename !== undefined && current !== domain(file.previous_filename)) return full('cross-domain-rename');
    domains.add(current);
    migrations ||= [file.filename, file.previous_filename].some((p) => p?.startsWith('migrations/'));
  }
  domains.delete('docs');
  if (domains.has('full') || domains.size > 1) return full('global-or-mixed');
  return { scope: [...domains][0] ?? 'docs', migrations, reason: 'complete-files' };
}

export function collect(env, read = (endpoint, paginate = false) => JSON.parse(execFileSync('gh', ['api', endpoint, ...(paginate ? ['--paginate', '--slurp'] : [])], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))) {
  try {
    if (!/^\d+$/.test(env.PR_NUMBER ?? '') || !/^[\w.-]+\/[\w.-]+$/.test(env.GITHUB_REPOSITORY ?? '')) throw new Error('invalid-input');
    const endpoint = `repos/${env.GITHUB_REPOSITORY}/pulls/${env.PR_NUMBER}`;
    const meta = read(endpoint);
    const pages = read(`${endpoint}/files?per_page=100`, true);
    if (!Array.isArray(pages) || pages.some((p) => !Array.isArray(p))) throw new Error('invalid-pages');
    return classify(pages.flat(), meta.changed_files, JSON.parse(readFileSync(env.DOMAINS_FILE, 'utf8')));
  } catch {
    // Never turn a missing/unauthorized API response into a partial healthy gate.
    return { scope: 'full', migrations: true, reason: 'source-unavailable' };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = collect(process.env);
  appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(result).map(([k, v]) => `${k}=${v}\n`).join(''));
  console.log(`CI scope=${result.scope} reason=${result.reason} migrations=${result.migrations}`);
}
