import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { componentManifest } from '@utakata-ui/react/manifest';
import { verifyAgentMarkdown, verifyPage } from './verify-agent-markdown.mjs';

test('built agent pages preserve public usage guidance in both locales', async () => {
  const root = new URL('../.vercel/output/static/', import.meta.url);
  assert.equal(
    await verifyAgentMarkdown(root),
    Object.keys(componentManifest.components).length * 2,
  );
});

test('missing usage content and reintroduced quality requirements fail the content contract', async () => {
  const markdown = await readFile(
    new URL(
      '../.vercel/output/static/en/components/button.md',
      import.meta.url,
    ),
    'utf8',
  );
  const component = componentManifest.components.Button;
  const invalid = [
    markdown.replace('| `variant` |', '| removed |'),
    markdown.replace(component.composition, ''),
    markdown.replace(component.accessibility, ''),
    `${markdown}\n## Quality requirements`,
    `${markdown}\n[Shared requirements](/en/components/quality)`,
    `${markdown}\n<QualityRules />`,
    `${markdown}\n<PropTable />`,
  ];
  for (const fixture of invalid)
    assert.throws(() => verifyPage(fixture, component, 'Button', 'en'));
});
