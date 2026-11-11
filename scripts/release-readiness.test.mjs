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
      protection_rules: [{ type: 'branch_policy' }],
      deployment_branch_policy: {
        custom_branch_policies: true,
        protected_branches: false,
      },
    },
    environmentPolicies: [{ name: 'main', type: 'branch' }],
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

test('automatic publication readiness requires main-only policies without manual approval', () => {
  const environment = {
    name: 'npm',
    protection_rules: [],
    deployment_branch_policy: { custom_branch_policies: true },
  };
  const inspect = (environmentPolicies, override = environment) =>
    inspectReadiness({ environment: override, environmentPolicies })[1].status;
  assert.equal(inspect([{ name: 'main', type: 'branch' }]), 'passed');
  for (const policies of [
    undefined,
    [],
    [{ name: '*', type: 'branch' }],
    [
      { name: 'main', type: 'branch' },
      { name: 'react-v*', type: 'tag' },
    ],
  ])
    assert.equal(inspect(policies), 'unverified');
  assert.equal(
    inspect([{ name: 'main', type: 'branch' }], {
      ...environment,
      protection_rules: [
        { type: 'required_reviewers', reviewers: [{ id: 1 }] },
      ],
    }),
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
