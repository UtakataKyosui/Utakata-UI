import { Sidebar } from '@utakata-ui/react';

export default function SidebarExample() {
  return (
    <Sidebar.Provider>
      <Sidebar.Root aria-label="メイン" closeLabel="閉じる">
        <Sidebar.Header>Utakata</Sidebar.Header>
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupLabel>プロジェクト</Sidebar.GroupLabel>
            <Sidebar.Menu>
              <Sidebar.MenuItem>
                <Sidebar.MenuButton href="#overview" current>
                  概要
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
              <Sidebar.MenuItem>
                <Sidebar.MenuButton href="#settings">設定</Sidebar.MenuButton>
              </Sidebar.MenuItem>
            </Sidebar.Menu>
          </Sidebar.Group>
        </Sidebar.Content>
        <Sidebar.Footer>バージョン 1.0</Sidebar.Footer>
      </Sidebar.Root>
      <div>
        <Sidebar.Trigger variant="outline">サイドバー</Sidebar.Trigger>
        <p>ページの内容はサイドバーの横に置きます。</p>
      </div>
    </Sidebar.Provider>
  );
}
