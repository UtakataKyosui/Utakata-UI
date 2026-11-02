import { Collapsible, Text } from '@utakata-ui/react';

export default function CollapsibleExample() {
  return (
    <Collapsible.Root>
      <Collapsible.Trigger>詳細設定</Collapsible.Trigger>
      <Collapsible.Panel>
        <Text>通知の頻度や表示言語などの追加の設定項目です。</Text>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
