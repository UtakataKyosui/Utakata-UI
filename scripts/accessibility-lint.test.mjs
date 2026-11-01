import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { MLEngine } from 'markuplint';

const configFile = fileURLToPath(
  new URL('../.markuplintrc.json', import.meta.url),
);

async function check(code) {
  const engine = await MLEngine.fromCode(code, {
    name: 'control.tsx',
    configFile,
  });
  try {
    const result = await engine.exec();
    assert.ok(
      result,
      'Lint must execute instead of silently skipping the fixture',
    );
    return result.violations;
  } finally {
    await engine.close();
  }
}

test('Markuplint accepts valid native JSX', async () => {
  assert.deepEqual(
    await check(
      'export const Example = () => <button type="button">Save</button>;',
    ),
    [],
  );
});

test('Markuplint detects missing alternatives and invalid HTML nesting', async () => {
  const unnamed = await check(
    'export const Example = () => <img src="/example.png" width="16" height="16" />;',
  );
  assert.ok(
    unnamed.some(({ name }) => name === 'a11y/require-accessible-name'),
  );
  const nested = await check(
    'export const Example = () => <button type="button"><button type="button">Save</button></button>;',
  );
  assert.ok(nested.some(({ ruleId }) => ruleId === 'permitted-contents'));
});
