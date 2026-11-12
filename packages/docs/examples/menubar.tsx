import { Menubar } from '@utakata-ui/react';

export default function MenubarExample() {
  return (
    <Menubar.Root aria-label="アプリケーション">
      <Menubar.Menu>
        <Menubar.Trigger>ファイル</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Positioner sideOffset={4}>
            <Menubar.Popup>
              <Menubar.Item>新規作成</Menubar.Item>
              <Menubar.Item disabled>
                印刷（プリンターがありません）
              </Menubar.Item>
              <Menubar.Separator />
              <Menubar.SubmenuRoot>
                <Menubar.SubmenuTrigger>共有</Menubar.SubmenuTrigger>
                <Menubar.Portal>
                  <Menubar.Positioner>
                    <Menubar.Popup>
                      <Menubar.Item>メール</Menubar.Item>
                      <Menubar.Item>リンクをコピー</Menubar.Item>
                    </Menubar.Popup>
                  </Menubar.Positioner>
                </Menubar.Portal>
              </Menubar.SubmenuRoot>
            </Menubar.Popup>
          </Menubar.Positioner>
        </Menubar.Portal>
      </Menubar.Menu>
      <Menubar.Menu>
        <Menubar.Trigger>編集</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Positioner sideOffset={4}>
            <Menubar.Popup>
              <Menubar.Group>
                <Menubar.GroupLabel>履歴</Menubar.GroupLabel>
                <Menubar.Item>元に戻す</Menubar.Item>
                <Menubar.Item>やり直す</Menubar.Item>
              </Menubar.Group>
            </Menubar.Popup>
          </Menubar.Positioner>
        </Menubar.Portal>
      </Menubar.Menu>
    </Menubar.Root>
  );
}
