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
  assert.equal(scope.mcp, false);
});

test('CSS keeps browser/build checks; MCP changes do not start browsers or docs', () => {
  assert.equal(
    selectScope(['packages/react/src/styles/styles.css']).browser,
    true,
  );
  const mcp = selectScope(['packages/mcp/src/tools.ts']);
  assert.equal(mcp.mcp, true);
  assert.equal(mcp.tests, true);
  assert.equal(mcp.browser, false);
  assert.equal(mcp.docs, false);
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

test('dependencies, shared configuration, unknown code and main/manual runs use full gates', () => {
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
