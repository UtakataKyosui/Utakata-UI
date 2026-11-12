import {
  Button,
  Checkbox,
  Field,
  Input,
  Pagination,
  Table,
} from '@utakata-ui/react';
import { useId, useState } from 'react';

export type ColumnKey = 'customer' | 'status' | 'amount';
export type SortKey = 'id' | ColumnKey;
export type SortState = {
  key: SortKey;
  direction: 'ascending' | 'descending';
} | null;

export type Invoice = {
  id: string;
  customer: string;
  status: string;
  amount: number;
};

/** Conditions sent to the server. The view does not own them; the caller does. */
export type InvoiceQuery = {
  query: string;
  sort: SortState;
  page: number;
  pageSize: number;
};

/** The server response. `page` is the page actually returned (out-of-range requests are clamped). */
export type InvoicePage = { rows: Invoice[]; total: number; page: number };

const columns: { key: SortKey; label: string; align?: 'end' }[] = [
  { key: 'id', label: 'Number' },
  { key: 'customer', label: 'Customer' },
  { key: 'status', label: 'Status' },
  { key: 'amount', label: 'Amount', align: 'end' },
];

const invoices: Invoice[] = [
  { id: 'INV-001', customer: 'Sample Inc.', status: 'Paid', amount: 1000 },
  {
    id: 'INV-002',
    customer: 'Tokyo Trading',
    status: 'Unpaid',
    amount: 128500,
  },
  {
    id: 'INV-003',
    customer: 'Osaka Industrial',
    status: 'Overdue',
    amount: 54000,
  },
  { id: 'INV-004', customer: 'Sapporo Foods', status: 'Paid', amount: 8800 },
  {
    id: 'INV-005',
    customer: 'Fukuoka Transport',
    status: 'Unpaid',
    amount: 23100,
  },
  { id: 'INV-006', customer: 'Sample Inc.', status: 'Unpaid', amount: 4200 },
  { id: 'INV-007', customer: 'Nagoya Electric', status: 'Paid', amount: 77000 },
  { id: 'INV-008', customer: 'Sendai Books', status: 'Overdue', amount: 3300 },
  { id: 'INV-009', customer: 'Kyoto Textiles', status: 'Paid', amount: 15400 },
  { id: 'INV-010', customer: 'Kobe Shipping', status: 'Unpaid', amount: 99000 },
  { id: 'INV-011', customer: 'Hiroshima Steel', status: 'Paid', amount: 61250 },
];

/**
 * Stand-in for the API or database in a real app. Search, sorting, counting
 * and page slicing all happen here; Table only renders the result.
 */
