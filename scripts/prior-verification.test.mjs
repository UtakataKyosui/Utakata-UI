import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selectReuse } from './prior-verification.mjs';
import {
  maxReuseAgeMs,
  qualityCandidate,
  releaseCandidate,
  verifiedBase,
} from './verified-runs.mjs';

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

const browserPassed = ['chromium', 'firefox', 'webkit'].flatMap((browser) =>
  ['light', 'dark'].map((theme) => ({
    name: `browser-accessibility / browser (${browser}-${theme})`,
    conclusion: 'success',
  })),
);
browserPassed.push(
  ...['voiceover-webkit', 'nvda-firefox'].map((reader) => ({
    name: `browser-accessibility / screen-reader (${reader})`,
    conclusion: 'success',
  })),
);
const quality = (overrides) => qualityCandidate(run(overrides), browserPassed);

test('unchanged commits reuse a passing main Quality run for every gate', () => {
  const decisions = decide({ candidates: [quality()] });
  assert.equal(decisions.checks.decision, 'reuse');
  assert.equal(decisions.browser.decision, 'reuse');
  assert.equal(decisions.browser.id, 1);
});

test('documentation changes rerun checks but reuse browser evidence', () => {
  const decisions = decide({
    files: ['README.md'],
    candidates: [quality()],
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
      candidates: [quality()],
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
  const expired = quality({
    created_at: new Date(now - maxReuseAgeMs - 1).toISOString(),
  });
  assert.equal(decide({ candidates: [expired] }).checks.decision, 'run');
  assert.equal(
    decide({ candidates: [quality()], ancestor: false }).checks.decision,
    'run',
  );
});

test('release runs count verification jobs even when publication failed', () => {
  const passedJobs = [
    { name: 'verify', conclusion: 'success' },
    ...browserPassed,
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

test('main pushes use the newest verified ancestor or fall back to full gates', () => {
  const candidates = [
    qualityCandidate(run({ head_sha: 'not-ancestor' })),
    qualityCandidate(run({ head_sha: 'parent' })),
  ];
  const base = (overrides) =>
    verifiedBase({
      head: 'head',
      candidates,
      isAncestor: (sha) => sha === 'parent',
      now,
      ...overrides,
    });
  assert.equal(base(), 'parent');
  assert.equal(base({ candidates: [] }), '');
  assert.equal(base({ now: now + maxReuseAgeMs }), '');
});

test('a newer candidate that requires a gate does not hide an exact older match', () => {
  const decisions = selectReuse({
    head: 'head',
    gates: ['browser'],
    candidates: [
      quality({ id: 2, head_sha: 'older-css' }),
      quality({ id: 1, head_sha: 'head' }),
    ],
    isAncestor: () => true,
    filesSince: (sha) =>
      sha === 'head' ? [] : ['packages/react/src/styles/styles.css'],
    now,
  });
  assert.equal(decisions.browser.id, 1);
});

test('incremental main runs without browser jobs never stand in for browser evidence', () => {
  const docsOnly = qualityCandidate(
    run({ id: 3, head_sha: 'docs-only' }),
    browserPassed.map((job) => ({ ...job, conclusion: 'skipped' })),
  );
  assert.deepEqual(docsOnly.satisfies, ['checks']);
  const decisions = selectReuse({
    head: 'head',
    gates: ['browser'],
    candidates: [docsOnly, quality({ id: 1, head_sha: 'browsers-ran' })],
    isAncestor: () => true,
    filesSince: () => ['README.md'],
    now,
  });
  assert.equal(decisions.browser.id, 1);
  const expiredBrowsers = quality({
    id: 1,
    created_at: new Date(now - maxReuseAgeMs - 1).toISOString(),
  });
  assert.equal(
    selectReuse({
      head: 'head',
      gates: ['browser'],
      candidates: [docsOnly, expiredBrowsers],
      isAncestor: () => true,
      filesSince: () => [],
      now,
    }).browser.decision,
    'run',
  );
});

test('partial browser or screen reader matrices cannot be reused', () => {
  for (const missing of browserPassed) {
    const jobs = browserPassed.filter((job) => job !== missing);
    assert.deepEqual(qualityCandidate(run(), jobs).satisfies, ['checks']);
    for (const conclusion of ['failure', 'cancelled', 'skipped']) {
      assert.deepEqual(
        qualityCandidate(run(), [...jobs, { ...missing, conclusion }])
          .satisfies,
        ['checks'],
      );
    }
  }
});
