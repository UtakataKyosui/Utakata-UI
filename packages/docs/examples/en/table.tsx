import { Button, Table } from '@utakata-ui/react';
import { useId } from 'react';

const invoices = [
  { id: 'INV-001', customer: 'Sample Inc.', amount: '¥1,000' },
  {
    id: 'INV-002',
    customer: 'A Customer With a Long Name Inc., Tokyo Headquarters',
    amount: '¥128,500',
  },
];

export default function TableExample() {
  const captionId = useId();
  return (
    <Table.Container aria-labelledby={captionId}>
      <Table.Root>
        <Table.Caption id={captionId}>Invoices</Table.Caption>
        <Table.Header>
          <Table.Row>
            <Table.Head scope="col">Number</Table.Head>
            <Table.Head scope="col">Customer</Table.Head>
            <Table.Head scope="col" data-align="end">
              Amount
            </Table.Head>
            <Table.Head scope="col">Actions</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {invoices.map((invoice) => (
            <Table.Row key={invoice.id}>
              <Table.Head scope="row">{invoice.id}</Table.Head>
              <Table.Cell>{invoice.customer}</Table.Cell>
              <Table.Cell data-align="end">{invoice.amount}</Table.Cell>
              <Table.Cell>
                <a href={`#${invoice.id}`}>View {invoice.id}</a>{' '}
                <Button size="sm" variant="outline">
                  Download {invoice.id}
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.Head scope="row" colSpan={2}>
              Total
            </Table.Head>
            <Table.Cell data-align="end">¥129,500</Table.Cell>
            <Table.Cell />
          </Table.Row>
        </Table.Footer>
      </Table.Root>
    </Table.Container>
  );
}
