import { Button, Flex, Text, Tooltip } from '@utakata-ui/react';

export default function TooltipExample() {
  return (
    <Tooltip.Provider>
      <Flex style={{ gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Tooltip.Root>
          <Tooltip.Trigger render={<Button variant="outline" />}>
            Save
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={6}>
              <Tooltip.Popup>Save the draft (Ctrl+S)</Tooltip.Popup>
              <Tooltip.Arrow />
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
        <Text>
          A tooltip is supplementary. Also show required information on screen.
        </Text>
      </Flex>
    </Tooltip.Provider>
  );
}
