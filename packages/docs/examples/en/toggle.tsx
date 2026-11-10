import { Flex, Toggle } from '@utakata-ui/react';

export default function ToggleExample() {
  return (
    <Flex style={{ gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <Toggle iconOnly aria-label="Bold" variant="outline">
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
          <path d="M4 2h5a3 3 0 0 1 0 6H4zM4 8h6a3 3 0 0 1 0 6H4z" />
        </svg>
      </Toggle>
      <Toggle iconOnly aria-label="Italic" variant="outline" defaultPressed>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
          <path d="M6 2h6v2H9.6l-2 8H10v2H4v-2h2.4l2-8H6z" />
        </svg>
      </Toggle>
      <Toggle size="sm">Show ruler</Toggle>
      <Toggle size="lg">Snap to grid</Toggle>
      <Toggle disabled>Change history (disabled)</Toggle>
    </Flex>
  );
}
