import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { gatesPassed } from './ci-gate.mjs';

function fixture(required) {
  return {
    scope: {
      result: 'success',
      outputs: Object.fromEntries(
        ['checks', 'tests', 'cli', 'build', 'docs', 'browser', 'fallow'].map(
          (key) => [key, String(required)],
        ),
      ),
    },
    ...Object.fromEntries(
      [
        'checks',
        'unit',
        'build',
        'docs',
        'browser-accessibility',
        'fallow',
      ].map((key) => [key, { result: required ? 'success' : 'skipped' }]),
    ),
  };
}

test('aggregate permits only irrelevant skips; every missing or nonpassing required gate fails', () => {
  assert.equal(gatesPassed(fixture(true), 'pull_request'), true);
  assert.equal(gatesPassed(fixture(false), 'pull_request'), true);
  const missingOutput = fixture(false);
  delete missingOutput.scope.outputs.browser;
  assert.equal(gatesPassed(missingOutput, 'pull_request'), false);
  for (const job of Object.keys(fixture(true))) {
    for (const status of ['failure', 'cancelled', 'skipped', undefined]) {
      const jobs = fixture(true);
      jobs[job].result = status;
      assert.equal(
        gatesPassed(jobs, 'pull_request'),
        false,
        `${job}: ${status}`,
      );
    }
  }
  const main = fixture(true);
  main.fallow.result = 'skipped';
  assert.equal(gatesPassed(main, 'push'), true);
  assert.equal(gatesPassed(main, 'pull_request'), false);
});

test('Quality and React release share the complete two-theme browser gate', () => {
  const read = (name) =>
    readFileSync(
      new URL(`../.github/workflows/${name}.yml`, import.meta.url),
      'utf8',
    );
  for (const name of ['quality', 'release']) {
    assert.match(read(name), /uses: \.\/\.github\/workflows\/browser\.yml/);
  }
  assert.match(read('release'), /needs: browser-accessibility/);
  assert.match(read('quality'), /run: node scripts\/ci-gate\.mjs/);
  assert.match(read('browser'), /project: \[chromium-light, chromium-dark\]/);
  assert.match(read('browser'), /fail-fast: false/);
  assert.match(
    read('browser'),
    /CI_BROWSER_PROJECT: \$\{\{ matrix.project \}\}/,
  );
  assert.match(read('browser'), /--project=\$\{\{ matrix.project \}\}/);
  assert.doesNotMatch(
    read('browser'),
    /continue-on-error|--grep|--pass-with-no-tests/,
  );
});
