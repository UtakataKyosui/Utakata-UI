import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Tabs, type TabsRootProps } from '../components/Tabs.js';
import { tabsQualityRules } from '../metadata/components/Tabs.js';
import { tabsChecks } from './quality/Tabs.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Type fixtures checked by pnpm typecheck without rendering invalid JSX.
const uncontrolled: TabsRootProps = { defaultValue: 'profile' };
const controlled: TabsRootProps = { value: 'profile' };
// @ts-expect-error The initial tab must be explicit.
const implicitInitial: TabsRootProps = {};
// @ts-expect-error value and defaultValue are mutually exclusive.
const both: TabsRootProps = { value: 'a', defaultValue: 'b' };
void [uncontrolled, controlled, implicitInitial, both];

describe('Tabs', () => {
  it('forwards className and refs to every part', () => {
    const root = createRef<HTMLDivElement>();
    const list = createRef<HTMLDivElement>();
    const tab = createRef<HTMLElement>();
    const panel = createRef<HTMLDivElement>();
    render(
      <Tabs.Root ref={root} className="r" defaultValue="a">
        <Tabs.List ref={list} className="l" aria-label="Settings">
          <Tabs.Tab ref={tab} className="t" value="a">
            Profile
          </Tabs.Tab>
          <Tabs.Indicator className="i" renderBeforeHydration />
        </Tabs.List>
        <Tabs.Panel ref={panel} className="p" value="a">
          Body
        </Tabs.Panel>
      </Tabs.Root>,
    );
    expect(root.current).toHaveClass('ui-tabs', 'r');
    expect(list.current).toHaveClass('ui-tabs__list', 'l');
    expect(tab.current).toBe(screen.getByRole('tab', { name: 'Profile' }));
    expect(tab.current).toHaveClass('ui-tabs__tab', 't');
    expect(tab.current).toHaveAttribute('type', 'button');
    expect(panel.current).toHaveClass('ui-tabs__panel', 'p');
  });

  it('selects on focus when activateOnFocus is set', async () => {
    const onValueChange = vi.fn();
    render(
      <Tabs.Root defaultValue="a" onValueChange={onValueChange}>
        <Tabs.List aria-label="Settings" activateOnFocus>
          <Tabs.Tab value="a">Profile</Tabs.Tab>
          <Tabs.Tab value="b">Security</Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>,
    );
    const profile = screen.getByRole('tab', { name: 'Profile' });
    profile.focus();
    fireEvent.keyDown(profile, { key: 'ArrowRight' });
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'Security' })).toHaveAttribute(
        'aria-selected',
        'true',
      ),
    );
    expect(onValueChange.mock.calls[0]?.[0]).toBe('b');
  });

  it('passes the automated quality rules', async () => {
    const report = await expectAutomatedQuality(tabsQualityRules, tabsChecks);
    expect(report.complete).toBe(false);
  });

  it('warns in development for unnamed tabs only', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const view = render(
      <Tabs.Root defaultValue="a">
        <Tabs.List aria-label="Settings">
          <Tabs.Tab value="a">Profile</Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>,
    );
    await settle();
    expect(warn).not.toHaveBeenCalled();
    view.rerender(
      <Tabs.Root defaultValue="a">
        <Tabs.List aria-label="Settings">
          <Tabs.Tab value="a">
            <span aria-hidden="true">★</span>
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] Tabs.Tab: No accessible name source',
        ),
      ),
    );
  });
});
