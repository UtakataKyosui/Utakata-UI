import { Button, Table } from '@utakata-ui/react';
import { useId } from 'react';

const invoices = [
  { id: 'INV-001', customer: '株式会社サンプル', amount: '1,000円' },
  {
    id: 'INV-002',
    customer: '長い名前の取引先株式会社 東京本社',
    amount: '128,500円',
  },
];

export default function TableExample() {
  const captionId = useId();
  return (
    <Table.Container aria-labelledby={captionId}>
      <Table.Root>
        <Table.Caption id={captionId}>請求一覧</Table.Caption>
        <Table.Header>
          <Table.Row>
            <Table.Head scope="col">番号</Table.Head>
            <Table.Head scope="col">取引先</Table.Head>
            <Table.Head scope="col" data-align="end">
              金額
            </Table.Head>
            <Table.Head scope="col">操作</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {invoices.map((invoice) => (
            <Table.Row key={invoice.id}>
              <Table.Head scope="row">{invoice.id}</Table.Head>
              <Table.Cell>{invoice.customer}</Table.Cell>
              <Table.Cell data-align="end">{invoice.amount}</Table.Cell>
              <Table.Cell>
                <a href={`#${invoice.id}`}>{invoice.id}を表示</a>{' '}
                <Button size="sm" variant="outline">
                  {invoice.id}をダウンロード
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.Head scope="row" colSpan={2}>
              合計
            </Table.Head>
            <Table.Cell data-align="end">129,500円</Table.Cell>
            <Table.Cell />
          </Table.Row>
        </Table.Footer>
      </Table.Root>
    </Table.Container>
  );
}
