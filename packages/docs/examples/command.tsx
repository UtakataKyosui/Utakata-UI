import { Button, Command, Dialog } from '@utakata-ui/react';
import { useState } from 'react';

const groups = [
  {
    value: '移動',
    items: [
      { value: 'home', label: 'ホーム' },
      { value: 'settings', label: '設定' },
    ],
  },
  {
    value: '操作',
    items: [
      { value: 'copy', label: 'リンクをコピー' },
      { value: 'delete', label: 'プロジェクトを削除（権限なし）' },
    ],
  },
];

export default function CommandExample() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState('まだ実行していません');
  return (
    <>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger render={<Button variant="outline" />}>
          コマンドパレットを開く
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Dialog.Title>コマンドパレット</Dialog.Title>
            <Command.Root items={groups}>
              <Command.Panel>
                <Command.Input
                  aria-label="コマンドを検索"
                  placeholder="コマンドを入力"
                />
                <Command.Empty>該当するコマンドがありません</Command.Empty>
                <Command.List>
                  {(group: (typeof groups)[number]) => (
                    <Command.Group key={group.value} items={group.items}>
                      <Command.GroupLabel>{group.value}</Command.GroupLabel>
                      <Command.Collection>
                        {(item: (typeof groups)[number]['items'][number]) => (
                          <Command.Item
                            key={item.value}
                            value={item}
                            disabled={item.value === 'delete'}
                            onClick={() => {
                              setLast(item.label);
                              setOpen(false);
                            }}
                          >
                            {item.label}
                          </Command.Item>
                        )}
                      </Command.Collection>
                    </Command.Group>
                  )}
                </Command.List>
              </Command.Panel>
            </Command.Root>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <p>最後に実行: {last}</p>
    </>
  );
}
