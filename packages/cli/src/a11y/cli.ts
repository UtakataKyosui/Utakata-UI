import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { checkColors, parseChecks } from './check.js';

export async function runA11y(args: string[]): Promise<number> {
  try {
    const { values } = parseArgs({
      args,
      options: {
        config: { type: 'string' },
        json: { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
      },
    });
    if (values.help) {
      console.log('utakata-ui a11y --config <path> [--json]');
      return 0;
    }
    if (!values.config) throw new Error('--config is required');
    const checks = parseChecks(
      JSON.parse(await readFile(values.config, 'utf8')),
    );
    const results = checkColors(checks);
    console.log(
      values.json
        ? JSON.stringify(results, null, 2)
        : results
            .map(
              (result) =>
                `${result.violations.length ? 'FAIL' : 'PASS'} ${result.name}: ${result.ratio.toFixed(3)}:1 (minimum ${result.minimum}:1)${result.violations.length ? ` — ${result.violations.join('; ')}` : ''}`,
            )
            .join('\n'),
    );
    return results.some((result) => result.violations.length) ? 1 : 0;
  } catch (error) {
    console.error(
      `Utakata UI a11y: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 2;
  }
}
