import { Sidebar } from '@utakata-ui/react';

export default function SidebarExample() {
  return (
    <Sidebar.Provider>
      <Sidebar.Root aria-label="Main">
        <Sidebar.Header>Utakata</Sidebar.Header>
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupLabel>Project</Sidebar.GroupLabel>
            <Sidebar.Menu>
              <Sidebar.MenuItem>
                <Sidebar.MenuButton href="#overview" current>
                  Overview
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
              <Sidebar.MenuItem>
                <Sidebar.MenuButton href="#settings">
                  Settings
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            </Sidebar.Menu>
          </Sidebar.Group>
        </Sidebar.Content>
        <Sidebar.Footer>Version 1.0</Sidebar.Footer>
      </Sidebar.Root>
      <div>
        <Sidebar.Trigger variant="outline">Sidebar</Sidebar.Trigger>
        <p>The page content goes next to the sidebar.</p>
      </div>
    </Sidebar.Provider>
  );
}
