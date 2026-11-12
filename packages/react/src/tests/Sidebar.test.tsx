import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { type ComponentProps, createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Sidebar, useSidebar } from '../components/Sidebar.js';
import {
  sidebarManifest,
  sidebarQualityRules,
} from '../metadata/components/Sidebar.js';
import {
  SidebarFixture,
  sidebarChecks,
  stubViewport,
  trigger,
} from './quality/Sidebar.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

// Type contract fixtures, checked by pnpm typecheck without rendering.
const named: ComponentProps<typeof Sidebar.Root> = { 'aria-label': 'Main' };
const labelled: ComponentProps<typeof Sidebar.Root> = {
  'aria-labelledby': 'site-name',
};
// @ts-expect-error the sidebar landmark must have a name source.
const unnamed: ComponentProps<typeof Sidebar.Root> = {};
// @ts-expect-error aria-label and aria-labelledby are mutually exclusive.
const bothNames: ComponentProps<typeof Sidebar.Root> = {
  'aria-label': 'Main',
  'aria-labelledby': 'site-name',
};
// @ts-expect-error JSX usage must also name the sidebar.
const unnamedJsx = <Sidebar.Root />;
const unsafeProps = { closeLabel: 'Close' };
// @ts-expect-error spreads cannot bypass the required name.
const spreadUnnamed = <Sidebar.Root {...unsafeProps} />;
// @ts-expect-error an icon-only trigger needs a name source.
const iconTrigger = <Sidebar.Trigger iconOnly />;
const namedTrigger = <Sidebar.Trigger iconOnly aria-label="Menu" />;
// @ts-expect-error a link needs href or render.
const noDestination = <Sidebar.MenuButton>Home</Sidebar.MenuButton>;
const routed = <Sidebar.MenuButton render={<button type="button" />} />;
// @ts-expect-error aria-current is set through `current`.
const manualCurrent = <Sidebar.MenuButton href="/" aria-current="page" />;
const stateClass: ComponentProps<typeof Sidebar.Menu> = {
  // @ts-expect-error className is a string.
  className: () => 'x',
};
void [
  named,
  labelled,
  unnamed,
  bothNames,
  unnamedJsx,
  spreadUnnamed,
  iconTrigger,
  namedTrigger,
  noDestination,
  routed,
  manualCurrent,
  stateClass,
];

