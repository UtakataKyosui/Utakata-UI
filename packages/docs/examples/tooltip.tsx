import { Button, Flex, Text, Tooltip } from '@utakata-ui/react';

export default function TooltipExample() {
  return (
    <Tooltip.Provider>
      <Flex style={{ gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Tooltip.Root>
          <Tooltip.Trigger render={<Button variant="outline" />}>
            保存
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={6}>
              <Tooltip.Popup>下書きを保存します（Ctrl+S）</Tooltip.Popup>
              <Tooltip.Arrow />
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
        <Text>
          ツールチップは補足です。必要な情報は画面上にも表示してください。
        </Text>
      </Flex>
    </Tooltip.Provider>
  );
}
