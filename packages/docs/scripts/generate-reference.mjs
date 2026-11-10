import { execFileSync } from 'node:child_process';
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { componentManifest } from '@utakata-ui/react/manifest';
import {
  auditDictionary,
  categories,
  exportsByFile,
  isProse,
  partRows,
  propRows,
  sharedTranslatableStrings,
  slugOf,
  sourceKey,
  translatableStrings,
} from './reference-model.mjs';

const docsRoot = new URL('../', import.meta.url);
const repoRoot = new URL('../../../', import.meta.url);
const manifest = componentManifest;

const text = {
  ja: {
    group: 'コンポーネント',
    indexTitle: 'コンポーネント一覧',
    indexDescription:
      '用途別のコンポーネント一覧と、各ページで確認できる内容です。',
    indexIntro:
      '各コンポーネントのページでは、操作できるプレビュー、インポート方法、使い方、Props、パーツ構成、アクセシビリティ、品質要件を確認できます。導入手順は[導入方法](/getting-started)を参照してください。',
    qualityTitle: '共通の品質要件',
    qualityDescription: 'すべてのコンポーネントに適用される品質要件です。',
    qualityIntro:
      'すべてのコンポーネントに共通する要件です。各コンポーネントのページには、そのコンポーネント固有の要件を記載しています。',
    verificationIntro:
      '要件は検証方法ごとに分類しています。「自動テスト」は jsdom と axe、「実ブラウザー検証」は Playwright による実ブラウザーでの検証、「手動確認」は支援技術や表示の確認です。手動確認は、記録された結果がない限り未検証として扱います。',
    preview: 'プレビュー',
    import: 'インポート',
    importNote:
      'スタイルはアプリのエントリーで `@utakata-ui/react/styles.css` を 1 度だけ読み込みます。詳しくは[導入方法](/getting-started)を参照してください。',
    usage: '使い方',
    props: 'Props',
    propsCaption: (name) => `${name} の Props`,
    propsNote:
      '「—」は型の要約がなく、既定値だけを記載している Props です。基になる Base UI の型を参照してください。',
    parts: 'パーツ',
    partsCaption: (name) => `${name} のパーツ`,
    accessibility: 'アクセシビリティ',
    avoid: '避けること',
    quality: '品質要件',
    qualityLink:
      'このコンポーネント固有の要件です。全コンポーネント共通の要件は[共通の品質要件](/components/quality)を参照してください。',
    states: '検証する状態',
    verification: {
      automated: '自動テスト',
      browser: '実ブラウザー検証',
      manual: '手動確認',
    },
    required: '必須',
    none: 'なし',
  },
  en: {
    group: 'Components',
    indexTitle: 'Components',
    indexDescription:
      'Components grouped by purpose, and what each component page covers.',
    indexIntro:
      'Each component page has an interactive preview, the import statement, usage, props, parts, accessibility notes and quality requirements. See [Installation](/en/getting-started) to install the package.',
    qualityTitle: 'Shared quality requirements',
    qualityDescription: 'Quality requirements that apply to every component.',
    qualityIntro:
      'These requirements apply to every component. Each component page lists the requirements specific to that component.',
    verificationIntro:
      'Requirements are grouped by how they are verified. Automated checks run in jsdom with axe, browser checks run in real browsers through Playwright, and manual checks cover assistive technology and visual review. Manual checks stay unverified until results are recorded.',
    preview: 'Preview',
    import: 'Import',
    importNote:
      'Import `@utakata-ui/react/styles.css` once in the application entry. See [Installation](/en/getting-started) for details.',
    usage: 'Usage',
    props: 'Props',
    propsCaption: (name) => `${name} props`,
    propsNote:
      'A "—" type means the manifest records only the default value; see the underlying Base UI type.',
    parts: 'Parts',
    partsCaption: (name) => `${name} parts`,
    accessibility: 'Accessibility',
    avoid: 'Avoid',
    quality: 'Quality requirements',
    qualityLink:
      'These requirements are specific to this component. See [Shared quality requirements](/en/components/quality) for the requirements every component follows.',
    states: 'Verified states',
    verification: {
      automated: 'Automated checks',
      browser: 'Browser checks',
      manual: 'Manual checks',
    },
    required: 'Required',
    none: 'None',
  },
};

