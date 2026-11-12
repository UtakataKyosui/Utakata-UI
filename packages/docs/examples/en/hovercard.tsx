import { Flex, HoverCard, Text } from '@utakata-ui/react';

export default function HoverCardExample() {
  return (
    <Flex style={{ gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <Text>
        Maintained by{' '}
        <HoverCard.Root>
          <HoverCard.Trigger href="https://github.com/UtakataKyosui">
            UtakataKyosui
          </HoverCard.Trigger>
          <HoverCard.Portal>
            <HoverCard.Positioner sideOffset={8}>
              <HoverCard.Popup>
                The account that develops Utakata-UI.
              </HoverCard.Popup>
              <HoverCard.Arrow />
            </HoverCard.Positioner>
          </HoverCard.Portal>
        </HoverCard.Root>
        .
      </Text>
      <Text>
        The card is supplementary. Touch and screen-reader users follow the
        link, so keep required information on the page or the link target.
      </Text>
    </Flex>
  );
}
