import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  buildEvidence,
  findWholeProof,
  fingerprints,
  fingerprintsForEntries,
  releaseEvidence,
  selectEvidence,
  trustedRun,
  validateRecord,
  versionOnlyChange,
  versionOnlyPackages,
  withPullRequestTargets,
} from './ci-evidence.mjs';
import { gatesPassed } from './ci-gate.mjs';
import {
  browserJobNames,
  evidenceGates,
  requiredJobs,
  selectScope,
} from './ci-policy.mjs';
import { maxReuseAgeMs } from './verified-runs.mjs';

const now = Date.parse('2026-11-11T00:00:00Z');
const repository = 'owner/project';
const sha = 'a'.repeat(40);
const inputs = Object.fromEntries(
  ['whole', ...evidenceGates].map((gate, i) => [
    gate,
    String(i + 1).repeat(64),
  ]),
);
const results = Object.fromEntries(
  evidenceGates.map((gate) => [gate, 'success']),
);
const run = {
  id: 12,
  run_attempt: 1,
  head_sha: sha,
  head_branch: 'feature',
  status: 'completed',
  event: 'pull_request',
  conclusion: 'success',
  updated_at: new Date(now - 1000).toISOString(),
  repository: { full_name: repository },
  head_repository: { full_name: repository },
  pull_requests: [{ base: { ref: 'main' } }],
};
const proof = {
  version: 1,
  repository,
  runId: 12,
  attempt: 1,
  sha,
  complete: true,
  expiresAt: new Date(now + maxReuseAgeMs - 2000).toISOString(),
  fingerprints: inputs,
  results,
};
const jobs = [
  ...['checks', 'unit', 'build', 'docs', 'accessibility'],
  ...browserJobNames,
].map((name) => ({ name, conclusion: 'success' }));
const record = (overrides = {}) =>
  validateRecord({
    run,
    proof,
    jobs,
    repository,
    sourceInputs: inputs,
    now,
    ...overrides,
  });
const needed = Object.fromEntries(evidenceGates.map((gate) => [gate, true]));

test('same-repository PR results reuse independent gates and the same tested tree after merge', () => {
  const source = record();
  assert.deepEqual(
    Object.keys(selectEvidence(needed, inputs, [source], now)),
    evidenceGates,
  );
  assert.equal(findWholeProof(inputs, [source], now).runId, 12);
  assert.deepEqual(
    Object.keys(releaseEvidence(['checks', 'browser'], inputs, [source], now)),
    ['checks', 'browser'],
  );
  const changed = { ...inputs, checks: 'f'.repeat(64), whole: 'f'.repeat(64) };
  assert.deepEqual(
    Object.keys(selectEvidence(needed, changed, [source], now)),
    ['unit', 'build', 'docs', 'browser'],
  );
  assert.equal(
    releaseEvidence(['checks', 'browser'], changed, [source], now).checks,
    undefined,
  );
});

test('forks, non-main targets, untrusted events and forged input hashes cannot supply evidence', () => {
  for (const change of [
    { head_repository: { full_name: 'fork/project' } },
    { repository: { full_name: 'other/project' } },
    { pull_requests: [{ base: { ref: 'dev' } }] },
    { event: 'pull_request_target' },
    { event: 'push', head_branch: 'feature' },
    { status: 'in_progress' },
  ])
    assert.equal(trustedRun({ ...run, ...change }, repository), false);
  assert.equal(
    record({ sourceInputs: { ...inputs, browser: 'f'.repeat(64) } }),
    null,
  );
  for (const change of [
    { runId: 99 },
    { attempt: 2 },
    { version: 9 },
    { sha: 'not-a-commit' },
  ])
    assert.throws(() => record({ proof: { ...proof, ...change } }));
});

