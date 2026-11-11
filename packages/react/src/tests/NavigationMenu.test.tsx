import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { type ComponentProps, createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NavigationMenu } from '../components/NavigationMenu.js';
import {
  navigationMenuManifest,
  navigationMenuQualityRules,
} from '../metadata/components/NavigationMenu.js';
import {
  navigationMenuChecks,
  openProducts,
  renderNavigationMenu,
} from './quality/NavigationMenu.checks.js';
import { expectAutomatedQuality } from './quality-helpers.js';

// Type contract fixtures, checked by pnpm typecheck without rendering.
const named: ComponentProps<typeof NavigationMenu.Root> = {
  'aria-label': 'Main',
};
const labelled: ComponentProps<typeof NavigationMenu.Root> = {
  'aria-labelledby': 'site-heading',
};
// @ts-expect-error the navigation landmark must have a name source.
const unnamed: ComponentProps<typeof NavigationMenu.Root> = {};
// @ts-expect-error aria-label and aria-labelledby are mutually exclusive.
const bothNames: ComponentProps<typeof NavigationMenu.Root> = {
  'aria-label': 'Main',
  'aria-labelledby': 'site-heading',
};
const stateClass: ComponentProps<typeof NavigationMenu.Root> = {
  'aria-label': 'Main',
  // @ts-expect-error className is a string, not a Base UI state function.
  className: () => 'x',
};
const badOrientation: ComponentProps<typeof NavigationMenu.Root> = {
  'aria-label': 'Main',
  // @ts-expect-error orientation is limited to horizontal | vertical.
  orientation: 'diagonal',
};
const linkHref: ComponentProps<typeof NavigationMenu.Link> = { href: '/a' };
const linkRender: ComponentProps<typeof NavigationMenu.Link> = {
  render: <a href="/b">router</a>,
};
// @ts-expect-error a link needs href or render.
const linkNoDestination: ComponentProps<typeof NavigationMenu.Link> = {};
const linkCurrent: ComponentProps<typeof NavigationMenu.Link> = {
  href: '/a',
  // @ts-expect-error mark the current page with active, not aria-current.
  'aria-current': 'page',
};
void [
  named,
  labelled,
  unnamed,
  bothNames,
  stateClass,
  badOrientation,
  linkHref,
  linkRender,
  linkNoDestination,
  linkCurrent,
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('NavigationMenu', () => {
  it('forwards refs and merges classNames on every DOM part', async () => {
    const rootRef = createRef<HTMLElement>();
    const triggerRef = createRef<HTMLElement>();
    const linkRef = createRef<HTMLAnchorElement>();
    render(
      <NavigationMenu.Root
        ref={rootRef}
        aria-label="Main"
        className="r"
        defaultValue="a"
      >
        <NavigationMenu.List className="l">
          <NavigationMenu.Item className="i" value="a">
            <NavigationMenu.Trigger ref={triggerRef} className="t">
              More
              <NavigationMenu.Icon className="ic" />
            </NavigationMenu.Trigger>
            <NavigationMenu.Content className="c">
              <NavigationMenu.Link ref={linkRef} href="/a" className="k">
                Alpha
              </NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
        <NavigationMenu.Portal>
          <NavigationMenu.Positioner className="p">
            <NavigationMenu.Popup className="o">
              <NavigationMenu.Viewport className="v" />
            </NavigationMenu.Popup>
          </NavigationMenu.Positioner>
        </NavigationMenu.Portal>
      </NavigationMenu.Root>,
    );
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(nav).toHaveClass('ui-navigation-menu', 'r');
    expect(rootRef.current).toBe(nav);
    expect(nav.querySelector('ul')).toHaveClass(
      'ui-navigation-menu__list',
      'l',
    );
    expect(nav.querySelector('li')).toHaveClass(
      'ui-navigation-menu__item',
      'i',
    );
    const trigger = screen.getByRole('button', { name: 'More' });
    expect(trigger).toHaveClass('ui-navigation-menu__trigger', 't');
    expect(triggerRef.current).toBe(trigger);
    expect(trigger.querySelector('span')).toHaveClass(
      'ui-navigation-menu__icon',
      'ic',
    );
    const link = await screen.findByRole('link', { name: 'Alpha' });
    expect(link).toHaveClass('ui-navigation-menu__link', 'k');
    expect(linkRef.current).toBe(link);
    expect(link.closest('.ui-navigation-menu__content')).toHaveClass('c');
    expect(link.closest('.ui-navigation-menu__viewport')).toHaveClass('v');
    expect(link.closest('.ui-navigation-menu__popup')).toHaveClass('o');
    expect(link.closest('.ui-navigation-menu__positioner')).toHaveClass('p');
    expect(navigationMenuManifest.defaults.orientation).toBe('horizontal');
  });

  it('toggles a panel with click and closes it with Escape', async () => {
    renderNavigationMenu();
    const trigger = await openProducts();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(trigger, { key: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'UI kit' })).toBeNull(),
    );
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('runs a panel link click once', async () => {
    const handler = vi.fn();
    renderNavigationMenu(handler);
    await openProducts();
    const link = screen.getByRole('link', { name: 'UI kit' });
    link.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(link);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('keeps the panel open after a link unless closeOnClick is set', async () => {
    render(
      <NavigationMenu.Root aria-label="Main" defaultValue="a">
        <NavigationMenu.List>
          <NavigationMenu.Item value="a">
            <NavigationMenu.Trigger>More</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Link href="#keep">Keep</NavigationMenu.Link>
              <NavigationMenu.Link href="#close" closeOnClick>
                Close
              </NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
        <NavigationMenu.Portal>
          <NavigationMenu.Positioner>
            <NavigationMenu.Popup>
              <NavigationMenu.Viewport />
            </NavigationMenu.Popup>
          </NavigationMenu.Positioner>
        </NavigationMenu.Portal>
      </NavigationMenu.Root>,
    );
    fireEvent.click(await screen.findByRole('link', { name: 'Keep' }));
    expect(screen.getByRole('link', { name: 'Keep' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'Close' })).toBeNull(),
    );
  });

  it('warns when the root, a trigger or a link has no name source', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      // @ts-expect-error the root name is required by the public type.
      <NavigationMenu.Root>
        <NavigationMenu.List>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger />
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Link href="/x" />
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu.Root>,
    );
    for (const part of [
      'NavigationMenu.Root',
      'NavigationMenu.Trigger',
      'NavigationMenu.Link',
    ])
      await waitFor(() =>
        expect(warn).toHaveBeenCalledWith(
          expect.stringContaining(
            `[Utakata-UI a11y] ${part}: No accessible name`,
          ),
        ),
      );
  });

  it('passes its automated quality rules without diagnostics', async () => {
    await expectAutomatedQuality(
      navigationMenuQualityRules,
      navigationMenuChecks,
    );
  });
});
