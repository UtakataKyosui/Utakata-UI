import { Flex, Separator, Stack, Text } from '@utakata-ui/react';

export default function SeparatorExample() {
  return (
    <Stack style={{ gap: '1rem', maxWidth: '28rem' }}>
      <Text>Account information</Text>
      <Separator />
      <Flex style={{ gap: '0.75rem', alignItems: 'center' }}>
        <Text>Profile</Text>
        <Separator orientation="vertical" />
        <Text>Settings</Text>
      </Flex>
      <Separator decorative={false} />
      <Text>Use decorative=false for a meaningful separator.</Text>
    </Stack>
  );
}
