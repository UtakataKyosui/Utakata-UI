import { Table } from '@utakata-ui/react';
import RichText from './RichText.js';

export interface DocsTableProps {
  id: string;
  caption: string;
  columns: string[];
  /** The first cell is the row header; the rest use backticks for `code`. */
  rows: { name: string; cells: string[] }[];
}

/** Captioned reference table shared by the generated component pages. */
export default function DocsTable({
  id,
  caption,
  columns,
  rows,
}: DocsTableProps) {
  return (
    <div className="not-prose utakata-docs-block">
      <Table.Container aria-labelledby={id}>
        <Table.Root>
          <Table.Caption id={id}>{caption}</Table.Caption>
          <Table.Header>
            <Table.Row>
              {columns.map((column) => (
                <Table.Head key={column} scope="col">
                  {column}
                </Table.Head>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((row) => (
              <Table.Row key={row.name}>
                <Table.Head scope="row">
                  <code>{row.name}</code>
                </Table.Head>
                {row.cells.map((cell, index) => (
                  <Table.Cell key={columns[index + 1]}>
                    <RichText text={cell} />
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.Container>
    </div>
  );
}
