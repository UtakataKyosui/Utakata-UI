import { Button, Item } from '@utakata-ui/react';

function FileIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16">
      <path d="M3 1h7l3 3v11H3z" fill="currentColor" />
    </svg>
  );
}

export default function ItemExample() {
  return (
    <Item.Group aria-label="ファイル">
      <Item.Root>
        <Item.Icon>
          <FileIcon />
        </Item.Icon>
        <Item.Body>
          <Item.Link href="#">月次レポート</Item.Link>
          <Item.Description>2026年10月分の売上と利用状況</Item.Description>
        </Item.Body>
        <Item.Meta>更新: 11月1日</Item.Meta>
        <Item.Actions>
          <Button variant="outline" size="sm">
            共有
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="月次レポートを削除"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16">
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </Button>
        </Item.Actions>
      </Item.Root>
      <Item.Root>
        <Item.Body>
          <Item.Button onClick={() => alert('詳細を開きます')}>
            詳細を開く
          </Item.Button>
          <Item.Description>ボタンとして行全体を操作できます</Item.Description>
        </Item.Body>
        <Item.Meta>下書き</Item.Meta>
      </Item.Root>
      <Item.Root>
        <Item.Body>
          <Item.Title>操作のない行</Item.Title>
          <Item.Description>
            長い説明でも内側の余白を保ったまま折り返します。この行はリンクでもボタンでもありません。
          </Item.Description>
        </Item.Body>
      </Item.Root>
    </Item.Group>
  );
}
