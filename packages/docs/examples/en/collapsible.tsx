import { Collapsible, Text } from '@utakata-ui/react';

export default function CollapsibleExample() {
  return (
    <Collapsible.Root>
      <Collapsible.Trigger>Advanced settings</Collapsible.Trigger>
      <Collapsible.Panel>
        <Text>
          Additional settings such as notification frequency and display
          language.
        </Text>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
