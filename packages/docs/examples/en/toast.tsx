import { Button, Toast, useToastManager } from '@utakata-ui/react';

function ToastList() {
  const { toasts } = useToastManager();
  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast}>
      <Toast.Content>
        <Toast.Title />
        <Toast.Description />
        <Toast.Action />
        <Toast.Close>Close</Toast.Close>
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
            title: 'Saved',
            description: 'Your changes have been applied.',
          })
        }
      >
        Save
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          manager.add({
            title: 'Could not send',
            description: 'Check your connection and try again.',
            type: 'error',
            priority: 'high',
            timeout: 0,
          })
        }
      >
        Error notification
      </Button>
    </>
  );
}

export default function ToastExample() {
  return (
    <Toast.Provider>
      <Actions />
      <Toast.Portal>
        <Toast.Viewport aria-label="Notifications">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}
