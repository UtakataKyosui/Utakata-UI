import { execFileSync } from 'node:child_process';

// Browser evidence artifacts are retained for 14 days; reuse never outlives them.
export const maxReuseAgeMs = 14 * 24 * 60 * 60 * 1000;

const browserJobs = [
  'browser-accessibility / browser (chromium-light)',
  'browser-accessibility / browser (chromium-dark)',
];

// Main pushes diff against the newest verified ancestor; none means full gates.
export function verifiedBase({ head, candidates, isAncestor, now }) {
  const base = candidates.find(
    (candidate) =>
      now - Date.parse(candidate.createdAt) <= maxReuseAgeMs &&
      (candidate.sha === head || isAncestor(candidate.sha, head)),
  );
  return base?.sha ?? '';
}

export function lookupVerifiedBase(repository, head) {
  const candidates = api(
    `repos/${repository}/actions/workflows/quality.yml/runs?branch=main&status=completed&per_page=20`,
  ).workflow_runs.flatMap((run) => qualityCandidate(run) ?? []);
  return verifiedBase({ head, candidates, isAncestor, now: Date.now() });
}

function trustedMainRun(run) {
  return (
    run.head_branch === 'main' &&
    (run.event === 'push' || run.event === 'workflow_dispatch')
  );
}

// Incremental main runs succeed with irrelevant gates skipped. A run verifies
// the whole tree inductively, but browser evidence exists only where both
// browser jobs ran, so its age bound applies to that run itself.
export function qualityCandidate(run, jobs = []) {
  if (!trustedMainRun(run) || run.conclusion !== 'success') return null;
  const satisfies = ['checks'];
  if (browserJobs.every((name) => passed(jobs, name)))
    satisfies.push('browser');
  return candidate(run, 'Quality', satisfies);
}

function passed(jobs, name) {
  return jobs.some((job) => job.name === name && job.conclusion === 'success');
}

export function releaseCandidate(run, jobs, workflow) {
  const tagPush = run.event === 'push' && run.head_branch !== 'main';
  if (!trustedMainRun(run) && !tagPush) return null;
  const satisfies = [];
  if (passed(jobs, 'verify')) satisfies.push('checks');
  if (browserJobs.every((name) => passed(jobs, name)))
    satisfies.push('browser');
  return satisfies.length ? candidate(run, workflow, satisfies) : null;
}

function candidate(run, source, satisfies) {
  return {
    id: run.id,
    attempt: run.run_attempt,
    sha: run.head_sha,
    createdAt: run.created_at,
    source,
    satisfies,
  };
}

function api(path) {
  return JSON.parse(execFileSync('gh', ['api', path], { encoding: 'utf8' }));
}

export function collectCandidates(repository, workflow) {
  const runs = (file, filter = '') =>
    api(
      `repos/${repository}/actions/workflows/${file}/runs?status=completed&per_page=20${filter}`,
    ).workflow_runs;
  const jobs = (run) =>
    api(`repos/${repository}/actions/runs/${run.id}/jobs?per_page=50`).jobs;
  const release = runs(workflow).flatMap(
    (run) => releaseCandidate(run, jobs(run), workflow) ?? [],
  );
  const quality = runs('quality.yml', '&branch=main')
    .filter((run) => run.conclusion === 'success')
    .flatMap((run) => qualityCandidate(run, jobs(run)) ?? []);
  return [...release, ...quality].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export function isAncestor(sha, head) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', sha, head]);
    return true;
  } catch {
    return false;
  }
}
