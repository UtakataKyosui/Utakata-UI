import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { changedFiles } from './ci-scope.mjs';

const all = [
  'packages/react/src/components/**/*.tsx',
  'packages/docs/**/*.tsx',
  'tests/browser/main.tsx',
  'tests/browser/index.html',
];
const base = process.env.CI_DIFF_BASE;
const files = base
  ? changedFiles(base).filter(
      (file) =>
        /^(packages\/react\/src\/components\/.*\.tsx|packages\/docs\/.*\.tsx|tests\/browser\/(main\.tsx|index\.html))$/.test(
          file,
        ) && existsSync(file),
    )
  : all;
if (files.length) {
  execFileSync(
    process.execPath,
    [
      'node_modules/markuplint/bin/markuplint.mjs',
      ...files,
      '--no-allow-warnings',
    ],
    { stdio: 'inherit' },
  );
} else {
  console.log('No changed markup files; lint harness controls still run.');
}
