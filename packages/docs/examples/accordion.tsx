import { Accordion } from '@utakata-ui/react';

const questions = [
  {
    value: 'shipping',
    title: '配送について',
    body: '通常3営業日で発送します。',
  },
  {
    value: 'returns',
    title: '返品について',
    body: '到着から14日以内であれば返品できます。',
  },
  {
    value: 'payment',
    title: '支払い方法について',
    body: 'クレジットカードと銀行振込に対応しています。',
  },
];

export default function AccordionExample() {
  return (
    <Accordion.Root defaultValue={['shipping']}>
      {questions.map(({ value, title, body }) => (
        <Accordion.Item key={value} value={value}>
          <Accordion.Header level={3}>
            <Accordion.Trigger>{title}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>{body}</Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
