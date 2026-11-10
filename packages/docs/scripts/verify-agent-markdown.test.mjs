import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { componentManifest } from '@utakata-ui/react/manifest';
import {
  verifyAgentMarkdown,
  verifyPage,
  verifyRules,
} from './verify-agent-markdown.mjs';

test('built agent pages preserve the manifest in both locales', async () => {
  const root = new URL('../.vercel/output/static/', import.meta.url);
  assert.equal(
    await verifyAgentMarkdown(root),
    (Object.keys(componentManifest.components).length + 1) * 2,
  );
});

test('missing Props, composition, rules and shared links fail the content contract', async () => {
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
    markdown.replace(component.qualityRules[0].requirement, ''),
    markdown.replaceAll('/en/components/quality', '/missing'),
    `${markdown}\n<PropTable />`,
  ];
  for (const fixture of invalid)
    assert.throws(() => verifyPage(fixture, component, 'Button', 'en'));
  const shared = await readFile(
    new URL(
      '../.vercel/output/static/en/components/quality.md',
      import.meta.url,
    ),
    'utf8',
  );
  const rule = componentManifest.sharedQualityRules[0];
  assert.throws(() =>
    verifyRules(
      shared.replace(rule.requirement, ''),
      componentManifest.sharedQualityRules,
    ),
  );
});
