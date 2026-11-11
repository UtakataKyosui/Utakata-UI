import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function evaluateGates(jobs, event) {
  if (jobs.scope?.result !== 'success')
    return {
      passed: false,
      error: 'Scope selection did not succeed.',
      gates: [],
    };
  const scope = jobs.scope.outputs;
  if (
    !['checks', 'tests', 'cli', 'build', 'docs', 'browser', 'fallow'].every(
      (key) => ['true', 'false'].includes(scope?.[key]),
    )
  )
    return {
      passed: false,
      error: 'Scope outputs are missing or invalid.',
      gates: [],
    };
  const required = {
    checks: scope.checks === 'true',
    unit: scope.tests === 'true' || scope.cli === 'true',
    build: scope.build === 'true',
    docs: scope.docs === 'true',
    'browser-accessibility': scope.browser === 'true',
    fallow: event === 'pull_request' && scope.fallow === 'true',
  };
  const gates = Object.entries(required).map(([job, needed]) => ({
    job,
    required: needed,
    result: jobs[job]?.result ?? 'missing',
    passed: jobs[job]?.result === (needed ? 'success' : 'skipped'),
  }));
  return { passed: gates.every((gate) => gate.passed), gates };
}

export function gatesPassed(jobs, event) {
  return evaluateGates(jobs, event).passed;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = evaluateGates(
    JSON.parse(process.env.RESULTS),
    process.env.EVENT_NAME,
  );
  const lines = report.gates.map(
    ({ job, required, result, passed }) =>
      `${job}: ${result}; ${required ? 'required for this change' : 'not required for this change'}${passed ? '' : ' — gate failed'}`,
  );
  if (report.error) lines.unshift(report.error);
  console.log(lines.join('\n'));
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `### Required quality gate\n\n${lines.map((line) => `- ${line}`).join('\n')}\n`,
    );
  if (!report.passed) {
    console.error(
      'An applicable CI gate failed, was cancelled, or has missing evidence.',
    );
    process.exitCode = 1;
  }
}
