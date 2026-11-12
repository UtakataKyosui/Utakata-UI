import { Flex, HoverCard, Text } from '@utakata-ui/react';

export default function HoverCardExample() {
  return (
    <Flex style={{ gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <Text>
        開発元は
        <HoverCard.Root>
          <HoverCard.Trigger href="https://github.com/UtakataKyosui">
            UtakataKyosui
          </HoverCard.Trigger>
          <HoverCard.Portal>
            <HoverCard.Positioner sideOffset={8}>
              <HoverCard.Popup>
                Utakata-UIを開発しているアカウントです。
              </HoverCard.Popup>
              <HoverCard.Arrow />
            </HoverCard.Positioner>
          </HoverCard.Portal>
        </HoverCard.Root>
        です。
      </Text>
      <Text>
        カードは補足です。タッチやスクリーンリーダーではリンクをたどるため、必要な情報はリンク先や画面上にも置いてください。
      </Text>
    </Flex>
  );
}
