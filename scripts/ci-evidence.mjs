import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import {
  browserJobNames,
  evidenceGates,
  requiredJobs,
  selectScope,
} from './ci-policy.mjs';
import { maxReuseAgeMs } from './verified-runs.mjs';

const protocol = 1;
const jobName = (gate) => (gate === 'browser' ? 'browser-accessibility' : gate);
const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
const hash = (value) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
const validHash = (value) => /^[a-f0-9]{64}$/.test(value ?? '');
const stableVersion = (value) =>
  typeof value === 'string' &&
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value);

export function versionOnlyChange(before, after) {
  if (!stableVersion(before.version) || !stableVersion(after.version))
    return false;
  const { version: oldVersion, ...oldMetadata } = before;
  const { version, ...metadata } = after;
  return oldVersion !== version && isDeepStrictEqual(oldMetadata, metadata);
}

export function versionOnlyPackages(base) {
  const paths = new Set();
  for (const name of ['react', 'cli']) {
    const path = `packages/${name}/package.json`;
    try {
      if (
        versionOnlyChange(
          JSON.parse(git('show', `${base}:${path}`)),
          JSON.parse(git('show', `HEAD:${path}`)),
        )
      )
        paths.add(path);
    } catch {
      /* Added/deleted/invalid manifests retain the full default gates. */
    }
  }
  return paths;
}

// Hash committed inputs, not generated output or a mutable runner filesystem.
// Unknown paths and changes to CI policy invalidate every applicable gate.
export function fingerprints(sha = 'HEAD') {
  const entries = git('ls-tree', '-rz', sha)
    .split('\0')
    .filter(Boolean)
    .map((entry) => {
      const separator = entry.indexOf('\t');
      const metadata = entry.slice(0, separator);
      const path = entry.slice(separator + 1);
      const [mode, , oid] = metadata.split(' ');
      return { path, mode, oid };
    });
  return fingerprintsForEntries(entries, (path) =>
    git('show', `${sha}:${path}`),
  );
}

export function fingerprintsForEntries(entries, readBlob) {
  const sorted = [...entries].sort((a, b) =>
    a.path.localeCompare(b.path, 'en'),
  );
  const result = { whole: hash([protocol, sorted]) };
  for (const gate of evidenceGates) {
    const inputs = sorted.filter(
      ({ path }) =>
        requiredJobs(selectScope([path]))[gate] ||
        (gate === 'browser' && path.startsWith('packages/cli/')),
    );
    result[gate] = hash([
      protocol,
      gate,
      inputs.map((entry) => {
        // The browser fixture never consumes the library's distribution version.
        // Dependency/configuration edits still change this normalized input.
        if (
          gate === 'browser' &&
          entry.path === 'packages/react/package.json'
        ) {
          const { version: _version, ...metadata } = JSON.parse(
            readBlob(entry.path),
          );
          return { ...entry, oid: hash(metadata) };
        }
        return entry;
      }),
    ]);
  }
  return result;
}

export function trustedRun(run, repository) {
  if (
    run.repository?.full_name !== repository ||
    run.head_repository?.full_name !== repository ||
    run.status !== 'completed'
  )
    return false;
  if (['push', 'workflow_dispatch'].includes(run.event))
    return run.head_branch === 'main';
  return (
    run.event === 'pull_request' &&
    run.pull_requests?.length > 0 &&
    run.pull_requests.every((pr) => pr.base.ref === 'main')
  );
}

// GitHub may clear workflow_runs.pull_requests after a merge. Resolve the
// authoritative commit association rather than dropping already-merged proof.
export function withPullRequestTargets(run, repository, lookup) {
  if (
    run.event !== 'pull_request' ||
    run.pull_requests?.length ||
    run.head_repository?.full_name !== repository ||
    run.repository?.full_name !== repository
  )
    return run;
  const associated = lookup(
    `repos/${repository}/commits/${run.head_sha}/pulls?per_page=100`,
  );
  return {
    ...run,
    pull_requests: associated.filter(
      (pr) =>
        pr.base.ref === 'main' &&
        pr.base.repo?.full_name === repository &&
        pr.head.repo?.full_name === repository,
    ),
  };
}

