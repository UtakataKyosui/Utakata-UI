import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function inspectReadiness({
  rules,
  protection,
  environment,
  environmentPolicies,
  identity,
  attestations = {},
  now = Date.now(),
}) {
  const confirmed = (id) => {
    const record = attestations[id];
    const age = now - Date.parse(record?.checkedAt);
    return (
      record?.package === '@utakata-ui/react' &&
      record?.status === 'passed' &&
      typeof record?.reviewer === 'string' &&
      record.reviewer.length > 0 &&
      typeof record?.evidence === 'string' &&
      record.evidence.length > 0 &&
      age >= 0 &&
      age <= 30 * 24 * 60 * 60 * 1000
    );
  };
  const contexts = [
    ...(protection?.required_status_checks?.contexts ?? []),
    ...(protection?.required_status_checks?.checks ?? []).map(
      (check) => check.context,
    ),
    ...(rules ?? [])
      .filter((rule) => rule.type === 'required_status_checks')
      .flatMap((rule) => rule.parameters?.required_status_checks ?? [])
      .map((check) => check.context),
  ];
  return [
    {
      id: 'github.required-quality',
      status: contexts.includes('accessibility') ? 'passed' : 'unverified',
      expected: 'main requires accessibility',
      issue: '#49',
    },
    {
      id: 'github.npm-environment',
      status:
        environment?.name === 'npm' &&
        environment.deployment_branch_policy?.custom_branch_policies === true &&
        environment.protection_rules?.every(
          (rule) =>
            rule.type !== 'required_reviewers' || !rule.reviewers?.length,
        ) &&
        environmentPolicies?.length === 1 &&
        environmentPolicies[0].name === 'main' &&
        environmentPolicies[0].type === 'branch'
          ? 'passed'
          : 'unverified',
      expected:
        'npm environment permits only main and has no manual reviewer gate for automatic publication',
      issue: '#8',
    },
    {
      id: 'npm.authenticated',
      status:
        typeof identity === 'string' && identity.length > 0
          ? 'passed'
          : 'unverified',
      expected: 'Authenticated local npm account; credentials never recorded',
      issue: '#8',
    },
    {
      id: 'npm.scope-publish-rights',
      status: confirmed('npm.scope-publish-rights') ? 'passed' : 'unverified',
      expected:
        'Maintainer confirms @utakata-ui ownership and rights to create/publish @utakata-ui/react; E404 is insufficient',
      issue: '#8',
    },
    {
      id: 'npm.trusted-publisher',
      status: confirmed('npm.trusted-publisher') ? 'passed' : 'unverified',
      expected:
        'After initial publication: npm package Trusted Publisher matches owner/repository/release.yml/environment npm',
      issue: '#8',
    },
  ];
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const metadata = JSON.parse(
    readFileSync('packages/react/package.json', 'utf8'),
  );
  const read = (command, args) => {
    try {
      return JSON.parse(
        execFileSync(command, args, {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        }),
      );
    } catch {
      return undefined;
    }
  };
  const repository = 'repos/UtakataKyosui/Utakata-UI';
  const checks = inspectReadiness({
    rules: read('gh', ['api', `${repository}/rules/branches/main`]),
    protection: read('gh', ['api', `${repository}/branches/main/protection`]),
    environment: read('gh', ['api', `${repository}/environments/npm`]),
    environmentPolicies: read('gh', [
      'api',
      `${repository}/environments/npm/deployment-branch-policies`,
    ])?.branch_policies,
    identity: read('npm', ['whoami', '--json']),
    attestations: process.argv[2]
      ? JSON.parse(readFileSync(process.argv[2], 'utf8'))
      : {},
  });
  console.log(
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        package: {
          name: metadata.name,
          version: metadata.version,
          license: metadata.license,
          access: metadata.publishConfig.access,
        },
        checks,
        note: 'Read-only preflight. Unknown/unauthorized responses stay unverified. Initial publication and settings changes require explicit authorization.',
      },
      null,
      2,
    ),
  );
  if (checks.some((check) => check.status !== 'passed')) process.exitCode = 1;
}