export function queryInvoices({
  query,
  sort,
  page,
  pageSize,
}: InvoiceQuery): InvoicePage {
  const needle = query.trim().toLowerCase();
  const matched = invoices.filter((invoice) =>
    `${invoice.id} ${invoice.customer}`.toLowerCase().includes(needle),
  );
  if (sort) {
    const factor = sort.direction === 'ascending' ? 1 : -1;
    matched.sort((a, b) => {
      const left = a[sort.key];
      const right = b[sort.key];
      return (
        factor *
        (typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left).localeCompare(String(right), 'en'))
      );
    });
  }
  const pageCount = Math.max(1, Math.ceil(matched.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  return {
    rows: matched.slice((current - 1) * pageSize, current * pageSize),
    total: matched.length,
    page: current,
  };
}

export type InvoiceTableProps = {
  result: InvoicePage;
  query: InvoiceQuery;
  visibleColumns: ColumnKey[];
  selectedIds: string[];
  onSearch: (query: string) => void;
  onSort: (key: SortKey) => void;
  onPage: (page: number) => void;
  onToggleColumn: (key: ColumnKey, visible: boolean) => void;
  onToggleRow: (id: string, selected: boolean) => void;
  onTogglePage: (selected: boolean) => void;
};

const inline = { display: 'flex', alignItems: 'center', gap: '0.5rem' };
const sortMark = { none: '⇅', ascending: '▲', descending: '▼' } as const;

/**
 * The stateless view. It renders the rows it receives as they are and never
 * sorts or filters them.
 */
export function InvoiceTable({
  result,
  query,
  visibleColumns,
  selectedIds,
  onSearch,
  onSort,
  onPage,
  onToggleColumn,
  onToggleRow,
  onTogglePage,
}: InvoiceTableProps) {
  const captionId = useId();
  const shown = columns.filter(
    (column) =>
      column.key === 'id' || visibleColumns.includes(column.key as ColumnKey),
  );
  const pageCount = Math.max(1, Math.ceil(result.total / query.pageSize));
  const from = (result.page - 1) * query.pageSize + 1;
  const selectedOnPage = result.rows.filter((row) =>
    selectedIds.includes(row.id),
  ).length;
  const allSelected =
    result.rows.length > 0 && selectedOnPage === result.rows.length;

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <Field.Root name="query" style={{ maxWidth: '24rem' }}>
        <Field.Label>Search invoices</Field.Label>
        <Input
          type="search"
          value={query.query}
          onChange={(event) => onSearch(event.target.value)}
        />
        <Field.Description>
          Filter by number or customer name.
        </Field.Description>
      </Field.Root>
      <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
        <legend>Visible columns</legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {columns
            .filter((column) => column.key !== 'id')
            .map((column) => (
              <label key={column.key} style={inline}>
                <Checkbox.Root
                  checked={visibleColumns.includes(column.key as ColumnKey)}
                  onCheckedChange={(checked) =>
                    onToggleColumn(column.key as ColumnKey, checked)
                  }
                >
                  <Checkbox.Indicator />
                </Checkbox.Root>
                {column.label}
              </label>
            ))}
        </div>
      </fieldset>
      <p role="status" style={{ margin: 0 }}>
        {result.total === 0
          ? 'No invoices match.'
          : `Showing ${from}-${from + result.rows.length - 1} of ${result.total} (page ${result.page} of ${pageCount})`}
      </p>
      <p role="status" style={{ margin: 0 }}>
        {selectedIds.length} selected
      </p>
      <Table.Container aria-labelledby={captionId}>
        <Table.Root>
          <Table.Caption id={captionId}>Invoices</Table.Caption>
          <Table.Header>
            <Table.Row>
              <Table.Head scope="col">
                <Checkbox.Root
                  aria-label="Select all invoices on this page"
                  checked={allSelected}
                  indeterminate={selectedOnPage > 0 && !allSelected}
                  disabled={result.rows.length === 0}
                  onCheckedChange={onTogglePage}
                >
                  <Checkbox.Indicator />
                </Checkbox.Root>
              </Table.Head>
              {shown.map((column) => {
                const direction =
                  query.sort?.key === column.key
                    ? query.sort.direction
                    : undefined;
                return (
                  <Table.Head
                    key={column.key}
                    scope="col"
                    aria-sort={direction}
                    data-align={column.align}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSort(column.key)}
                    >
                      {column.label}
                      <span aria-hidden="true">
                        {sortMark[direction ?? 'none']}
                      </span>
                    </Button>
                  </Table.Head>
                );
              })}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {result.rows.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={shown.length + 1}>
                  No invoices match.
                </Table.Cell>
              </Table.Row>
            ) : (
              result.rows.map((invoice) => (
                <Table.Row key={invoice.id}>
                  <Table.Cell>
                    <Checkbox.Root
                      aria-label={`Select ${invoice.id}`}
                      checked={selectedIds.includes(invoice.id)}
                      onCheckedChange={(checked) =>
                        onToggleRow(invoice.id, checked)
                      }
                    >
                      <Checkbox.Indicator />
                    </Checkbox.Root>
                  </Table.Cell>
                  {shown.map((column) =>
                    column.key === 'id' ? (
                      <Table.Head key={column.key} scope="row">
                        {invoice.id}
                      </Table.Head>
                    ) : (
                      <Table.Cell key={column.key} data-align={column.align}>
                        {column.key === 'amount'
                          ? `${invoice.amount.toLocaleString('en-US')} JPY`
                          : invoice[column.key]}
                      </Table.Cell>
                    ),
                  )}
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      </Table.Container>
      <Pagination.Root aria-label="Invoice pages">
        <Pagination.List>
          <Pagination.Item>
            {result.page > 1 ? (
              <Pagination.Previous
                href={`?page=${result.page - 1}`}
                onClick={(event) => {
                  event.preventDefault();
                  onPage(result.page - 1);
                }}
              />
            ) : (
              <Pagination.Previous disabled />
            )}
          </Pagination.Item>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map(
            (page) => (
              <Pagination.Item key={page}>
                <Pagination.Link
                  href={`?page=${page}`}
                  active={page === result.page}
                  onClick={(event) => {
                    event.preventDefault();
                    onPage(page);
                  }}
                >
                  {page}
                </Pagination.Link>
              </Pagination.Item>
            ),
          )}
          <Pagination.Item>
            {result.page < pageCount ? (
              <Pagination.Next
                href={`?page=${result.page + 1}`}
                onClick={(event) => {
                  event.preventDefault();
                  onPage(result.page + 1);
                }}
              />
            ) : (
              <Pagination.Next disabled />
            )}
          </Pagination.Item>
        </Pagination.List>
      </Pagination.Root>
    </div>
  );
}

/** Owns the conditions, column visibility and selection. In a real app these can live in the URL or server state. */
export default function DataTableExample() {
  const [query, setQuery] = useState<InvoiceQuery>({
    query: '',
    sort: null,
    page: 1,
    pageSize: 4,
  });
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>([
    'customer',
    'status',
    'amount',
  ]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const result = queryInvoices(query);

  return (
    <InvoiceTable
      result={result}
      query={{ ...query, page: result.page }}
      visibleColumns={visibleColumns}
      selectedIds={selectedIds}
      // Search and sorting return to page 1. Selection is kept by ID across pages.
      onSearch={(text) => setQuery({ ...query, query: text, page: 1 })}
      onSort={(key) =>
        setQuery({
          ...query,
          page: 1,
          sort:
            query.sort?.key !== key
              ? { key, direction: 'ascending' }
              : query.sort.direction === 'ascending'
                ? { key, direction: 'descending' }
                : null,
        })
      }
      onPage={(page) => setQuery({ ...query, page })}
      onToggleColumn={(key, visible) =>
        setVisibleColumns(
          visible
            ? [...visibleColumns, key]
            : visibleColumns.filter((column) => column !== key),
        )
      }
      onToggleRow={(id, selected) =>
        setSelectedIds(
          selected
            ? [...selectedIds, id]
            : selectedIds.filter((value) => value !== id),
        )
      }
      onTogglePage={(selected) => {
        const ids = result.rows.map((row) => row.id);
        setSelectedIds(
          selected
            ? [...new Set([...selectedIds, ...ids])]
            : selectedIds.filter((id) => !ids.includes(id)),
        );
      }}
    />
  );
}