function State() {
  const { open, isMobile, expanded } = useSidebar();
  return <p>{`${open}/${isMobile}/${expanded}`}</p>;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Sidebar', () => {
  it('forwards refs and merges classNames on every DOM part', () => {
    const viewport = stubViewport(false);
    const refs = {
      provider: createRef<HTMLDivElement>(),
      root: createRef<HTMLElement>(),
      trigger: createRef<HTMLElement>(),
      header: createRef<HTMLDivElement>(),
      content: createRef<HTMLDivElement>(),
      footer: createRef<HTMLDivElement>(),
      group: createRef<HTMLDivElement>(),
      label: createRef<HTMLDivElement>(),
      menu: createRef<HTMLUListElement>(),
      item: createRef<HTMLLIElement>(),
      button: createRef<HTMLAnchorElement>(),
    };
    render(
      <Sidebar.Provider ref={refs.provider} className="p">
        <Sidebar.Trigger ref={refs.trigger} className="t" aria-label="Menu">
          Menu
        </Sidebar.Trigger>
        <Sidebar.Root ref={refs.root} className="r" aria-label="Main">
          <Sidebar.Header ref={refs.header} className="h" />
          <Sidebar.Content ref={refs.content} className="c">
            <Sidebar.Group ref={refs.group} className="g">
              <Sidebar.GroupLabel ref={refs.label} className="l">
                Group
              </Sidebar.GroupLabel>
              <Sidebar.Menu ref={refs.menu} className="m">
                <Sidebar.MenuItem ref={refs.item} className="i">
                  <Sidebar.MenuButton ref={refs.button} className="b" href="/">
                    Home
                  </Sidebar.MenuButton>
                </Sidebar.MenuItem>
              </Sidebar.Menu>
            </Sidebar.Group>
          </Sidebar.Content>
          <Sidebar.Footer ref={refs.footer} className="f" />
        </Sidebar.Root>
      </Sidebar.Provider>,
    );
    const expected: [keyof typeof refs, string, string][] = [
      ['provider', 'ui-sidebar-provider', 'p'],
      ['root', 'ui-sidebar', 'r'],
      ['trigger', 'ui-sidebar__trigger', 't'],
      ['header', 'ui-sidebar__header', 'h'],
      ['content', 'ui-sidebar__content', 'c'],
      ['footer', 'ui-sidebar__footer', 'f'],
      ['group', 'ui-sidebar__group', 'g'],
      ['label', 'ui-sidebar__group-label', 'l'],
      ['menu', 'ui-sidebar__menu', 'm'],
      ['item', 'ui-sidebar__menu-item', 'i'],
      ['button', 'ui-sidebar__menu-button', 'b'],
    ];
    for (const [key, base, extra] of expected) {
      expect(refs[key].current, key).toHaveClass(base, extra);
    }
    expect(refs.root.current?.tagName).toBe('NAV');
    viewport.restore();
  });

  it('documents the final defaults', () => {
    expect(sidebarManifest.defaults).toEqual({
      open: true,
      mobileOpen: false,
      mobileBreakpoint: 768,
    });
    expect(sidebarManifest.props.closeLabel.default).toBe('閉じる');
  });

  it('exposes the state to custom controls through useSidebar', () => {
    const viewport = stubViewport(false);
    render(
      <Sidebar.Provider>
        <State />
      </Sidebar.Provider>,
    );
    expect(screen.getByText('true/false/true')).toBeInTheDocument();
    viewport.restore();
  });

  it('throws a clear error outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(<Sidebar.Trigger aria-label="Menu" iconOnly />),
    ).toThrow(/Sidebar.Provider/);
  });

  it('runs the trigger onClick and honors preventDefault', () => {
    const viewport = stubViewport(false);
    const onClick = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    render(
      <Sidebar.Provider>
        <Sidebar.Trigger aria-label="Menu" iconOnly onClick={onClick as never}>
          M
        </Sidebar.Trigger>
        <Sidebar.Root aria-label="Main" />
      </Sidebar.Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('navigation')).not.toHaveAttribute('hidden');
    viewport.restore();
  });

  it('closes the sheet and returns focus to the trigger when the viewport widens', async () => {
    const viewport = stubViewport(true);
    render(<SidebarFixture />);
    const button = trigger();
    fireEvent.click(button);
    const link = await screen.findByRole('link', { name: 'Settings' });
    link.focus();
    viewport.set(false);
    // Wide layout: the persistent sidebar is shown and the sheet is gone.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Main' }),
    ).not.toHaveAttribute('hidden');
    await settle(0);
    expect(button).toHaveFocus();
    // Narrowing again starts closed instead of reopening the old sheet.
    viewport.set(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    viewport.restore();
  });

  it('does not take focus on a breakpoint change when focus was elsewhere', async () => {
    const viewport = stubViewport(false);
    render(<SidebarFixture />);
    viewport.set(true);
    await settle(0);
    expect(trigger()).not.toHaveFocus();
    viewport.restore();
  });

  it('passes every automated quality rule', async () => {
    await expectAutomatedQuality(sidebarQualityRules, sidebarChecks);
  });

  it('does not warn for a named sidebar and trigger', async () => {
    const viewport = stubViewport(true);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<SidebarFixture />);
    fireEvent.click(trigger());
    await screen.findByRole('dialog', { name: 'Main' });
    await settle();
    expect(warn).not.toHaveBeenCalled();
    viewport.restore();
  });

  it('warns in development when an icon-only trigger has no name', async () => {
    const viewport = stubViewport(false);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Sidebar.Provider>
        {/* @ts-expect-error the type requires a name; this checks the runtime diagnostic. */}
        <Sidebar.Trigger iconOnly>
          <svg aria-hidden="true" />
        </Sidebar.Trigger>
      </Sidebar.Provider>,
    );
    await settle();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('[Utakata-UI a11y] Button: No accessible name'),
    );
    viewport.restore();
  });
});
