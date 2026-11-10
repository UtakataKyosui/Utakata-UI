// Pure helpers shared by the reference generator and its tests.
import { createHash } from 'node:crypto';

/** Sidebar categories for component pages, in reading order. */
export const categories = [
  {
    slug: 'actions',
    title: { ja: 'アクション', en: 'Actions' },
    components: [
      'Button',
      'ButtonGroup',
      'Toggle',
      'ToggleGroup',
      'DropdownMenu',
    ],
  },
  {
    slug: 'forms',
    title: { ja: 'フォーム', en: 'Forms' },
    components: [
      'Field',
      'Input',
      'InputGroup',
      'Textarea',
      'NativeSelect',
      'Select',
      'Checkbox',
      'RadioGroup',
      'Switch',
      'InputOTP',
      'Slider',
    ],
  },
  {
    slug: 'overlays',
    title: { ja: 'オーバーレイ', en: 'Overlays' },
    components: ['Dialog', 'AlertDialog', 'Popover', 'Tooltip', 'Toast'],
  },
  {
    slug: 'disclosure',
    title: { ja: '開閉・切り替え', en: 'Disclosure' },
    components: ['Collapsible', 'Accordion', 'Tabs'],
  },
  {
    slug: 'navigation',
    title: { ja: 'ナビゲーション', en: 'Navigation' },
    components: ['Breadcrumb', 'Pagination'],
  },
  {
    slug: 'feedback',
    title: { ja: '状態・フィードバック', en: 'Feedback' },
    components: ['Alert', 'Badge', 'Progress', 'Spinner', 'Skeleton'],
  },
  {
    slug: 'display',
    title: { ja: 'データ表示', en: 'Data display' },
    components: ['Card', 'Table', 'Avatar', 'Kbd', 'Separator'],
  },
];

/**
 * Manifest strings that read as prose. Pure type expressions such as
 * `solid | outline` or `(value: string) => void` stay untranslated.
 */
export function isProse(text) {
  return /[A-Za-z]{2,} [A-Za-z]{2,}/.test(text);
}

const proseFields = ['description', 'composition', 'accessibility'];
const ruleFields = ['requirement', 'remediation', 'applicability', 'residual'];

function ruleStrings(rule) {
  return ruleFields.map((field) => rule[field]).filter(Boolean);
}

/** Every manifest string of a component that needs a translation. */
export function translatableStrings(component) {
  const strings = proseFields.map((field) => component[field]);
  strings.push(...(component.avoid ?? []));
  for (const prop of Object.values(component.props ?? {})) {
    strings.push(prop.type);
    if (typeof prop.default === 'string') strings.push(prop.default);
  }
  strings.push(...Object.values(component.partProps ?? {}));
  strings.push(...Object.values(component.hooks ?? {}));
  for (const rule of component.qualityRules) strings.push(...ruleStrings(rule));
  return [...new Set(strings.filter((text) => text && isProse(text)))];
}

export function sharedTranslatableStrings(manifest) {
  return [...new Set(manifest.sharedQualityRules.flatMap(ruleStrings))].filter(
    isProse,
  );
}

/** Dictionary key of an English source string; changes when the source does. */
export function sourceKey(text) {
  return createHash('sha256').update(text).digest('hex').slice(0, 12);
}

/**
 * Compares a translation dictionary (source key -> Japanese) with the strings
 * the manifest currently contains. Stale keys belong to changed or removed
 * English sources.
 */
export function auditDictionary(expected, dictionary) {
  const missing = expected.filter((text) => {
    const translation = dictionary[sourceKey(text)];
    return typeof translation !== 'string' || !translation.trim();
  });
  const wanted = new Set(expected.map(sourceKey));
  const stale = Object.keys(dictionary).filter((key) => !wanted.has(key));
  return { missing, stale };
}

export function translate(dictionary, text) {
  return isProse(text) ? dictionary[sourceKey(text)] : text;
}

/** Value exports per component source file, parsed from the public index. */
export function exportsByFile(indexSource) {
  const result = new Map();
  for (const match of indexSource.matchAll(
    /export\s*\{([^}]*)\}\s*from\s*'\.\/components\/([A-Za-z]+)\.js'/g,
  )) {
    const names = match[1]
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
    result.set(match[2], [...(result.get(match[2]) ?? []), ...names]);
  }
  return result;
}

/** Props rows: declared props first, then defaults without a declared type. */
export function propRows(component) {
  const rows = Object.entries(component.props ?? {}).map(([name, prop]) => ({
    name,
    type: prop.type,
    ...(prop.default === undefined ? {} : { default: prop.default }),
  }));
  for (const [name, value] of Object.entries(component.defaults ?? {})) {
    if (!rows.some((row) => row.name === name)) {
      rows.push({ name, default: value });
    }
  }
  return rows;
}

export function partRows(name, component) {
  return (component.parts ?? []).map((part) => ({
    name: `${name}.${part}`,
    ...(component.partProps?.[part]
      ? { props: component.partProps[part] }
      : {}),
  }));
}

export function slugOf(name) {
  return name.toLowerCase();
}
