import { AlertDialog, Button } from '@utakata-ui/react';
import { useState } from 'react';

export default function AlertDialogExample() {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  return (
    <>
      <AlertDialog.Root open={open} onOpenChange={setOpen}>
        <AlertDialog.Trigger render={<Button variant="outline" />}>
          ファイルを削除
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop />
          <AlertDialog.Popup>
            <AlertDialog.Title>ファイルを削除しますか</AlertDialog.Title>
            <AlertDialog.Description>
              削除したファイルは元に戻せません。
            </AlertDialog.Description>
            <AlertDialog.Close render={<Button variant="outline" />}>
              キャンセル
            </AlertDialog.Close>
            <Button
              onClick={() => {
                setDeleted(true);
                setOpen(false);
              }}
            >
              削除する
            </Button>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
      <p role="status">{deleted ? 'ファイルを削除しました。' : ''}</p>
    </>
  );
}