export function validateRecord({
  run,
  proof,
  jobs,
  repository,
  sourceInputs,
  now = Date.now(),
}) {
  if (!trustedRun(run, repository)) return null;
  const expires = Date.parse(proof.expiresAt);
  const latest = Date.parse(run.updated_at ?? run.created_at);
  if (
    !Number.isFinite(expires) ||
    expires <= now ||
    expires > latest + maxReuseAgeMs ||
    latest > now
  )
    return null;
  validateIdentity(run, proof, repository);
  // Authenticate the declared hashes against GitHub's authoritative run head.
  // PRs whose tested merge tree differs from their head are conservatively
  // ineligible. Forks and forged artifact hashes can never supply a pass.
  if (!isDeepStrictEqual(sourceInputs, proof.fingerprints)) return null;
  validateJobResults(proof, jobs);
  return {
    ...proof,
    successful:
      run.conclusion === 'success' && jobPassed(jobs, 'accessibility'),
    url: `https://github.com/${repository}/actions/runs/${run.id}`,
  };
}

function validateIdentity(run, proof, repository) {
  if (
    proof.version !== protocol ||
    proof.repository !== repository ||
    proof.runId !== run.id ||
    proof.attempt !== run.run_attempt ||
    typeof proof.complete !== 'boolean' ||
    !/^[a-f0-9]{40}$/.test(proof.sha ?? '')
  )
    throw new Error('Invalid CI evidence identity.');
  if (
    !['whole', ...evidenceGates].every((gate) =>
      validHash(proof.fingerprints?.[gate]),
    )
  )
    throw new Error('Invalid CI input hashes.');
}

function jobPassed(jobs, name) {
  return jobs.some((job) => job.name === name && job.conclusion === 'success');
}

function validateJobResults(proof, jobs) {
  for (const gate of evidenceGates) {
    const result = proof.results?.[gate];
    if (
      !['success', 'failure', 'cancelled', 'skipped', 'missing'].includes(
        result,
      )
    )
      throw new Error('Invalid CI evidence result.');
    if (result !== 'success') continue;
    const names = gate === 'browser' ? browserJobNames : [jobName(gate)];
    if (!names.every((name) => jobPassed(jobs, name)))
      throw new Error(
        'CI artifact claims a missing or incomplete passing job.',
      );
  }
}

export function findWholeProof(inputs, records, now = Date.now()) {
  for (const record of records) {
    if (
      Date.parse(record.expiresAt) <= now ||
      record.fingerprints.whole !== inputs.whole
    )
      continue;
    return record.successful && record.complete ? record : undefined;
  }
}

export function releaseEvidence(gates, inputs, records, now = Date.now()) {
  const decisions = {};
  const whole = findWholeProof(inputs, records, now);
  const browser = gateProof('browser', inputs.browser, records, now);
  const sameTree = records.some(
    (record) =>
      record.fingerprints.whole === inputs.whole &&
      Date.parse(record.expiresAt) > now,
  );
  for (const gate of gates) {
    const proof =
      gate === 'checks' ? whole : gate === 'browser' ? browser : undefined;
    if (proof)
      decisions[gate] = {
        decision: 'reuse',
        source: 'input-verified Quality',
        id: proof.runId,
        attempt: proof.attempt,
        sha: proof.sha,
      };
    else if (
      (gate === 'checks' && sameTree) ||
      (gate === 'browser' && browser === false)
    )
      decisions[gate] = { decision: 'run' };
  }
  return decisions;
}

export function selectEvidence(required, inputs, records, now = Date.now()) {
  const reuse = {};
  for (const gate of evidenceGates) {
    if (!required[gate]) continue;
    const record = gateProof(gate, inputs[gate], records, now);
    if (record)
      reuse[gate] = {
        runId: record.runId,
        attempt: record.attempt,
        sha: record.sha,
        fingerprint: inputs[gate],
        expiresAt: record.expiresAt,
        url: record.url,
      };
  }
  return reuse;
}

function gateProof(gate, fingerprint, records, now) {
  for (const record of records) {
    if (
      Date.parse(record.expiresAt) <= now ||
      record.fingerprints[gate] !== fingerprint
    )
      continue;
    const result = record.results[gate];
    // A newer failed matching test invalidates an older green result.
    if (['failure', 'cancelled', 'missing'].includes(result)) return false;
    if (result !== 'success' || !record.successful || !record.complete)
      continue;
    return record;
  }
}

