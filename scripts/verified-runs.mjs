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

export function qualityCandidate(run) {
  if (!trustedMainRun(run) || run.conclusion !== 'success') return null;
  return candidate(run, 'Quality', ['checks', 'browser']);
}

export function releaseCandidate(run, jobs, workflow) {
  const tagPush = run.event === 'push' && run.head_branch !== 'main';
  if (!trustedMainRun(run) && !tagPush) return null;
  const passed = (name) =>
    jobs.some((job) => job.name === name && job.conclusion === 'success');
  const satisfies = [];
  if (passed('verify')) satisfies.push('checks');
  if (browserJobs.every(passed)) satisfies.push('browser');
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
  const runs = (file) =>
    api(
      `repos/${repository}/actions/workflows/${file}/runs?status=completed&per_page=20`,
    ).workflow_runs;
  const release = runs(workflow).flatMap((run) => {
    const jobs = api(
      `repos/${repository}/actions/runs/${run.id}/jobs?per_page=50`,
    ).jobs;
    return releaseCandidate(run, jobs, workflow) ?? [];
  });
  const quality = runs('quality.yml').flatMap(
    (run) => qualityCandidate(run) ?? [],
  );
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
