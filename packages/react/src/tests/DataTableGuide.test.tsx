import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import JaExample from '../../../docs/examples/data-table.js';
import DataTableExample, {
  type InvoiceQuery,
  InvoiceTable,
  queryInvoices,
} from '../../../docs/examples/en/data-table.js';
import { audit } from './audit.js';

afterEach(cleanup);

const base: InvoiceQuery = { query: '', sort: null, page: 1, pageSize: 4 };

function bodyRowIds() {
  return within(screen.getAllByRole('rowgroup')[1] as HTMLElement)
    .queryAllByRole('rowheader')
    .map((cell) => cell.textContent);
}

async function expectNoViolations(container: HTMLElement) {
  expect((await audit(container)).violations).toEqual([]);
}

describe('Data Table composition guide', () => {
  it('renders the server result as received and never sorts or filters it', () => {
    render(
      <InvoiceTable
        result={{
          rows: [
            { id: 'Z', customer: 'Zed', status: 'Paid', amount: 1 },
            { id: 'A', customer: 'Ann', status: 'Paid', amount: 2 },
          ],
          total: 40,
          page: 2,
        }}
        query={{ ...base, query: 'ignored', page: 2, pageSize: 2 }}
        visibleColumns={['customer', 'status', 'amount']}
        selectedIds={[]}
        onSearch={vi.fn()}
        onSort={vi.fn()}
        onPage={vi.fn()}
        onToggleColumn={vi.fn()}
        onToggleRow={vi.fn()}
        onTogglePage={vi.fn()}
      />,
    );
    expect(bodyRowIds()).toEqual(['Z', 'A']);
    expect(screen.getByText('Showing 3-4 of 40 (page 2 of 20)')).toBeVisible();
  });

  it('reports intent to the caller instead of mutating rows', () => {
    const onSort = vi.fn();
    const onPage = vi.fn();
    const onSearch = vi.fn();
    render(
      <InvoiceTable
        result={queryInvoices(base)}
        query={base}
        visibleColumns={['customer', 'status', 'amount']}
        selectedIds={[]}
        onSearch={onSearch}
        onSort={onSort}
        onPage={onPage}
        onToggleColumn={vi.fn()}
        onToggleRow={vi.fn()}
        onTogglePage={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Amount' }));
    fireEvent.click(screen.getByRole('link', { name: '2' }));
    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search invoices' }),
      {
        target: { value: 'tokyo' },
      },
    );
    expect(onSort).toHaveBeenCalledWith('amount');
    expect(onPage).toHaveBeenCalledWith(2);
    expect(onSearch).toHaveBeenCalledWith('tokyo');
    expect(bodyRowIds()).toEqual(['INV-001', 'INV-002', 'INV-003', 'INV-004']);
  });

  it('shows an empty result with a status message and a full-width cell', () => {
    render(<DataTableExample />);
    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search invoices' }),
      {
        target: { value: 'no-such-customer' },
      },
    );
    expect(screen.getByRole('table', { name: 'Invoices' })).toBeVisible();
    const status = screen
      .getAllByRole('status')
      .map((element) => element.textContent);
    expect(status).toContain('No invoices match.');
    const cell = screen.getByRole('cell', { name: 'No invoices match.' });
    // selection column + id + 3 optional columns
    expect(cell).toHaveAttribute('colspan', '5');
    expect(
      screen.getByRole('checkbox', {
        name: 'Select all invoices on this page',
      }),
    ).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('link', { name: '1' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    // Previous and Next are both disabled with a single empty page.
    expect(screen.queryAllByRole('link', { name: /Next|次/ })).toSatisfy(
      (links: HTMLElement[]) =>
        links.every((link) => link.getAttribute('aria-disabled') === 'true'),
    );
  });

  it('keeps the empty-state cell width in step with visible columns', () => {
    render(<DataTableExample />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Status' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Amount' }));
    expect(
      screen.queryByRole('columnheader', { name: /Status/ }),
    ).not.toBeInTheDocument();
    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search invoices' }),
      {
        target: { value: 'zzz' },
      },
    );
    expect(
      screen.getByRole('cell', { name: 'No invoices match.' }),
    ).toHaveAttribute('colspan', '3');
  });

  it('exposes aria-sort only on the sorted column and cycles it', () => {
    render(<DataTableExample />);
    const sorted = () =>
      screen
        .getAllByRole('columnheader')
        .filter((header) => header.hasAttribute('aria-sort'))
        .map((header) => [
          within(header).getByRole('button').textContent?.replace(/[⇅▲▼]/g, ''),
          header.getAttribute('aria-sort'),
        ]);
    expect(sorted()).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: 'Amount' }));
    expect(sorted()).toEqual([['Amount', 'ascending']]);
    expect(bodyRowIds()[0]).toBe('INV-001');
    fireEvent.click(screen.getByRole('button', { name: 'Amount' }));
    expect(sorted()).toEqual([['Amount', 'descending']]);
    expect(bodyRowIds()[0]).toBe('INV-002');
    fireEvent.click(screen.getByRole('button', { name: 'Customer' }));
    expect(sorted()).toEqual([['Customer', 'ascending']]);
    fireEvent.click(screen.getByRole('button', { name: 'Customer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Customer' }));
    expect(sorted()).toEqual([]);
  });

  it('keeps selection, sort and visible columns after a page change', () => {
    render(<DataTableExample />);
    fireEvent.click(screen.getByRole('button', { name: 'Amount' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Status' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select INV-001' }));
    expect(screen.getByText('1 selected')).toBeVisible();
    const firstPage = bodyRowIds();

    fireEvent.click(screen.getByRole('link', { name: '2' }));
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: '1' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(bodyRowIds()).not.toEqual(firstPage);
    // The sort, the hidden column and the selection count survive paging.
    expect(
      screen.getByRole('columnheader', { name: /Amount/ }),
    ).toHaveAttribute('aria-sort', 'ascending');
    expect(
      screen.queryByRole('columnheader', { name: /Status/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('1 selected')).toBeVisible();
    expect(screen.getByText(/page 2 of 3/)).toBeVisible();

    // Selecting on this page adds to the count; the first page keeps its row.
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'Select all invoices on this page',
      }),
    );
    expect(screen.getByText('5 selected')).toBeVisible();
    fireEvent.click(screen.getByRole('link', { name: '1' }));
    expect(
      screen.getByRole('checkbox', { name: 'Select INV-001' }),
    ).toBeChecked();
  });

  it('shows the select-all checkbox as mixed for a partial page selection', () => {
    render(<DataTableExample />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select INV-001' }));
    expect(
      screen.getByRole('checkbox', {
        name: 'Select all invoices on this page',
      }),
    ).toHaveAttribute('aria-checked', 'mixed');
  });

  it('returns to page 1 when searching or sorting changes the result set', () => {
    render(<DataTableExample />);
    fireEvent.click(screen.getByRole('link', { name: '3' }));
    expect(screen.getByRole('link', { name: '3' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Number' }));
    expect(screen.getByRole('link', { name: '1' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('clamps an out-of-range page on the server side', () => {
    expect(queryInvoices({ ...base, page: 99 }).page).toBe(3);
    expect(queryInvoices({ ...base, query: 'none' })).toEqual({
      rows: [],
      total: 0,
      page: 1,
    });
  });

  it('passes axe in the default, sorted and empty states', async () => {
    const view = render(<DataTableExample />);
    await expectNoViolations(view.container);
    fireEvent.click(screen.getByRole('button', { name: 'Amount' }));
    await expectNoViolations(view.container);
    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search invoices' }),
      {
        target: { value: 'zzz' },
      },
    );
    await expectNoViolations(view.container);
  });

  it('keeps the Japanese example renderable', async () => {
    const view = render(<JaExample />);
    expect(screen.getByRole('table', { name: '請求一覧' })).toBeVisible();
    await expectNoViolations(view.container);
  });
});