function api(path) {
  return JSON.parse(
    execFileSync('gh', ['api', path], {
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024,
    }),
  );
}

// Never reuse cached build directories. Only small, immutable run artifacts
// are downloaded, with explicit origin, attempt, coverage and expiry checks.
export function readEvidence(repository) {
  const runs = api(
    `repos/${repository}/actions/workflows/quality.yml/runs?status=completed&per_page=10`,
  ).workflow_runs;
  const hashes = new Map();
  return runs
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
    .filter(
      (run) =>
        String(run.id) !== process.env.GITHUB_RUN_ID &&
        Date.now() - Date.parse(run.updated_at) <= maxReuseAgeMs,
    )
    .map((run) => withPullRequestTargets(run, repository, api))
    .filter((run) => trustedRun(run, repository))
    .map((run) => readRecord(run, repository, hashes))
    .filter(Boolean);
}

function readRecord(run, repository, hashes) {
  const artifact = api(
    `repos/${repository}/actions/runs/${run.id}/artifacts?per_page=100`,
  ).artifacts.find(
    (item) =>
      item.name === `ci-verification-${run.run_attempt}` && !item.expired,
  );
  if (!artifact) {
    if (hasProtocol(run.head_sha))
      throw new Error(`CI evidence missing from run ${run.id}.`);
    return null;
  }
  const proof = downloadProof(run, repository, artifact.name);
  if (!hashes.has(run.head_sha))
    hashes.set(run.head_sha, fingerprints(run.head_sha));
  return validateRecord({
    run,
    proof,
    repository,
    sourceInputs: hashes.get(run.head_sha),
    jobs: api(`repos/${repository}/actions/runs/${run.id}/jobs?per_page=100`)
      .jobs,
  });
}

function hasProtocol(sha) {
  try {
    git('cat-file', '-e', `${sha}:scripts/ci-evidence.mjs`);
    return true;
  } catch {
    return false;
  } // Legacy run or unavailable source cannot provide evidence.
}

function downloadProof(run, repository, artifactName) {
  const directory = mkdtempSync(join(tmpdir(), 'utakata-ci-proof-'));
  try {
    execFileSync(
      'gh',
      [
        'run',
        'download',
        String(run.id),
        '--repo',
        repository,
        '--name',
        artifactName,
        '--dir',
        directory,
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const path = join(directory, 'ci-verification.json');
    if (statSync(path).size > 128 * 1024)
      throw new Error('CI evidence is too large.');
    return JSON.parse(readFileSync(path, 'utf8'));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

export function buildEvidence({
  scope,
  results,
  inputs,
  repository,
  runId,
  attempt,
  sha,
  now = Date.now(),
}) {
  const reuse = JSON.parse(scope.reuse ?? '{}');
  const deadlines = [
    now + maxReuseAgeMs,
    ...Object.values(reuse).map((item) => Date.parse(item.expiresAt)),
  ];
  const full = scope.full === 'true';
  if (!full) deadlines.push(Date.parse(scope.baseline_expires));
  return {
    version: protocol,
    repository,
    runId,
    attempt,
    sha,
    complete: full || Date.parse(scope.baseline_expires) > now,
    expiresAt: new Date(
      Math.min(...deadlines.filter(Number.isFinite)),
    ).toISOString(),
    fingerprints: inputs,
    results: Object.fromEntries(
      evidenceGates.map((gate) => [
        gate,
        results[jobName(gate)]?.result ?? 'missing',
      ]),
    ),
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const results = JSON.parse(process.env.RESULTS);
  if (results.scope?.result !== 'success')
    throw new Error('Cannot export evidence without a passing scope.');
  const scope = results.scope.outputs;
  const inputs = fingerprints();
  if (!isDeepStrictEqual(inputs, JSON.parse(scope.fingerprints)))
    throw new Error('Scope and aggregate checked out different inputs.');
  const proof = buildEvidence({
    scope,
    results,
    inputs,
    repository: process.env.GITHUB_REPOSITORY,
    runId: Number(process.env.GITHUB_RUN_ID),
    attempt: Number(process.env.GITHUB_RUN_ATTEMPT),
    sha: git('rev-parse', 'HEAD').trim(),
  });
  mkdirSync('test-results', { recursive: true });
  writeFileSync(
    'test-results/ci-verification.json',
    `${JSON.stringify(proof, null, 2)}\n`,
  );
}
