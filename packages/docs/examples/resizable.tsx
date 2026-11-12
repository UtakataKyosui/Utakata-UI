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
          境界線の中央にあるグリップをドラッグして幅を変えられます。キーボードではグリップにフォーカスし、矢印キー、Home、Endを使います。
        </p>
      </Resizable.Panel>
    </Resizable.Group>
  );
}
