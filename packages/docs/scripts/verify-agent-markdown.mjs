import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { componentManifest } from '@utakata-ui/react/manifest';
import {
  isProse,
  partRows,
  propRows,
  slugOf,
  translate,
} from './reference-model.mjs';

// This is an information-preservation check, not an accessibility audit.
const normalized = (text) =>
  text
    .replace(/\\([|{}<>])/g, '$1')
    .replaceAll('`', '')
    .replace(/\s+/g, ' ')
    .trim();

function requireText(markdown, expected, context) {
  assert.ok(
    normalized(markdown).includes(normalized(expected)),
    `${context}: missing ${expected}`,
  );
}

function verifyProps(markdown, component, name, localize) {
  for (const row of propRows(component)) {
    requireText(markdown, `| \`${row.name}\` |`, `${name}.props`);
    if (row.type)
      requireText(markdown, localize(row.type), `${name}.${row.name}.type`);
    if (
      row.default !== undefined &&
      !['none', 'required'].includes(row.default)
    ) {
      const value =
        typeof row.default === 'string' && isProse(row.default)
          ? localize(row.default)
          : JSON.stringify(row.default);
      requireText(markdown, value, `${name}.${row.name}.default`);
    }
  }
}

export function verifyPage(markdown, component, name, locale, dictionary = {}) {
  const localize = (value) =>
    locale === 'ja' && isProse(value) ? translate(dictionary, value) : value;
  assert.doesNotMatch(
    markdown,
    /<(?:PropTable|PartTable|QualityRules|BadgeList)\b/,
    `${name}: unconverted reference component`,
  );
  for (const field of ['description', 'composition', 'accessibility'])
    requireText(markdown, localize(component[field]), `${name}.${field}`);
  verifyProps(markdown, component, name, localize);
  for (const part of partRows(name, component)) {
    requireText(markdown, part.name, `${name}.parts`);
    if (part.props)
      requireText(markdown, localize(part.props), `${part.name}.props`);
  }
  for (const value of component.avoid ?? [])
    requireText(markdown, localize(value), `${name}.avoid`);
  for (const state of component.verificationStates)
    requireText(markdown, `\`${state}\``, `${name}.states`);
  verifyRules(markdown, component.qualityRules, localize, name);
  requireText(
    markdown,
    `${locale === 'en' ? '/en' : ''}/components/quality`,
    `${name}.shared rules link`,
  );
}

export function verifyRules(
  markdown,
  rules,
  localize = (value) => value,
  context = 'shared',
) {
  assert.doesNotMatch(
    markdown,
    /<QualityRules\b/,
    `${context}: unconverted quality rules`,
  );
  for (const rule of rules) {
    requireText(markdown, `\`${rule.id}\``, context);
    for (const field of [
      'requirement',
      'remediation',
      'applicability',
      'residual',
    ])
      if (rule[field])
        requireText(markdown, localize(rule[field]), `${rule.id}.${field}`);
    for (const criterion of rule.criteria ?? [])
      requireText(markdown, criterion, `${rule.id}.criteria`);
  }
}

export async function verifyAgentMarkdown(root) {
  let count = 0;
  for (const locale of ['ja', 'en']) {
    const prefix = locale === 'en' ? 'en/' : '';
    for (const [name, component] of Object.entries(
      componentManifest.components,
    )) {
      const dictionary =
        locale === 'ja'
          ? JSON.parse(
              await readFile(
                new URL(`../i18n/ja/components/${name}.json`, import.meta.url),
                'utf8',
              ),
            )
          : {};
      const markdown = await readFile(
        new URL(`${prefix}components/${slugOf(name)}.md`, root),
        'utf8',
      );
      verifyPage(markdown, component, name, locale, dictionary);
      count++;
    }
    const dictionary = JSON.parse(
      await readFile(
        new URL('../i18n/ja/shared.json', import.meta.url),
        'utf8',
      ),
    );
    const markdown = await readFile(
      new URL(`${prefix}components/quality.md`, root),
      'utf8',
    );
    verifyRules(markdown, componentManifest.sharedQualityRules, (value) =>
      locale === 'ja' ? translate(dictionary, value) : value,
    );
    count++;
  }
  return count;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const count = await verifyAgentMarkdown(
    new URL('../.vercel/output/static/', import.meta.url),
  );
  console.log(
    `Verified manifest content in ${count} agent Markdown pages (ja/en).`,
  );
}
