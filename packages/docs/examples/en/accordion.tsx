import { Accordion } from '@utakata-ui/react';

const questions = [
  {
    value: 'shipping',
    title: 'Shipping',
    body: 'Orders usually ship within 3 business days.',
  },
  {
    value: 'returns',
    title: 'Returns',
    body: 'You can return items within 14 days of delivery.',
  },
  {
    value: 'payment',
    title: 'Payment methods',
    body: 'We accept credit cards and bank transfers.',
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