async function readJson(url) {
  try {
    return JSON.parse(await readFile(url, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

async function loadDictionaries() {
  const dictionaries = {
    shared: await readJson(new URL('i18n/ja/shared.json', docsRoot)),
  };
  for (const name of Object.keys(manifest.components)) {
    dictionaries[name] = await readJson(
      new URL(`i18n/ja/components/${name}.json`, docsRoot),
    );
  }
  return dictionaries;
}

/** Fails when a Japanese translation is missing or its English source changed. */
export function auditTranslations(dictionaries) {
  const problems = [];
  const report = (scope, expected, dictionary) => {
    const { missing, stale } = auditDictionary(expected, dictionary);
    for (const source of missing)
      problems.push(
        `${scope}: missing ${sourceKey(source)} ${JSON.stringify(source)}`,
      );
    for (const key of stale) problems.push(`${scope}: stale ${key}`);
  };
  report('shared', sharedTranslatableStrings(manifest), dictionaries.shared);
  for (const [name, component] of Object.entries(manifest.components)) {
    report(name, translatableStrings(component), dictionaries[name] ?? {});
  }
  return problems;
}

/** Escapes MDX syntax outside `code` spans so prose renders as text. */
function prose(value) {
  return value
    .split(/(`[^`]+`)/)
    .map((segment) =>
      segment.startsWith('`')
        ? segment
        : segment.replace(/[{}<>]/g, (character) => `\\${character}`),
    )
    .join('');
}

function frontmatterString(value) {
  return JSON.stringify(value.replaceAll('`', ''));
}

function attribute(value) {
  return `{${JSON.stringify(value)}}`;
}

async function formatExamples() {
  {
    const directory = await mkdtemp(join(tmpdir(), 'utakata-examples-'));
    const names = Object.keys(manifest.components);
    for (const name of names) {
      await writeFile(
        join(directory, `${name}.tsx`),
        `${manifest.components[name].example};\n`,
      );
    }
    execFileSync(
      fileURLToPath(new URL('node_modules/.bin/biome', repoRoot)),
      [
        'format',
        '--write',
        `--config-path=${fileURLToPath(new URL('biome.json', repoRoot))}`,
        directory,
      ],
      { stdio: 'ignore' },
    );
    const formatted = {};
    for (const name of names) {
      formatted[name] = (await readFile(join(directory, `${name}.tsx`), 'utf8'))
        .trim()
        .replace(/;$/, '');
    }
    await rm(directory, { recursive: true, force: true });
    return formatted;
  }
}

function localizer(locale, dictionary) {
  return (value) => {
    if (locale === 'en' || !isProse(value)) return value;
    return dictionary[sourceKey(value)];
  };
}

function typeCell(value, localize) {
  if (value === undefined) return '—';
  return isProse(value) ? localize(value) : `\`${value}\``;
}

function defaultCell(value, localize, t) {
  if (value === undefined || value === 'none') return t.none;
  if (value === 'required') return t.required;
  if (typeof value === 'string')
    return isProse(value) ? localize(value) : `\`${JSON.stringify(value)}\``;
  return `\`${JSON.stringify(value)}\``;
}

function ruleItems(rules, localize) {
  return rules.map((rule) => ({
    id: rule.id,
    severity: rule.severity,
    requirement: localize(rule.requirement),
    remediation: localize(rule.remediation),
    ...(rule.applicability
      ? { applicability: localize(rule.applicability) }
      : {}),
    ...(rule.residual ? { residual: localize(rule.residual) } : {}),
    ...(rule.criteria ? { criteria: [...rule.criteria] } : {}),
  }));
}

function qualitySections(rules, locale, localize, level) {
  const t = text[locale];
  return ['automated', 'browser', 'manual']
    .map((verification) => {
      const group = rules.filter((rule) => rule.verification === verification);
      if (!group.length) return '';
      return `${'#'.repeat(level)} ${t.verification[verification]} [#${verification}]

<QualityRules locale="${locale}" rules=${attribute(ruleItems(group, localize))} />
`;
    })
    .filter(Boolean)
    .join('\n');
}

function componentPage({
  name,
  component,
  locale,
  localize,
  exportNames,
  example,
}) {
  const t = text[locale];
  const slug = slugOf(name);
  const description = localize(component.description);
  const props = propRows(component).map((row) => ({
    name: row.name,
    type: typeCell(row.type, localize),
    default: defaultCell(row.default, localize, t),
  }));
  const parts = partRows(name, component).map((row) => ({
    name: row.name,
    props: row.props
      ? isProse(row.props)
        ? localize(row.props)
        : `\`${row.props}\``
      : '—',
  }));
  const sections = [
    `---
title: ${name}
description: ${frontmatterString(description)}
---

## ${t.preview} [#preview]

<Component path="${slug}" />

## ${t.import} [#import]

\`\`\`tsx
import { ${exportNames.join(', ')} } from '@utakata-ui/react';
\`\`\`

${t.importNote}

## ${t.usage} [#usage]

${prose(localize(component.composition))}

\`\`\`tsx
${example}
\`\`\`
`,
  ];
  if (props.length) {
    sections.push(`## ${t.props} [#props]

<PropTable id="${slug}-props" locale="${locale}" caption=${attribute(t.propsCaption(name))} rows=${attribute(props)} />
${props.some((row) => row.type === '—') ? `\n${t.propsNote}\n` : ''}`);
  }
  if (parts.length) {
    sections.push(`## ${t.parts} [#parts]

<PartTable id="${slug}-parts" locale="${locale}" caption=${attribute(t.partsCaption(name))} rows=${attribute(parts)} />
`);
  }
  sections.push(`## ${t.accessibility} [#accessibility]

${prose(localize(component.accessibility))}
`);
  if (component.avoid?.length) {
    sections.push(`### ${t.avoid} [#avoid]

${component.avoid.map((item) => `- ${prose(localize(item))}`).join('\n')}
`);
  }
  sections.push(`## ${t.quality} [#quality]

${t.qualityLink}

**${t.states}**

<BadgeList label=${attribute(t.states)} items=${attribute([...component.verificationStates])} />

${qualitySections(component.qualityRules, locale, localize, 3)}`);
  return sections.join('\n');
}

function indexPage(locale, dictionaries) {
  const t = text[locale];
  const prefix = locale === 'ja' ? '' : `/${locale}`;
  const groups = categories.map((category) => {
    const items = category.components.map((name) => ({
      name,
      href: `${prefix}/components/${slugOf(name)}`,
      description: localizer(
        locale,
        dictionaries[name],
      )(manifest.components[name].description),
    }));
    return `## ${category.title[locale]} [#${category.slug}]

<ComponentGrid items=${attribute(items)} />
`;
  });
  return `---
title: ${t.indexTitle}
description: ${frontmatterString(t.indexDescription)}
---

${t.indexIntro}

${groups.join('\n')}`;
}

function qualityPage(locale, dictionaries) {
  const t = text[locale];
  return `---
title: ${t.qualityTitle}
description: ${frontmatterString(t.qualityDescription)}
---

${t.qualityIntro}

${t.verificationIntro}

${qualitySections(manifest.sharedQualityRules, locale, localizer(locale, dictionaries.shared), 2)}`;
}

function meta(fields) {
  return `import { defineMeta } from 'blume';

export default defineMeta(${JSON.stringify(fields, null, 2)});
`;
}

const handWritten = new Set(['preview.mdx']);

/** Removes previously generated entries and keeps hand-written pages. */
async function resetDirectory(directory) {
  await mkdir(directory, { recursive: true });
  for (const entry of await readdir(directory)) {
    if (!handWritten.has(entry)) {
      await rm(new URL(entry, directory), { recursive: true, force: true });
    }
  }
}

/**
 * theme.css layers Lism below Tailwind's base styles and the Utakata component
 * rules above them, so the library reset does not restyle Blume's chrome.
 */
async function writeSiteStyles() {
  const stylesUrl = new URL('packages/react/src/styles/styles.css', repoRoot);
  const styles = await readFile(stylesUrl, 'utf8');
  const lismImport = '@import "lism-css/main.css";\n';
  if (!styles.startsWith(lismImport)) {
    throw new Error(
      'styles.css no longer starts with the Lism import; update writeSiteStyles.',
    );
  }
  const react = createRequire(new URL('packages/react/package.json', repoRoot));
  const lism = await readFile(react.resolve('lism-css/main.css'), 'utf8');
  const generated = new URL('site/generated/', docsRoot);
  await mkdir(generated, { recursive: true });
  await writeFile(new URL('lism.css', generated), lism);
  await writeFile(
    new URL('utakata-components.css', generated),
    styles.slice(lismImport.length),
  );
}

async function generate() {
  const dictionaries = await loadDictionaries();
  const problems = auditTranslations(dictionaries);
  if (problems.length) {
    console.error(
      `Japanese reference translations are incomplete (${problems.length}). Update packages/docs/i18n/ja:\n${problems.join('\n')}`,
    );
    process.exit(1);
  }
  const uncategorized = Object.keys(manifest.components).filter(
    (name) =>
      !categories.some((category) => category.components.includes(name)),
  );
  if (uncategorized.length) {
    console.error(
      `Add these components to a docs category: ${uncategorized.join(', ')}`,
    );
    process.exit(1);
  }

  const exportNames = exportsByFile(
    await readFile(new URL('packages/react/src/index.ts', repoRoot), 'utf8'),
  );
  const examples = await formatExamples();

  // Output of the previous single-page generator.
  await rm(new URL('docs/components.md', docsRoot), { force: true });
  for (const locale of ['ja', 'en']) {
    const directory = new URL(
      locale === 'ja' ? 'docs/components/' : `docs/${locale}/components/`,
      docsRoot,
    );
    await resetDirectory(directory);
    await writeFile(
      new URL('index.mdx', directory),
      indexPage(locale, dictionaries),
    );
    await writeFile(
      new URL('quality.mdx', directory),
      qualityPage(locale, dictionaries),
    );
    await writeFile(
      new URL('meta.ts', directory),
      meta({
        title: text[locale].group,
        order: 2,
        pages: [
          'index',
          'preview',
          'quality',
          ...categories.map(({ slug }) => slug),
        ],
      }),
    );
    for (const category of categories) {
      const folder = new URL(`(${category.slug})/`, directory);
      await mkdir(folder, { recursive: true });
      await writeFile(
        new URL('meta.ts', folder),
        meta({
          title: category.title[locale],
          pages: category.components.map(slugOf),
        }),
      );
      for (const name of category.components) {
        const component = manifest.components[name];
        await writeFile(
          new URL(`${slugOf(name)}.mdx`, folder),
          componentPage({
            name,
            component,
            locale,
            localize: localizer(locale, dictionaries[name]),
            exportNames: exportNames.get(name) ?? [name],
            example: examples[name],
          }),
        );
      }
    }
  }

  await writeSiteStyles();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await generate();
}
