import { fireEvent, render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { NavigationMenu } from '../../components/NavigationMenu.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

export function renderNavigationMenu(onLink: () => void = () => {}) {
  render(
    <NavigationMenu.Root aria-label="Main">
      <NavigationMenu.List>
        <NavigationMenu.Item>
          <NavigationMenu.Link href="/" active onClick={onLink}>
            Home
          </NavigationMenu.Link>
        </NavigationMenu.Item>
        <NavigationMenu.Item value="products">
          <NavigationMenu.Trigger>
            Products
            <NavigationMenu.Icon />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <ul>
              <li>
                <NavigationMenu.Link href="/products/ui" onClick={onLink}>
                  UI kit
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link href="/products/icons">
                  Icons
                </NavigationMenu.Link>
              </li>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link href="/pricing">Pricing</NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
      <NavigationMenu.Portal>
        <NavigationMenu.Positioner sideOffset={8}>
          <NavigationMenu.Popup>
            <NavigationMenu.Viewport />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>,
  );
  return screen.getByRole('navigation', { name: 'Main' });
}

export async function openProducts() {
  const trigger = screen.getByRole('button', { name: 'Products' });
  trigger.focus();
  fireEvent.click(trigger);
  await screen.findByRole('link', { name: 'UI kit' });
  return trigger;
}

export const navigationMenuChecks: Record<string, QualityCheck> = {
  'navigation-menu.semantics': async () => {
    const nav = renderNavigationMenu();
    expect(nav.tagName).toBe('NAV');
    expect(nav.querySelector('ul')).not.toBeNull();
    expect(nav.querySelectorAll('li')).toHaveLength(3);
    const home = screen.getByRole('link', { name: 'Home' });
    expect(home).toHaveAttribute('href', '/');
    expect(home).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Pricing' })).not.toHaveAttribute(
      'aria-current',
    );
    const trigger = screen.getByRole('button', { name: 'Products' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).not.toHaveAttribute('aria-controls');
    await openProducts();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls');
    expect(screen.getByRole('link', { name: 'UI kit' })).toHaveAttribute(
      'href',
      '/products/ui',
    );
    expect(screen.queryByRole('menu')).toBeNull();
    expect((await audit(nav)).violations).toEqual([]);
  },
};
