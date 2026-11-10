import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { lookupVerifiedBase } from './verified-runs.mjs';

const flags = [
  'lint',
  'types',
  'tests',
  'markup',
  'browser',
  'docs',
  'react',
  'cli',
  'agents',
  'fallow',
];

// Rules are additive: source files can affect several independent gates.
// Unrecognized paths run everything instead of silently losing coverage.
const rules = [
  [
    /(^|\/)package\.json$|^(pnpm-lock\.yaml|pnpm-workspace\.yaml|tsconfig\.json|biome\.json|vitest\.config\.ts|vite\.config\.ts|\.markuplintrc\.json|\.fallowrc\.json|\.github\/workflows\/(quality|browser|release)\.yml)$|(^|\/)test-setup\.[cm]?[jt]s$|^scripts\/(ci-scope|lint-markup|prior-verification|verified-runs)/,
    ['full'],
  ],
  [
    /^(AGENTS\.md$|\.agents\/|\.claude\/|\.codex\/|skills\/|scripts\/agent-hooks)/,
    ['agents'],
  ],
  [
    /^packages\/react\/(?!src\/tests\/)(?!.*\.(md|txt)$)(?!.*\/LICENSE$)/,
    ['react', 'browser', 'docs', 'fallow'],
  ],
  [/^packages\/react\/.*\.[cm]?[jt]sx?$/, ['types', 'tests', 'fallow']],
  [/^packages\/react\/src\/tests\//, ['tests', 'fallow']],
  [/^packages\/react\/src\/components\/.*\.tsx$/, ['markup']],
  [/^packages\/react\/.*(?:\.(md|txt)|\/LICENSE)$/, ['react']],
  [/^packages\/cli\/|^scripts\/verify-cli-package\.mjs$/, ['cli', 'fallow']],
  [/^packages\/docs\//, ['docs']],
  [/^packages\/docs\/.*\.[jt]sx?$/, ['types', 'fallow']],
  [/^packages\/docs\/.*\.tsx$/, ['markup']],
  [
    /^tests\/browser\/|^playwright\.config\.ts$|^scripts\/required-browser-checks\.mjs$/,
    ['browser', 'types', 'fallow'],
  ],
  [/^tests\/browser\/.*\.(tsx|html)$/, ['markup']],
  [/^scripts\/verify-react-package\.mjs$/, ['react', 'fallow']],
  [/^scripts\/accessibility-lint\.test\.mjs$/, ['markup', 'fallow']],
  [
    /\.(md|txt)$|^\.github\/workflows\/(actions\.lock|verify-lockfile\.yml|release\.yml)$|^\.gitignore$/,
    [],
  ],
];

export function selectScope(files, full = false) {
  const scope = Object.fromEntries(flags.map((flag) => [flag, full]));
  for (const file of files) {
    scope.lint = true;
    const matched = rules.filter(([pattern]) => pattern.test(file));
    if (!matched.length) return selectScope([], true);
    const selected = matched.flatMap(([, names]) => names);
    if (selected.includes('full')) return selectScope([], true);
    for (const flag of selected) scope[flag] = true;
  }
  scope.checks = scope.lint || scope.types || scope.tests || scope.markup;
  scope.build = scope.react || scope.cli;
  scope.full = full;
  return scope;
}

export function changedFiles(base) {
  return execFileSync(
    'git',
    ['diff', '--name-only', '--no-renames', '-z', base, 'HEAD'],
    { encoding: 'utf8' },
  )
    .split('\0')
    .filter(Boolean);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  // PRs use the entire merge-base diff, not just the last commit; invalid bases
  // fail. Main pushes diff against the newest main commit whose Quality run
  // passed; lookup failure or no such commit runs full gates. Manual runs are full.
  const event = process.env.EVENT_NAME;
  const head = execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  let base = '';
  if (event === 'pull_request') {
    base = execFileSync('git', ['merge-base', process.env.BASE_SHA, 'HEAD'], {
      encoding: 'utf8',
    }).trim();
  } else if (event === 'push') {
    try {
      base = lookupVerifiedBase(process.env.GITHUB_REPOSITORY, head);
    } catch (error) {
      console.log(`Verified main lookup failed: ${error.message}`);
    }
    console.log(`Verified main base: ${base || 'none (full gates)'}`);
  }
  const files = base ? changedFiles(base) : [];
  const scope = selectScope(files, !base);
  const output = Object.entries({ ...scope, base: scope.full ? '' : base })
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  console.log(output);
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, `${output}\n`);
}
