import assert from 'node:assert/strict';
import { test } from 'node:test';
import RequiredBrowserChecks from './required-browser-checks.mjs';

function run(tests) {
  const reporter = new RequiredBrowserChecks({
    requiredIds: ['input.visual-theme'],
  });
  reporter.onBegin({}, { allTests: () => tests });
  return reporter.onEnd();
}

const fixture = (project, status = 'passed') => ({
  title: '[input.visual-theme] visual properties',
  titlePath: () => [project],
  expectedStatus: 'passed',
  results: [{ status }],
});

test('required browser coverage rejects missing themes, rules and skipped results', () => {
  assert.deepEqual(run([]), { status: 'failed' });
  assert.deepEqual(run([fixture('chromium-light')]), { status: 'failed' });
  assert.deepEqual(
    run([fixture('chromium-light'), fixture('chromium-dark', 'skipped')]),
    { status: 'failed' },
  );
  const wrong = fixture('chromium-dark');
  wrong.title = 'unrelated passing check';
  assert.deepEqual(run([fixture('chromium-light'), wrong]), {
    status: 'failed',
  });
  for (const status of ['failed', 'timedOut', 'interrupted']) {
    assert.deepEqual(
      run([fixture('chromium-light'), fixture('chromium-dark', status)]),
      { status: 'failed' },
    );
  }
  const missing = fixture('chromium-dark');
  missing.results = [];
  assert.deepEqual(run([fixture('chromium-light'), missing]), {
    status: 'failed',
  });
  assert.equal(
    run([fixture('chromium-light'), fixture('chromium-dark')]),
    undefined,
  );
});
