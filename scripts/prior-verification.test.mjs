import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  maxReuseAgeMs,
  qualityCandidate,
  releaseCandidate,
  selectReuse,
} from './prior-verification.mjs';

const now = Date.parse('2026-11-10T00:00:00Z');
const run = (overrides) => ({
  id: 1,
  run_attempt: 1,
  head_sha: 'verified',
  head_branch: 'main',
  event: 'push',
  conclusion: 'success',
  created_at: '2026-11-09T00:00:00Z',
  ...overrides,
});
const decide = ({ files = [], candidates, ancestor = true }) =>
  selectReuse({
    head: 'head',
    gates: ['checks', 'browser'],
    candidates,
    isAncestor: () => ancestor,
    filesSince: () => files,
    now,
  });

test('unchanged commits reuse a passing main Quality run for every gate', () => {
  const decisions = decide({ candidates: [qualityCandidate(run())] });
  assert.equal(decisions.checks.decision, 'reuse');
  assert.equal(decisions.browser.decision, 'reuse');
  assert.equal(decisions.browser.id, 1);
});

test('documentation changes rerun checks but reuse browser evidence', () => {
  const decisions = decide({
    files: ['README.md'],
    candidates: [qualityCandidate(run())],
  });
  assert.equal(decisions.checks.decision, 'run');
  assert.equal(decisions.browser.decision, 'reuse');
});

test('component, CSS and release workflow changes rerun browser checks', () => {
  for (const file of [
    'packages/react/src/components/Button.tsx',
    'packages/react/src/styles/styles.css',
    '.github/workflows/release.yml',
  ]) {
    const decisions = decide({
      files: [file],
      candidates: [qualityCandidate(run())],
    });
    assert.equal(decisions.browser.decision, 'run', file);
  }
});

test('missing, failed, PR, branch, expired and non-ancestor runs never skip', () => {
  assert.equal(decide({ candidates: [] }).checks.decision, 'run');
  for (const overrides of [
    { conclusion: 'failure' },
    { event: 'pull_request' },
    { head_branch: 'feature' },
  ])
    assert.equal(qualityCandidate(run(overrides)), null);
  const expired = qualityCandidate(
    run({ created_at: new Date(now - maxReuseAgeMs - 1).toISOString() }),
  );
  assert.equal(decide({ candidates: [expired] }).checks.decision, 'run');
  assert.equal(
    decide({ candidates: [qualityCandidate(run())], ancestor: false }).checks
      .decision,
    'run',
  );
});

test('release runs count verification jobs even when publication failed', () => {
  const passedJobs = [
    { name: 'verify', conclusion: 'success' },
    {
      name: 'browser-accessibility / browser (chromium-light)',
      conclusion: 'success',
    },
    {
      name: 'browser-accessibility / browser (chromium-dark)',
      conclusion: 'success',
    },
    { name: 'release', conclusion: 'failure' },
  ];
  const release = releaseCandidate(
    run({ event: 'workflow_dispatch', conclusion: 'failure' }),
    passedJobs,
    'release.yml',
  );
  assert.deepEqual(release.satisfies, ['checks', 'browser']);

  const oneTheme = releaseCandidate(
    run({ event: 'workflow_dispatch' }),
    passedJobs.filter((job) => !job.name.endsWith('(chromium-dark)')),
    'release.yml',
  );
  assert.deepEqual(oneTheme.satisfies, ['checks']);
  assert.equal(
    releaseCandidate(
      run({ event: 'workflow_dispatch' }),
      [{ name: 'verify', conclusion: 'skipped' }],
      'release.yml',
    ),
    null,
  );
  assert.equal(
    releaseCandidate(
      run({ event: 'workflow_dispatch', head_branch: 'feature' }),
      passedJobs,
      'release.yml',
    ),
    null,
  );
});

test('a newer candidate that requires a gate does not hide an exact older match', () => {
  const decisions = selectReuse({
    head: 'head',
    gates: ['browser'],
    candidates: [
      qualityCandidate(run({ id: 2, head_sha: 'older-css' })),
      qualityCandidate(run({ id: 1, head_sha: 'head' })),
    ],
    isAncestor: () => true,
    filesSince: (sha) =>
      sha === 'head' ? [] : ['packages/react/src/styles/styles.css'],
    now,
  });
  assert.equal(decisions.browser.id, 1);
});
