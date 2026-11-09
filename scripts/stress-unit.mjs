import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sourceFingerprint } from './evidence-contract.mjs';

const runs = Number(process.env.STABILITY_RUNS ?? 10);
const workers = process.env.STABILITY_WORKERS ?? '2';
if (
  !Number.isInteger(runs) ||
  runs < 2 ||
  runs > 30 ||
  !['2', '4', 'default'].includes(workers)
)
  throw new Error(
    'STABILITY_RUNS must be 2–30; STABILITY_WORKERS must be 2, 4 or default',
  );
mkdirSync('unit-stability-results', { recursive: true });
const directory = mkdtempSync('unit-stability-results/run-');
const source = sourceFingerprint();
const records = [];
for (let index = 1; index <= runs; index++) {
  const output = join(directory, `${index}.json`);
  const started = Date.now();
  const result = spawnSync(
    'pnpm',
    [
      'exec',
      'vitest',
      'run',
      '--reporter=json',
      `--outputFile=${output}`,
      ...(workers === 'default' ? [] : [`--maxWorkers=${workers}`]),
    ],
    {
      encoding: 'utf8',
      env: { ...process.env, CI: workers === 'default' ? '' : 'true' },
      timeout: 180_000,
    },
  );
  writeFileSync(
    join(directory, `${index}.log`),
    `${result.stdout ?? ''}\n${result.stderr ?? ''}\n${result.error?.stack ?? ''}`,
  );
  let report;
  try {
    report = JSON.parse(readFileSync(output, 'utf8'));
  } catch {
    /* Missing report is unverified and fails. */
  }
  const passed =
    result.status === 0 &&
    report?.success === true &&
    report.numTotalTests > 0 &&
    report.numPendingTests === 0 &&
    report.numTodoTests === 0;
  records.push({
    index,
    passed,
    durationMs: Date.now() - started,
    exitCode: result.status,
    output,
    totalTests: report?.numTotalTests,
  });
  console.log(
    `Full unit suite ${index}/${runs}: ${passed ? 'passed' : 'failed/unverified'}`,
  );
}
const sourceAfter = sourceFingerprint();
const evidence = {
  source,
  sourceAfter,
  sourceChanged: source !== sourceAfter,
  environment: {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    workers,
  },
  status:
    records.every((record) => record.passed) && source === sourceAfter
      ? 'passed'
      : 'failed',
  records,
  conclusion:
    'Repeated passes measure stability under these conditions; they do not identify the original Skeleton failure cause.',
};
writeFileSync(
  join(directory, 'summary.json'),
  `${JSON.stringify(evidence, null, 2)}\n`,
);
if (evidence.status !== 'passed') process.exitCode = 1;
