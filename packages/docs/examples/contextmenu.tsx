import { Button, ContextMenu } from '@utakata-ui/react';

/**
 * 右クリック、長押し、フォーカス中の ContextMenu キー / Shift+F10 で開きます。
 * タッチやキーボードでも同じ操作に届くよう、見える DropdownMenu などの代替を必ず併設してください。
 */
export default function ContextMenuExample() {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <Button variant="outline">ファイル（右クリックで操作）</Button>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner>
          <ContextMenu.Popup aria-label="ファイルの操作">
            <ContextMenu.Group>
              <ContextMenu.GroupLabel>文書</ContextMenu.GroupLabel>
              <ContextMenu.Item>編集</ContextMenu.Item>
              <ContextMenu.Item>複製</ContextMenu.Item>
            </ContextMenu.Group>
            <ContextMenu.Separator />
            <ContextMenu.Item disabled>
              削除（権限がありません）
            </ContextMenu.Item>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
