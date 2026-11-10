import DocsTable from './DocsTable.js';
import { type Locale, strings } from './strings.js';

export interface PropRow {
  name: string;
  /** Display text; `code` spans use backticks. */
  type: string;
  default: string;
}

export interface PropTableProps {
  id: string;
  caption: string;
  locale: Locale;
  rows: PropRow[];
}

export default function PropTable({ locale, rows, ...props }: PropTableProps) {
  const t = strings[locale];
  return (
    <DocsTable
      {...props}
      columns={[t.prop, t.type, t.default]}
      rows={rows.map((row) => ({
        name: row.name,
        cells: [row.type, row.default],
      }))}
    />
  );
}
