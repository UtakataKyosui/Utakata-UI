import { NavigationMenu } from '@utakata-ui/react';

export default function NavigationMenuExample() {
  return (
    <NavigationMenu.Root aria-label="メイン">
      <NavigationMenu.List>
        <NavigationMenu.Item>
          <NavigationMenu.Link href="#" active>
            ホーム
          </NavigationMenu.Link>
        </NavigationMenu.Item>
        <NavigationMenu.Item value="products">
          <NavigationMenu.Trigger>
            製品
            <NavigationMenu.Icon />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <ul>
              <li>
                <NavigationMenu.Link href="#">UIキット</NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link href="#">アイコン</NavigationMenu.Link>
              </li>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link href="#">料金</NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
      <NavigationMenu.Portal>
        <NavigationMenu.Positioner sideOffset={8}>
          <NavigationMenu.Popup>
            <NavigationMenu.Viewport />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}
