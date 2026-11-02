import { Flex, Kbd, KbdGroup, Stack, Text } from '@utakata-ui/react';

export default function KbdExample() {
  return (
    <Stack style={{ gap: '1rem' }}>
      <Text>
        保存: <Kbd>Enter</Kbd>
      </Text>
      <Flex style={{ gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Text>検索を開く:</Text>
        <KbdGroup aria-label="ControlとK">
          <span aria-hidden="true">
            <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd>
          </span>
        </KbdGroup>
        <KbdGroup aria-label="CommandとK">
          <span aria-hidden="true">
            <Kbd size="sm">⌘</Kbd> + <Kbd size="sm">K</Kbd>
          </span>
        </KbdGroup>
      </Flex>
    </Stack>
  );
}
