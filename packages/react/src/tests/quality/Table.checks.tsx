import { render, screen, within } from '@testing-library/react';
import { expect } from 'vitest';
import { Button } from '../../components/Button.js';
import { Table } from '../../components/Table.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

function InvoiceTable({ empty = false }: { empty?: boolean }) {
  return (
    <Table.Container aria-labelledby="invoices">
      <Table.Root>
        <Table.Caption id="invoices">Invoices</Table.Caption>
        <Table.Header>
          <Table.Row>
            <Table.Head scope="col">Number</Table.Head>
            <Table.Head scope="col">Amount</Table.Head>
            <Table.Head scope="col">Actions</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {empty ? (
            <Table.Row>
              <Table.Cell colSpan={3}>No invoices</Table.Cell>
            </Table.Row>
          ) : (
            <Table.Row>
              <Table.Head scope="row">INV-001</Table.Head>
              <Table.Cell data-align="end">1,000</Table.Cell>
              <Table.Cell>
                <a href="/invoices/1">View INV-001</a>{' '}
                <Button>Download INV-001</Button>
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.Head scope="row">Total</Table.Head>
            <Table.Cell colSpan={2}>1,000</Table.Cell>
          </Table.Row>
        </Table.Footer>
      </Table.Root>
    </Table.Container>
  );
}

export const tableChecks: Record<string, QualityCheck> = {
  'table.semantics': async () => {
    const { container } = render(<InvoiceTable />);
    const table = screen.getByRole('table', { name: 'Invoices' });
    expect(table.tagName).toBe('TABLE');
    expect(table.querySelector(':scope > caption')).toHaveTextContent(
      'Invoices',
    );
    expect(
      container.querySelectorAll('table > thead > tr > th[scope="col"]'),
    ).toHaveLength(3);
    expect(
      container.querySelectorAll('table > tbody > tr > th[scope="row"]'),
    ).toHaveLength(1);
    expect(container.querySelector('table > tfoot > tr > td')).not.toBeNull();
    expect(
      screen.getByRole('columnheader', { name: 'Amount' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('rowheader', { name: 'INV-001' }),
    ).toBeInTheDocument();
    expect((await audit(container)).violations).toEqual([]);
  },
  'table.scroll-region': async () => {
    const { container } = render(<InvoiceTable />);
    const region = screen.getByRole('region', { name: 'Invoices' });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region).toHaveClass('ui-table-container');
    region.focus();
    expect(region).toHaveFocus();
    expect(region.firstElementChild?.tagName).toBe('TABLE');
    expect(screen.getByRole('table')).not.toHaveAttribute('tabindex');
    expect((await audit(container)).violations).toEqual([]);
  },
  'table.cell-controls': async () => {
    const view = render(<InvoiceTable />);
    const row = screen.getByRole('row', { name: /INV-001/ });
    const link = within(row).getByRole('link', { name: 'View INV-001' });
    const button = within(row).getByRole('button', {
      name: 'Download INV-001',
    });
    // Normal Tab order: focusable without a positive tabindex.
    for (const control of [link, button]) expect(control.tabIndex).toBe(0);
    expect(link).toHaveAttribute('href', '/invoices/1');
    view.unmount();
    const { container } = render(<InvoiceTable empty />);
    expect(screen.getByRole('cell', { name: 'No invoices' })).toHaveAttribute(
      'colspan',
      '3',
    );
    expect((await audit(container)).violations).toEqual([]);
  },
};
