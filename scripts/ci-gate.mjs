import { pathToFileURL } from 'node:url';

export function gatesPassed(jobs, event) {
  if (jobs.scope?.result !== 'success') return false;
  const scope = jobs.scope.outputs;
  if (
    !['checks', 'tests', 'cli', 'build', 'docs', 'browser', 'fallow'].every(
      (key) => ['true', 'false'].includes(scope?.[key]),
    )
  )
    return false;
  const required = {
    checks: scope.checks === 'true',
    unit: scope.tests === 'true' || scope.cli === 'true',
    build: scope.build === 'true',
    docs: scope.docs === 'true',
    'browser-accessibility': scope.browser === 'true',
    fallow: event === 'pull_request' && scope.fallow === 'true',
  };
  return Object.entries(required).every(([job, needed]) =>
    needed ? jobs[job]?.result === 'success' : jobs[job]?.result === 'skipped',
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (!gatesPassed(JSON.parse(process.env.RESULTS), process.env.EVENT_NAME)) {
    console.error(
      'An applicable CI gate failed, was cancelled, or has missing evidence.',
    );
    process.exitCode = 1;
  }
}
