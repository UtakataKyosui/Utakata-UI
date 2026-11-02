import { Flex, Separator, Stack, Text } from '@utakata-ui/react';

export default function SeparatorExample() {
  return (
    <Stack style={{ gap: '1rem', maxWidth: '28rem' }}>
      <Text>アカウント情報</Text>
      <Separator />
      <Flex style={{ gap: '0.75rem', alignItems: 'center' }}>
        <Text>プロフィール</Text>
        <Separator orientation="vertical" />
        <Text>設定</Text>
      </Flex>
      <Separator decorative={false} />
      <Text>意味のある区切りは decorative=false を指定します。</Text>
    </Stack>
  );
}
