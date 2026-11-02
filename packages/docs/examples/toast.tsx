import { Button, Toast, useToastManager } from '@utakata-ui/react';

function ToastList() {
  const { toasts } = useToastManager();
  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast}>
      <Toast.Content>
        <Toast.Title />
        <Toast.Description />
        <Toast.Action />
        <Toast.Close>閉じる</Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
}

function Actions() {
  const manager = useToastManager();
  return (
    <>
      <Button
        onClick={() =>
          manager.add({
            title: '保存しました',
            description: '変更を反映しました。',
          })
        }
      >
        保存
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          manager.add({
            title: '送信できませんでした',
            description: '接続を確認してから再試行してください。',
            type: 'error',
            priority: 'high',
            timeout: 0,
          })
        }
      >
        エラー通知
      </Button>
    </>
  );
}

export default function ToastExample() {
  return (
    <Toast.Provider>
      <Actions />
      <Toast.Portal>
        <Toast.Viewport aria-label="通知">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}
