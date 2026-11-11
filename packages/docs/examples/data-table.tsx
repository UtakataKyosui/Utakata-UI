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

/** サーバーへ渡す条件。表示側は持たず、値は呼び出し側が保持する。 */
export type InvoiceQuery = {
  query: string;
  sort: SortState;
  page: number;
  pageSize: number;
};

/** サーバーの応答。page は実際に返したページ（範囲外の要求は補正される）。 */
export type InvoicePage = { rows: Invoice[]; total: number; page: number };

const columns: { key: SortKey; label: string; align?: 'end' }[] = [
  { key: 'id', label: '番号' },
  { key: 'customer', label: '取引先' },
  { key: 'status', label: '状態' },
  { key: 'amount', label: '金額', align: 'end' },
];

const invoices: Invoice[] = [
  {
    id: 'INV-001',
    customer: '株式会社サンプル',
    status: '支払済',
    amount: 1000,
  },
  { id: 'INV-002', customer: '東京商事', status: '未払い', amount: 128500 },
  { id: 'INV-003', customer: '大阪工業', status: '期限超過', amount: 54000 },
  { id: 'INV-004', customer: '札幌食品', status: '支払済', amount: 8800 },
  { id: 'INV-005', customer: '福岡運輸', status: '未払い', amount: 23100 },
  {
    id: 'INV-006',
    customer: '株式会社サンプル',
    status: '未払い',
    amount: 4200,
  },
  { id: 'INV-007', customer: '名古屋電機', status: '支払済', amount: 77000 },
  { id: 'INV-008', customer: '仙台書店', status: '期限超過', amount: 3300 },
  { id: 'INV-009', customer: '京都染織', status: '支払済', amount: 15400 },
  { id: 'INV-010', customer: '神戸海運', status: '未払い', amount: 99000 },
  { id: 'INV-011', customer: '広島製鋼', status: '支払済', amount: 61250 },
];

/**
 * 実際のアプリではAPIやDBが担う処理の代わりです。検索・並べ替え・件数・
 * ページ切り出しはすべてここで行い、Table は結果を描画するだけです。
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
          : String(left).localeCompare(String(right), 'ja'))
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
 * 状態を持たない表示部分です。受け取った rows を並べ替えず、そのまま描画します。
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
        <Field.Label>請求を検索</Field.Label>
        <Input
          type="search"
          value={query.query}
          onChange={(event) => onSearch(event.target.value)}
        />
        <Field.Description>
          番号または取引先名で絞り込みます。
        </Field.Description>
      </Field.Root>
      <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
        <legend>表示する列</legend>
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
          ? '該当する請求がありません。'
          : `${result.total}件中 ${from}〜${from + result.rows.length - 1}件を表示（${result.page}/${pageCount}ページ）`}
      </p>
      <p role="status" style={{ margin: 0 }}>
        {selectedIds.length}件を選択中
      </p>
      <Table.Container aria-labelledby={captionId}>
        <Table.Root>
          <Table.Caption id={captionId}>請求一覧</Table.Caption>
          <Table.Header>
            <Table.Row>
              <Table.Head scope="col">
                <Checkbox.Root
                  aria-label="このページの請求をすべて選択"
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
                  該当する請求がありません。
                </Table.Cell>
              </Table.Row>
            ) : (
              result.rows.map((invoice) => (
                <Table.Row key={invoice.id}>
                  <Table.Cell>
                    <Checkbox.Root
                      aria-label={`${invoice.id}を選択`}
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
                          ? `${invoice.amount.toLocaleString('ja-JP')}円`
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
      <Pagination.Root aria-label="請求一覧のページ">
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

/** 条件・列表示・選択をまとめて持つ例です。実際はURLやサーバー状態に置き換えられます。 */
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
      // 検索・並べ替えでは1ページ目に戻す。選択はIDで保持し、ページをまたいで残す。
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
