import { Button, Sheet } from '@utakata-ui/react';

const sides = [
  { side: 'top', label: '上' },
  { side: 'right', label: '右' },
  { side: 'bottom', label: '下' },
  { side: 'left', label: '左' },
] as const;

export default function SheetExample() {
  return (
    <>
      {sides.map(({ side, label }) => (
        <Sheet.Root key={side}>
          <Sheet.Trigger render={<Button variant="outline" />}>
            {label}から開く
          </Sheet.Trigger>
          <Sheet.Portal>
            <Sheet.Backdrop />
            <Sheet.Popup side={side}>
              <Sheet.Title>絞り込み</Sheet.Title>
              <Sheet.Description>
                一覧に表示する条件を選びます。内容が長いときはパネル内でスクロールします。
              </Sheet.Description>
              <Sheet.Close render={<Button variant="outline" />}>
                閉じる
              </Sheet.Close>
            </Sheet.Popup>
          </Sheet.Portal>
        </Sheet.Root>
      ))}
    </>
  );
}