test('merged PRs with empty workflow associations are authenticated through the commit API', () => {
  const empty = { ...run, pull_requests: [] };
  const pr = {
    base: { ref: 'main', repo: { full_name: repository } },
    head: { repo: { full_name: repository } },
  };
  const resolved = withPullRequestTargets(empty, repository, (path) => {
    assert.match(path, new RegExp(`/commits/${sha}/pulls`));
    return [pr];
  });
  assert.equal(trustedRun(resolved, repository), true);
  assert.equal(
    trustedRun(
      withPullRequestTargets(empty, repository, () => [
        { ...pr, base: { ...pr.base, ref: 'dev' } },
      ]),
      repository,
    ),
    false,
  );
  const fork = { ...empty, head_repository: { full_name: 'fork/project' } };
  assert.equal(
    withPullRequestTargets(fork, repository, () => {
      throw new Error('must not query a fork');
    }),
    fork,
  );
  assert.throws(() =>
    withPullRequestTargets(empty, repository, () => {
      throw new Error('API unavailable');
    }),
  );
});

test('every matrix job must actually pass; skipped, missing and cancelled work is not a cache hit', () => {
  for (const name of browserJobNames) {
    for (const conclusion of ['failure', 'cancelled', 'skipped', undefined]) {
      assert.throws(() =>
        record({
          jobs: jobs
            .filter((job) => job.name !== name)
            .concat({ name, conclusion }),
        }),
      );
    }
  }
  const incomplete = record({ proof: { ...proof, complete: false } });
  assert.deepEqual(selectEvidence(needed, inputs, [incomplete], now), {});
  assert.equal(findWholeProof(inputs, [incomplete], now), undefined);
});

test('expiry and newer matching failures invalidate older green results', () => {
  const old = record();
  for (const expiresAt of [
    'invalid',
    new Date(now).toISOString(),
    new Date(now + maxReuseAgeMs).toISOString(),
  ])
    assert.equal(record({ proof: { ...proof, expiresAt } }), null);
  const failed = record({
    run: { ...run, conclusion: 'failure' },
    proof: { ...proof, results: { ...results, browser: 'failure' } },
  });
  assert.equal(
    selectEvidence(needed, inputs, [failed, old], now).browser,
    undefined,
  );
  assert.equal(findWholeProof(inputs, [failed, old], now), undefined);
  assert.equal(
    releaseEvidence(['browser'], inputs, [failed, old], now).browser.decision,
    'run',
  );
  assert.equal(
    releaseEvidence(['checks'], inputs, [failed, old], now).checks.decision,
    'run',
  );
  assert.equal(findWholeProof(inputs, [old], now + maxReuseAgeMs), undefined);
});

test('re-exported results never extend the original evidence lifetime or turn skipped jobs into passes', () => {
  const origin = record();
  const reuse = selectEvidence(needed, inputs, [origin], now);
  const exported = buildEvidence({
    scope: { full: 'true', reuse: JSON.stringify(reuse) },
    results: Object.fromEntries(
      ['checks', 'unit', 'build', 'docs', 'browser-accessibility'].map(
        (name) => [name, { result: 'skipped' }],
      ),
    ),
    inputs,
    repository,
    runId: 13,
    attempt: 1,
    sha,
    now: now + 10_000,
  });
  assert.equal(exported.expiresAt, origin.expiresAt);
  assert.equal(exported.results.browser, 'skipped');
  assert.deepEqual(
    selectEvidence(
      needed,
      inputs,
      [{ ...exported, successful: true }, origin],
      now,
    ),
    reuse,
  );
  const inherited = buildEvidence({
    scope: { full: 'false', baseline_expires: origin.expiresAt },
    results: {},
    inputs,
    repository,
    runId: 14,
    attempt: 1,
    sha,
    now,
  });
  assert.equal(inherited.expiresAt, origin.expiresAt);
  assert.equal(inherited.complete, true);
  assert.equal(
    buildEvidence({
      scope: { full: 'false' },
      results: {},
      inputs,
      repository,
      runId: 15,
      attempt: 1,
      sha,
      now,
    }).complete,
    false,
  );
});

