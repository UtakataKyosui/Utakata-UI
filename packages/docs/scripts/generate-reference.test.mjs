import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';
import { componentManifest } from '@utakata-ui/react/manifest';
import {
  auditDictionary,
  categories,
  exportsByFile,
  isProse,
  sharedTranslatableStrings,
  slugOf,
  sourceKey,
  translatableStrings,
  translate,
} from './reference-model.mjs';
import { exampleLang, setHtmlLang } from './set-example-lang.mjs';

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

test('every example has an English counterpart without Japanese text', async () => {
  const examples = new URL('../examples/', import.meta.url);
  const names = (await readdir(examples)).filter((file) =>
    file.endsWith('.tsx'),
  );
  for (const name of Object.keys(componentManifest.components)) {
    assert.ok(names.includes(`${slugOf(name)}.tsx`), `${name} has no example`);
  }
  for (const file of names) {
    const source = await readFile(new URL(`en/${file}`, examples), 'utf8');
    assert.doesNotMatch(source, /[\u3040-\u30ff\u4e00-\u9fff]/u, `en/${file}`);
  }
});

test('example frames get the language of their locale', () => {
  assert.equal(exampleLang('button'), 'ja');
  assert.equal(exampleLang('en/button'), 'en');
  assert.equal(exampleLang('entry'), 'ja');
  assert.equal(
    setHtmlLang('<html lang="en"><body></body></html>', 'ja'),
    '<html lang="ja"><body></body></html>',
  );
  assert.throws(() => setHtmlLang('<html><body></body></html>', 'ja'));
});
