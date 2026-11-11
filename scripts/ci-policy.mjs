// Additive rules: unknown paths invalidate every gate.
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
const rules = [
  [
    /(^|\/)package\.json$|^(pnpm-lock\.yaml|pnpm-workspace\.yaml|tsconfig\.json|biome\.json|vitest\.config\.ts|vite\.config\.ts|\.markuplintrc\.json|\.fallowrc\.json|\.github\/workflows\/(quality|browser|release)\.yml)$|(^|\/)test-setup\.[cm]?[jt]s$|^scripts\/(ci-scope|ci-policy|ci-evidence|lint-markup|prior-verification|verified-runs)/,
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
  [/^packages\/cli\/src\/registry\.mjs$/, ['docs']],
  [/^packages\/docs\/scripts\/generate-registry\.mjs$/, ['cli', 'fallow']],
  [/^packages\/docs\//, ['docs']],
  [/^packages\/docs\/.*\.[jt]sx?$/, ['types', 'fallow']],
  [/^packages\/docs\/.*\.tsx$/, ['markup']],
  [
    /^tests\/(browser|screen-reader)\/|^playwright(?:\.(?:cross-browser|screen-reader))?\.config\.ts$|^scripts\/required-browser-checks\.mjs$/,
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

export const evidenceGates = ['checks', 'unit', 'build', 'docs', 'browser'];
export const browserJobNames = [
  ...['chromium', 'firefox', 'webkit'].flatMap((engine) =>
    ['light', 'dark'].map(
      (theme) => `browser-accessibility / browser (${engine}-${theme})`,
    ),
  ),
  ...['voiceover-webkit', 'nvda-firefox'].map(
    (reader) => `browser-accessibility / screen-reader (${reader})`,
  ),
];

export function selectScope(files, full = false, versionOnly = new Set()) {
  const scope = Object.fromEntries(flags.map((flag) => [flag, full]));
  for (const file of files) {
    scope.lint = true;
    const selected = fileScope(file, versionOnly);
    if (selected.includes('full')) return selectScope([], true);
    for (const flag of selected) scope[flag] = true;
  }
  scope.checks = scope.lint || scope.types || scope.tests || scope.markup;
  scope.build = scope.react || scope.cli;
  scope.full = full;
  return scope;
}

function fileScope(file, versionOnly) {
  if (file.startsWith('.github/workflows/')) return ['full'];
  if (versionOnly.has(file)) {
    if (file === 'packages/react/package.json') return ['react', 'docs'];
    if (file === 'packages/cli/package.json') return ['cli'];
    return ['full'];
  }
  const matched = rules.filter(([pattern]) => pattern.test(file));
  return matched.length ? matched.flatMap(([, names]) => names) : ['full'];
}

export function requiredJobs(scope) {
  return {
    checks: scope.checks,
    unit: scope.tests || scope.cli,
    build: scope.build,
    docs: scope.docs,
    browser: scope.browser,
  };
}
