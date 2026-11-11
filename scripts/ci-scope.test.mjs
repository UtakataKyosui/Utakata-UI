import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selectScope } from './ci-scope.mjs';

test('README and agent rules do not start build or browser jobs', () => {
  const docs = selectScope(['README.md', 'ACCESSIBILITY.md']);
  assert.equal(docs.lint, true);
  assert.equal(docs.browser, false);
  assert.equal(docs.build, false);
  assert.equal(docs.tests, false);
  assert.equal(selectScope(['.claude/rules/accessibility.md']).agents, true);
  const packagedReadme = selectScope(['packages/react/README.md']);
  assert.equal(packagedReadme.react, true);
  assert.equal(packagedReadme.browser, false);
});

test('component changes retain consumer, browser, docs and unit coverage', () => {
  const scope = selectScope(['packages/react/src/components/Button.tsx']);
  for (const flag of [
    'types',
    'tests',
    'markup',
    'browser',
    'react',
    'docs',
    'fallow',
  ])
    assert.equal(scope[flag], true, flag);
});

test('React exports and manifest changes verify the packed library and Blume docs', () => {
  for (const file of [
    'packages/react/src/index.ts',
    'packages/react/src/metadata/manifest.ts',
    'packages/react/tsconfig.build.json',
  ]) {
    const scope = selectScope([file]);
    assert.equal(scope.react, true, file);
    assert.equal(scope.docs, true, file);
    assert.equal(scope.build, true, file);
  }
  assert.equal(selectScope(['packages/react/README.md']).docs, false);
  assert.equal(
    selectScope(['packages/react/src/tests/diagnostics.test.tsx']).docs,
    false,
  );
});

test('CSS keeps browser/build checks; docs MCP config selects docs without a separate package gate', () => {
  assert.equal(
    selectScope(['packages/react/src/styles/styles.css']).browser,
    true,
  );
  const docs = selectScope(['packages/docs/blume.config.ts']);
  assert.equal(docs.docs, true);
  assert.equal(docs.types, true);
  assert.equal(docs.browser, false);
  assert.equal(docs.build, false);
  assert.equal('mcp' in docs, false);
});

test('docs and unit fixtures only run their relevant gates', () => {
  const docs = selectScope(['packages/docs/docs/getting-started.md']);
  assert.equal(docs.docs, true);
  assert.equal(docs.react, false);
  assert.equal(docs.browser, false);
  const unit = selectScope(['packages/react/src/tests/diagnostics.test.tsx']);
  assert.equal(unit.tests, true);
  assert.equal(unit.react, false);
  assert.equal(unit.browser, false);
  assert.equal(
    selectScope(['tests/browser/accessibility.spec.ts']).browser,
    true,
  );
  for (const file of ['playwright.config.ts', 'tests/browser/vite.config.ts']) {
    const browser = selectScope([file]);
    assert.equal(browser.browser, true);
    assert.equal(browser.build, false);
    assert.equal(browser.tests, false);
  }
});

test('screen reader fixtures and engine configs select browser checks without unrelated package gates', () => {
  for (const file of [
    'tests/screen-reader/output.spec.ts',
    'playwright.screen-reader.config.ts',
    'playwright.cross-browser.config.ts',
  ]) {
    const scope = selectScope([file]);
    assert.equal(scope.browser, true, file);
    assert.equal(scope.types, true, file);
    assert.equal(scope.build, false, file);
    assert.equal(scope.tests, false, file);
  }
});

test('dependencies, shared configuration, unknown code and unverified bases use full gates', () => {
  for (const file of [
    'pnpm-lock.yaml',
    'package.json',
    'packages/react/package.json',
    'vitest.config.ts',
    'packages/react/src/tests/test-setup.ts',
    '.markuplintrc.json',
    '.github/workflows/quality.yml',
    'scripts/ci-scope.mjs',
    'new-tool.mjs',
  ]) {
    const scope = selectScope([file]);
    assert.ok(Object.values(scope).every(Boolean), file);
  }
  assert.ok(Object.values(selectScope([], true)).every(Boolean));
});

test('multi-commit/deletion/rename path lists preserve all affected areas', () => {
  // --no-renames emits both old and new paths, including deleted source files.
  const scope = selectScope([
    'packages/react/src/components/Removed.tsx',
    'packages/docs/examples/new.tsx',
  ]);
  assert.equal(scope.browser, true);
  assert.equal(scope.react, true);
  assert.equal(scope.docs, true);
});

test('CLI work has its own gate; shared browser and release policy invalidate all gates', () => {
  for (const file of [
    'packages/cli/src/index.mjs',
    'scripts/verify-cli-package.mjs',
  ]) {
    const scope = selectScope([file]);
    assert.equal(scope.cli, true);
    assert.equal(scope.build, true);
    assert.equal(scope.browser, false);
    assert.equal(scope.tests, false);
  }
  for (const file of [
    '.github/workflows/browser.yml',
    '.github/workflows/release.yml',
    '.github/workflows/release-cli.yml',
    'scripts/prior-verification.mjs',
    'scripts/verified-runs.mjs',
  ]) {
    assert.equal(selectScope([file]).full, true, file);
  }
});

test('new browser JSX fixtures retain static markup validation', () => {
  const scope = selectScope(['tests/browser/layout-fixture.tsx']);
  assert.equal(scope.markup, true);
  assert.equal(scope.browser, true);
});
