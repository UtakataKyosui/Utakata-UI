import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { changedFiles, selectScope } from './ci-scope.mjs';

// Browser evidence artifacts are retained for 14 days; reuse never outlives them.
export const maxReuseAgeMs = 14 * 24 * 60 * 60 * 1000;

const browserJobs = [
  'browser-accessibility / browser (chromium-light)',
  'browser-accessibility / browser (chromium-dark)',
];

export function gateRequired(gate, files) {
  if (!files.length) return false;
  if (gate === 'checks') return true;
  if (gate === 'browser') return selectScope(files).browser;
  throw new Error(`Unknown gate: ${gate}`);
}

// A gate is reused only from a trusted main run that passed it on an ancestor
// commit whose diff to HEAD does not select it. Anything else reruns the gate.
export function selectReuse({
  head,
  gates,
  candidates,
  isAncestor,
  filesSince,
  now,
}) {
  return Object.fromEntries(
    gates.map((gate) => {
      for (const candidate of candidates) {
        if (!candidate.satisfies.includes(gate)) continue;
        if (now - Date.parse(candidate.createdAt) > maxReuseAgeMs) continue;
        if (candidate.sha !== head && !isAncestor(candidate.sha, head))
          continue;
        if (gateRequired(gate, filesSince(candidate.sha))) continue;
        return [gate, { decision: 'reuse', ...candidate }];
      }
      return [gate, { decision: 'run' }];
    }),
  );
}

export function trustedMainRun(run) {
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

function collectCandidates(repository, workflow) {
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

function isAncestor(sha, head) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', sha, head]);
    return true;
  } catch {
    return false;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [workflow, gateList] = process.argv.slice(2);
  const gates = gateList.split(',');
  const head = execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  let decisions;
  if (process.env.FULL_VERIFICATION === 'true') {
    decisions = Object.fromEntries(gates.map((g) => [g, { decision: 'run' }]));
  } else {
    try {
      decisions = selectReuse({
        head,
        gates,
        candidates: collectCandidates(process.env.GITHUB_REPOSITORY, workflow),
        isAncestor,
        filesSince: changedFiles,
        now: Date.now(),
      });
    } catch (error) {
      // Lookup failures never skip work.
      console.log(`Prior verification lookup failed: ${error.message}`);
      decisions = Object.fromEntries(
        gates.map((g) => [g, { decision: 'run' }]),
      );
    }
  }
  const output = Object.entries(decisions)
    .map(([gate, { decision }]) => `${gate}=${decision}`)
    .join('\n');
  const summary = Object.entries(decisions)
    .map(([gate, d]) =>
      d.decision === 'reuse'
        ? `- ${gate}: reused ${d.source} run ${d.id} attempt ${d.attempt} at ${d.sha}`
        : `- ${gate}: run in this workflow`,
    )
    .join('\n');
  console.log(output);
  console.log(summary);
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, `${output}\n`);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `### Prior verification\n${summary}\n`,
    );
}