test('aggregate requires valid matching evidence for every reused skip, and never excuses an executed failure', () => {
  const reuse = selectEvidence(needed, inputs, [record()], now);
  // Use a future bound relative to the actual test clock for aggregate checks.
  for (const source of Object.values(reuse))
    source.expiresAt = new Date(Date.now() + 60_000).toISOString();
  const fixture = () => ({
    scope: {
      result: 'success',
      outputs: {
        checks: 'true',
        tests: 'true',
        cli: 'true',
        build: 'true',
        docs: 'true',
        browser: 'true',
        fallow: 'false',
        reuse: JSON.stringify(reuse),
        fingerprints: JSON.stringify(inputs),
      },
    },
    ...Object.fromEntries(
      [
        'checks',
        'unit',
        'build',
        'docs',
        'browser-accessibility',
        'fallow',
      ].map((job) => [job, { result: 'skipped' }]),
    ),
  });
  assert.equal(gatesPassed(fixture(), 'push'), true);
  for (const gate of evidenceGates) {
    for (const change of [
      { fingerprint: 'f'.repeat(64) },
      { expiresAt: 'expired' },
      { runId: 0 },
      { attempt: 0 },
      { sha: 'bad' },
    ]) {
      const state = fixture();
      state.scope.outputs.reuse = JSON.stringify({
        ...reuse,
        [gate]: { ...reuse[gate], ...change },
      });
      assert.equal(gatesPassed(state, 'push'), false);
    }
    const state = fixture();
    state[gate === 'browser' ? 'browser-accessibility' : gate].result =
      'failure';
    assert.equal(gatesPassed(state, 'push'), false);
  }
});

test('gate fingerprints retain dependencies, tests, policy, modes and deleted files while excluding unrelated docs', () => {
  const entry = (path, oid = 'old', mode = '100644') => ({ path, mode, oid });
  const base = [
    entry('README.md'),
    entry('packages/react/src/components/Button.tsx'),
    entry('packages/react/package.json'),
    entry('.github/workflows/actions.lock'),
  ];
  const metadata = {
    name: '@utakata-ui/react',
    version: '0.2.0',
    dependencies: { 'lism-css': '^1.1.0' },
  };
  const calculate = (entries, value = metadata) =>
    fingerprintsForEntries(entries, () => JSON.stringify(value));
  const original = calculate(base);
  const documentation = calculate(
    base.map((item) =>
      item.path === 'README.md' ? { ...item, oid: 'new' } : item,
    ),
  );
  assert.notEqual(original.checks, documentation.checks);
  for (const gate of ['unit', 'build', 'docs', 'browser'])
    assert.equal(original[gate], documentation[gate]);
  for (const path of [
    'packages/react/src/components/Button.tsx',
    '.github/workflows/actions.lock',
  ]) {
    const changed = calculate(
      base.map((item) => (item.path === path ? { ...item, oid: 'new' } : item)),
    );
    for (const gate of evidenceGates)
      assert.notEqual(original[gate], changed[gate], `${path}: ${gate}`);
  }
  assert.notEqual(
    original.browser,
    calculate(base.filter((item) => !item.path.endsWith('Button.tsx'))).browser,
  );
  assert.notEqual(
    original.browser,
    calculate(base.map((item) => ({ ...item, mode: '100755' }))).browser,
  );
  const bumped = calculate(
    base.map((item) =>
      item.path.endsWith('package.json') ? { ...item, oid: 'bumped' } : item,
    ),
    { ...metadata, version: '0.3.0' },
  );
  assert.equal(original.browser, bumped.browser);
  assert.notEqual(original.build, bumped.build);
  assert.notEqual(
    original.browser,
    calculate(base, { ...metadata, dependencies: { 'lism-css': '^2.0.0' } })
      .browser,
  );
});

