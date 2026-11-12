import { Resizable } from '@utakata-ui/react';

export default function ResizableExample() {
  return (
    <Resizable.Group
      style={{ blockSize: '12rem', border: '1px solid var(--ui-color-border)' }}
    >
      <Resizable.Panel panelId="nav" defaultSize={30} minSize={20} maxSize={50}>
        <p style={{ margin: '0.75rem' }}>Navigation</p>
      </Resizable.Panel>
      <Resizable.Handle aria-label="Navigation width" />
      <Resizable.Panel panelId="main" defaultSize={70} minSize={30}>
        <p style={{ margin: '0.75rem' }}>
          Drag the grip on the divider to resize. With a keyboard, focus the
          grip and use the arrow keys, Home, or End.
        </p>
      </Resizable.Panel>
    </Resizable.Group>
  );
}
