import { Resizable } from '@utakata-ui/react';

export default function ResizableExample() {
  return (
    <Resizable.Group
      style={{ blockSize: '12rem', border: '1px solid var(--ui-color-border)' }}
    >
      <Resizable.Panel panelId="nav" defaultSize={30} minSize={20} maxSize={50}>
        <p style={{ margin: '0.75rem' }}>ナビゲーション</p>
      </Resizable.Panel>
      <Resizable.Handle aria-label="ナビゲーションの幅" />
      <Resizable.Panel panelId="main" defaultSize={70} minSize={30}>
        <p style={{ margin: '0.75rem' }}>
          本文。ハンドルにフォーカスして矢印キー、Home、Endで幅を変えられます。
        </p>
      </Resizable.Panel>
    </Resizable.Group>
  );
}
