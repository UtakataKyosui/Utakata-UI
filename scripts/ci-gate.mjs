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
  let reuse;
  let fingerprints;
  try {
    ({ reuse, fingerprints } = parseEvidence(scope));
  } catch {
    return { passed: false, error: 'Invalid reused evidence.', gates: [] };
  }
  const gates = Object.entries(required).map(([job, needed]) =>
    evaluateGate(job, needed, jobs, reuse, fingerprints),
  );
  if (
    Object.keys(reuse).some(
      (key) => !['checks', 'unit', 'build', 'docs', 'browser'].includes(key),
    )
  )
    return { passed: false, error: 'Unknown reused gate.', gates };
  return { passed: gates.every((gate) => gate.passed), gates };
}

function parseEvidence(scope) {
  const reuse = JSON.parse(scope.reuse ?? '{}');
  const fingerprints = JSON.parse(scope.fingerprints ?? '{}');
  for (const value of [reuse, fingerprints]) {
    if (!value || Array.isArray(value) || typeof value !== 'object')
      throw new Error('Invalid evidence object.');
  }
  return { reuse, fingerprints };
}

function evaluateGate(job, required, jobs, reuse, fingerprints) {
  const key = job === 'browser-accessibility' ? 'browser' : job;
  const proof = reuse[key];
  const result = jobs[job]?.result ?? 'missing';
  const passed = proof
    ? required && result === 'skipped' && validReuse(proof, fingerprints[key])
    : result === (required ? 'success' : 'skipped');
  return { job, required, result, reused: proof, passed };
}

function validReuse(proof, fingerprint) {
  return (
    [proof.runId, proof.attempt].every(positiveInteger) &&
    /^[a-f0-9]{40}$/.test(proof.sha ?? '') &&
    /^[a-f0-9]{64}$/.test(proof.fingerprint ?? '') &&
    proof.fingerprint === fingerprint &&
    Date.parse(proof.expiresAt) > Date.now()
  );
}

function positiveInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
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
    ({ job, required, result, passed, reused }) =>
      `${job}: ${result}; ${reused ? `reused verified run ${reused.runId}, attempt ${reused.attempt}` : required ? 'required for this change' : 'not required for this change'}${passed ? '' : ' — gate failed'}`,
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
