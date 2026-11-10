import DocsTable from './DocsTable.js';
import { type Locale, strings } from './strings.js';

export interface PartRow {
  name: string;
  /** Display text; `code` spans use backticks. */
  props: string;
}

export interface PartTableProps {
  id: string;
  caption: string;
  locale: Locale;
  rows: PartRow[];
}

export default function PartTable({ locale, rows, ...props }: PartTableProps) {
  const t = strings[locale];
  return (
    <DocsTable
      {...props}
      columns={[t.part, t.props]}
      rows={rows.map((row) => ({ name: row.name, cells: [row.props] }))}
    />
  );
}
