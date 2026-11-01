#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { Crust } from '@crustjs/core';
import { checkColors, parseChecks } from './check.js';

let hasViolations = false;

const app = new Crust('utakata-a11y')
  .flags({ name: 'config', type: 'string', required: true })
  .flags({ name: 'json', type: 'boolean' })
  .action(async ({ flags, stdout }) => {
    const checks = parseChecks(
      JSON.parse(await readFile(flags.config, 'utf8')),
    );
    const results = checkColors(checks);
    stdout(
      flags.json
        ? JSON.stringify(results, null, 2)
        : results
            .map(
              (result) =>
                `${result.violations.length ? 'FAIL' : 'PASS'} ${result.name}: ${result.ratio.toFixed(3)}:1 (minimum ${result.minimum}:1)${result.violations.length ? ` — ${result.violations.join('; ')}` : ''}`,
            )
            .join('\n'),
    );
    if (results.some((result) => result.violations.length))
      hasViolations = true;
  });

const code = await app.execute();
process.exitCode =
  code === 0 ? (hasViolations ? 1 : 0) : code === 130 ? 130 : 2;
