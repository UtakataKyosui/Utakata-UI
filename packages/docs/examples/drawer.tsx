import { Button, Drawer } from '@utakata-ui/react';

const sides = [
  { side: 'bottom', label: '下' },
  { side: 'top', label: '上' },
  { side: 'right', label: '右' },
  { side: 'left', label: '左' },
] as const;

export default function DrawerExample() {
  return (
    <>
      {sides.map(({ side, label }) => (
        <Drawer.Root key={side} side={side}>
          <Drawer.Trigger render={<Button variant="outline" />}>
            {label}から開く
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Backdrop />
            <Drawer.Popup>
              <Drawer.Title>絞り込み</Drawer.Title>
              <Drawer.Description>
                一覧に表示する条件を選びます。端に向けてスワイプしても、閉じるボタンやEscapeキーでも閉じられます。
              </Drawer.Description>
              <Drawer.Close render={<Button variant="outline" />}>
                閉じる
              </Drawer.Close>
            </Drawer.Popup>
          </Drawer.Portal>
        </Drawer.Root>
      ))}
    </>
  );
}
