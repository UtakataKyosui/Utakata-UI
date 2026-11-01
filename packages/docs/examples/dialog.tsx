import { Button, Dialog } from '@utakata-ui/react';

export default function DialogExample() {
  return (
    <Dialog.Root>
      <Dialog.Trigger render={<Button />}>ダイアログを開く</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup>
          <Dialog.Title>Utakata-UIへようこそ</Dialog.Title>
          <Dialog.Description>
            開発中のDialogコンポーネントです。Escapeキー、背景のクリック、または閉じるボタンで閉じられます。
          </Dialog.Description>
          <Dialog.Close render={<Button variant="outline" />}>
            閉じる
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
