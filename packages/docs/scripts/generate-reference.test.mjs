import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { componentManifest } from '@utakata-ui/react/manifest';
import {
  auditDictionary,
  categories,
  exportsByFile,
  isProse,
  sharedTranslatableStrings,
  sourceKey,
  translatableStrings,
  translate,
} from './reference-model.mjs';

const readJson = async (path) =>
  JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));

test('every manifest component belongs to exactly one sidebar category', () => {
  const categorized = categories.flatMap(({ components }) => components);
  assert.deepEqual(
    [...categorized].sort(),
    Object.keys(componentManifest.components).sort(),
  );
  assert.equal(new Set(categorized).size, categorized.length);
});

test('every component has value exports for its import example', async () => {
  const exports = exportsByFile(
    await readFile(
      new URL('../../react/src/index.ts', import.meta.url),
      'utf8',
    ),
  );
  for (const name of Object.keys(componentManifest.components)) {
    assert.ok(exports.get(name)?.includes(name), `${name} is not exported`);
  }
});

test('Japanese dictionaries cover the current manifest without stale keys', async () => {
  const shared = await readJson('../i18n/ja/shared.json');
  assert.deepEqual(
    auditDictionary(sharedTranslatableStrings(componentManifest), shared),
    { missing: [], stale: [] },
  );
  for (const [name, component] of Object.entries(
    componentManifest.components,
  )) {
    const dictionary = await readJson(`../i18n/ja/components/${name}.json`);
    assert.deepEqual(
      auditDictionary(translatableStrings(component), dictionary),
      { missing: [], stale: [] },
      name,
    );
  }
});

test('the audit reports changed English sources as missing and stale', () => {
  const dictionary = { [sourceKey('The old English sentence.')]: '古い文。' };
  assert.deepEqual(auditDictionary(['A new English sentence.'], dictionary), {
    missing: ['A new English sentence.'],
    stale: [sourceKey('The old English sentence.')],
  });
  assert.deepEqual(
    auditDictionary(['A new English sentence.'], {
      [sourceKey('A new English sentence.')]: '  ',
    }).missing,
    ['A new English sentence.'],
  );
});

test('only prose is translated; code-like values pass through', () => {
  assert.equal(isProse("'primary' | 'secondary'"), false);
  assert.equal(isProse('ReactNode'), false);
  assert.equal(isProse('Native button props.'), true);
  assert.equal(translate({}, 'boolean'), 'boolean');
  assert.equal(
    translate(
      { [sourceKey('Native button props.')]: 'ネイティブの Props' },
      'Native button props.',
    ),
    'ネイティブの Props',
  );
});
