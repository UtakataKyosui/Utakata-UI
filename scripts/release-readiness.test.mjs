import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inspectReadiness } from './release-readiness.mjs';

test('unknown access and absent protection never become release-readiness passes', () => {
  assert.ok(
    inspectReadiness({}).every((check) => check.status === 'unverified'),
  );
  const checks = inspectReadiness({
    rules: [
      {
        type: 'required_status_checks',
        parameters: { required_status_checks: [{ context: 'accessibility' }] },
      },
    ],
    environment: {
      name: 'npm',
      protection_rules: [
        { type: 'required_reviewers', reviewers: [{ id: 1 }] },
      ],
    },
    identity: 'maintainer',
  });
  assert.deepEqual(
    checks.map(({ status }) => status),
    ['passed', 'passed', 'passed', 'unverified', 'unverified'],
  );
  assert.equal(
    inspectReadiness({
      protection: { required_status_checks: { contexts: ['unrelated'] } },
    })[0].status,
    'unverified',
  );
});

test('manual registry evidence must name the package and reviewer and remain fresh', () => {
  const now = Date.parse('2026-11-10T00:00:00Z');
  const valid = {
    package: '@utakata-ui/react',
    status: 'passed',
    reviewer: 'maintainer',
    evidence: 'private-review-record-123',
    checkedAt: '2026-11-09T00:00:00Z',
  };
  const inspect = (record) =>
    inspectReadiness({
      now,
      attestations: { 'npm.scope-publish-rights': record },
    })[3].status;
  assert.equal(inspect(valid), 'passed');
  for (const override of [
    { status: 'unverified' },
    { checkedAt: '2026-09-01' },
    { checkedAt: '2027-01-01' },
    { reviewer: '' },
    { evidence: '' },
    { package: '@other/react' },
  ])
    assert.equal(inspect({ ...valid, ...override }), 'unverified');
});
