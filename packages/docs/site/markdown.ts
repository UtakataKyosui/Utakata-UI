import type { ComponentMarkdown } from 'blume';
import type { ComponentGridItem } from './ComponentGrid.js';
import type { PartRow } from './PartTable.js';
import type { PropRow } from './PropTable.js';
import { type Locale, strings } from './strings.js';

// Agent-facing Markdown for the static Utakata components in components.ts.

const cell = (value: string) => value.replaceAll('|', '\\|');

function table(header: string[], rows: string[][]) {
  return [
    `| ${header.join(' | ')} |`,
    `| ${header.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(cell).join(' | ')} |`),
  ].join('\n');
}

const locale = (value: unknown): Locale => (value === 'en' ? 'en' : 'ja');

const propTable: ComponentMarkdown = ({ props }) => {
  const t = strings[locale(props.locale)];
  const rows = props.rows as unknown as PropRow[];
  return `${props.caption}\n\n${table(
    [t.prop, t.type, t.default],
    rows.map((row) => [`\`${row.name}\``, row.type, row.default]),
  )}`;
};

const partTable: ComponentMarkdown = ({ props }) => {
  const t = strings[locale(props.locale)];
  const rows = props.rows as unknown as PartRow[];
  return `${props.caption}\n\n${table(
    [t.part, t.props],
    rows.map((row) => [`\`${row.name}\``, row.props]),
  )}`;
};

const componentGrid: ComponentMarkdown = ({ props }) =>
  (props.items as unknown as ComponentGridItem[])
    .map((item) => `- [${item.name}](${item.href}): ${item.description}`)
    .join('\n');

const note: ComponentMarkdown = ({ props, children }) =>
  `> **${props.title}**\n>\n${children
    .trim()
    .split('\n')
    .map((line) => (line ? `> ${line}` : '>'))
    .join('\n')}`;

export const markdownComponents = {
  ComponentGrid: componentGrid,
  Note: note,
  PartTable: partTable,
  PropTable: propTable,
};