test('only stable version-only manifests use the narrow packaging scope; dependency edits remain full', () => {
  const before = {
    name: '@utakata-ui/react',
    version: '0.2.0',
    dependencies: { a: '^1.0.0' },
  };
  assert.equal(
    versionOnlyChange(before, { ...before, version: '0.3.0' }),
    true,
  );
  for (const after of [
    { ...before },
    { ...before, version: 'beta' },
    { ...before, version: '0.3.0', dependencies: { a: '^2.0.0' } },
    { ...before, version: '0.3.0', scripts: { build: 'other' } },
  ])
    assert.equal(versionOnlyChange(before, after), false);
  const scope = selectScope(
    ['packages/react/package.json'],
    false,
    new Set(['packages/react/package.json']),
  );
  assert.equal(scope.react, true);
  assert.equal(scope.docs, true);
  assert.equal(scope.checks, true);
  for (const gate of [
    'browser',
    'tests',
    'types',
    'markup',
    'cli',
    'agents',
    'fallow',
  ])
    assert.equal(scope[gate], false, gate);
  assert.ok(
    Object.values(selectScope(['packages/react/package.json'])).every(Boolean),
  );
  assert.deepEqual(requiredJobs(scope), {
    checks: true,
    unit: false,
    build: true,
    docs: true,
    browser: false,
  });
});

test('real Git fingerprints authenticate committed files, version-only diffs and names containing tabs', () => {
  const previous = process.cwd();
  const directory = mkdtempSync(join(tmpdir(), 'utakata-proof-git-'));
  // A pre-commit hook exports the caller's Git index. Both the fixture's Git
  // commands and the code under test must discover the temporary repository.
  const gitEnvironment = Object.entries(process.env).filter(([key]) =>
    key.startsWith('GIT_'),
  );
  for (const [key] of gitEnvironment) delete process.env[key];
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: directory,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  const commit = () => {
    git('add', '.');
    git(
      '-c',
      'user.name=CI fixture',
      '-c',
      'user.email=ci@example.invalid',
      '-c',
      'core.hooksPath=.git/no-hooks',
      'commit',
      '-m',
      'fixture',
    );
    return git('rev-parse', 'HEAD');
  };
  const metadata = {
    name: '@utakata-ui/react',
    version: '0.2.0',
    dependencies: { 'lism-css': '^1.1.0' },
  };
  try {
    git('init', '--quiet');
    for (const name of ['react', 'cli'])
      mkdirSync(join(directory, `packages/${name}`), { recursive: true });
    writeFileSync(
      join(directory, 'packages/react/package.json'),
      JSON.stringify(metadata),
    );
    writeFileSync(
      join(directory, 'packages/cli/package.json'),
      '{"name":"@utakata-ui/cli","version":"0.1.0"}',
    );
    writeFileSync(join(directory, 'odd\tname.md'), 'documentation');
    const base = commit();
    process.chdir(directory);
    const before = fingerprints();
    writeFileSync(
      'packages/react/package.json',
      JSON.stringify({ ...metadata, version: '0.3.0' }),
    );
    assert.deepEqual(
      fingerprints(),
      before,
      'uncommitted runner changes cannot forge the Git input identity',
    );
    commit();
    assert.deepEqual(
      [...versionOnlyPackages(base)],
      ['packages/react/package.json'],
    );
    assert.equal(fingerprints().browser, before.browser);
    assert.notEqual(fingerprints().build, before.build);
    const named = fingerprints();
    renameSync('odd\tname.md', 'odd\tother.md');
    commit();
    assert.notEqual(fingerprints().whole, named.whole);
    writeFileSync(
      'packages/react/package.json',
      JSON.stringify({
        ...metadata,
        version: '0.3.0',
        dependencies: { 'lism-css': '^2.0.0' },
      }),
    );
    commit();
    assert.deepEqual([...versionOnlyPackages(base)], []);
    assert.notEqual(fingerprints().browser, before.browser);
  } finally {
    process.chdir(previous);
    for (const [key, value] of gitEnvironment) process.env[key] = value;
    rmSync(directory, { recursive: true, force: true });
  }
});
