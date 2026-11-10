import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selectRelease } from './release-version.mjs';

const decide = (version, old = '0.1.0', overrides = {}) =>
  selectRelease({
    current: { name: '@utakata-ui/react', version },
    previous: { name: '@utakata-ui/react', version: old },
    expectedName: '@utakata-ui/react',
    event: 'push',
    ...overrides,
  });

test('only an increased package.json version selects an automatic release', () => {
  assert.deepEqual(decide('0.1.0'), { release: false, version: '0.1.0' });
  for (const version of ['0.1.1', '0.2.0', '1.0.0', '0.10.0'])
    assert.deepEqual(decide(version), { release: true, version });
  for (const version of [
    '0.0.9',
    '0.1.0-beta.1',
    '01.2.3',
    'v1.0.0',
    '9007199254740992.0.0',
  ])
    assert.throws(() => decide(version));
});

test('missing or mismatched package evidence cannot select an automatic release', () => {
  assert.throws(() => decide('0.2.0', '0.1.0', { previous: undefined }));
  assert.throws(() =>
    decide('0.2.0', '0.1.0', { expectedName: '@utakata-ui/cli' }),
  );
  assert.throws(() => decide('0.2.0', '0.1.0', { event: 'pull_request' }));
  assert.deepEqual(
    decide('0.1.0', '0.1.0', {
      event: 'workflow_dispatch',
      previous: undefined,
    }),
    { release: true, version: '0.1.0' },
  );
});
