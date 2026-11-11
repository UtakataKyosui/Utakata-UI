import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import {
  findWholeProof,
  fingerprints,
  readEvidence,
  selectEvidence,
  versionOnlyPackages,
} from './ci-evidence.mjs';
import { requiredJobs, selectScope } from './ci-policy.mjs';
import { lookupVerifiedBase } from './verified-runs.mjs';

export { selectScope } from './ci-policy.mjs';

export function changedFiles(base) {
  return execFileSync(
    'git',
    ['diff', '--name-only', '--no-renames', '-z', base, 'HEAD'],
    { encoding: 'utf8' },
  )
    .split('\0')
    .filter(Boolean);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  // PRs use the entire merge-base diff, not just the last commit; invalid bases
  // fail. Main pushes diff against the newest main commit whose Quality run
  // passed; lookup failure or no such commit runs full gates. Manual runs are full.
  const event = process.env.EVENT_NAME;
  const head = execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  let base = '';
  if (event === 'pull_request') {
    base = execFileSync('git', ['merge-base', process.env.BASE_SHA, 'HEAD'], {
      encoding: 'utf8',
    }).trim();
  } else if (event === 'push') {
    try {
      base = lookupVerifiedBase(process.env.GITHUB_REPOSITORY, head);
    } catch (error) {
      console.log(`Verified main lookup failed: ${error.message}`);
    }
    console.log(`Verified main base: ${base || 'none (full gates)'}`);
  }
  const inputs = fingerprints();
  let records = [];
  let baseline;
  if (event !== 'workflow_dispatch') {
    try {
      records = readEvidence(process.env.GITHUB_REPOSITORY);
      if (base) baseline = findWholeProof(fingerprints(base), records);
    } catch (error) {
      console.log(`CI evidence lookup failed; run gates: ${error.message}`);
      records = [];
    }
  }
  const files = base ? changedFiles(base) : [];
  // An incremental run inherits only a complete, unexpired baseline. The
  // first run after migration and manual runs deliberately verify everything.
  const scope = selectScope(
    files,
    !baseline,
    base ? versionOnlyPackages(base) : new Set(),
  );
  const reuse =
    event === 'workflow_dispatch'
      ? {}
      : selectEvidence(requiredJobs(scope), inputs, records);
  const run = Object.fromEntries(
    Object.entries(requiredJobs(scope)).map(([gate, needed]) => [
      `run_${gate}`,
      needed && !reuse[gate],
    ]),
  );
  const output = Object.entries({
    ...scope,
    ...run,
    base: scope.full ? '' : base,
    baseline_expires: baseline?.expiresAt ?? '',
    reuse: JSON.stringify(reuse),
    fingerprints: JSON.stringify(inputs),
  })
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  console.log(output);
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, `${output}\n`);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `### CI execution plan\n\n${Object.entries(requiredJobs(scope))
        .map(
          ([gate, needed]) =>
            `- ${gate}: ${reuse[gate] ? `reused [run ${reuse[gate].runId}](${reuse[gate].url}), attempt ${reuse[gate].attempt}, identical committed inputs` : needed ? 'run' : 'unaffected by this change'}`,
        )
        .join('\n')}\n`,
    );
}
