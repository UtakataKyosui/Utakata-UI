import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Command, type CommandRootProps } from '../components/Command.js';
import { commandQualityRules } from '../metadata/components/Command.js';
import { commandChecks, commandGroups } from './quality/Command.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Checked by pnpm typecheck without rendering invalid JSX.
const root: CommandRootProps<string> = { items: ['a'] };
// @ts-expect-error The list is always inline; open state is not configurable.
const open: CommandRootProps<string> = { open: false };
// @ts-expect-error The list is always inline.
const inline: CommandRootProps<string> = { inline: false };
// @ts-expect-error A command list is not a form field.
const named: CommandRootProps<string> = { name: 'command' };
// @ts-expect-error className must be a string, not a Base UI state callback.
void (<Command.Input className={() => 'x'} />);
void [root, open, inline, named];

const diagnostics = (warn: { mock: { calls: unknown[][] } }) =>
  warn.mock.calls
    .map(([message]) => String(message))
    .filter((message) => message.startsWith('[Utakata-UI a11y]'));

describe('Command', () => {
  it('forwards className and refs to each DOM part', async () => {
    const inputRef = createRef<HTMLInputElement>();
    const panelRef = createRef<HTMLDivElement>();
    render(
      <Command.Root items={[{ value: 'Basic', items: ['a', 'b'] }]}>
        <Command.Panel ref={panelRef} className="panel">
          <Command.Input ref={inputRef} className="input" aria-label="Find" />
          <Command.Empty className="empty">None</Command.Empty>
          <Command.List className="list">
            <Command.Group className="group" items={['a']}>
              <Command.GroupLabel className="group-label">
                Basic
              </Command.GroupLabel>
              <Command.Collection>
                {(item: string) => (
                  <Command.Item key={item} value={item} className="item">
                    {item}
                    <Command.Shortcut className="shortcut">⌘K</Command.Shortcut>
                  </Command.Item>
                )}
              </Command.Collection>
            </Command.Group>
            <Command.Separator className="separator" />
          </Command.List>
        </Command.Panel>
      </Command.Root>,
    );
    await settle();
    expect(panelRef.current).toHaveClass('ui-command', 'panel');
    expect(inputRef.current).toBe(
      screen.getByRole('combobox', { name: 'Find' }),
    );
    expect(inputRef.current).toHaveClass('ui-command__input', 'input');
    for (const [custom, base] of [
      ['empty', 'ui-command__empty'],
      ['list', 'ui-command__list'],
      ['group', 'ui-command__group'],
      ['group-label', 'ui-command__group-label'],
      ['item', 'ui-command__item'],
      ['shortcut', 'ui-command__shortcut'],
    ])
      expect(document.querySelector(`.${custom}`)).toHaveClass(base as string);
    expect(screen.getByRole('group', { name: 'Basic' })).toBeInTheDocument();
  });

  it('renders the list inline without a popup, always expanded', async () => {
    render(
      <Command.Root items={commandGroups.flatMap((group) => group.items)}>
        <Command.Input aria-label="Find" />
        <Command.List>
          {(item: { value: string; label: string }) => (
            <Command.Item key={item.value} value={item}>
              {item.label}
            </Command.Item>
          )}
        </Command.List>
      </Command.Root>,
    );
    await settle();
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getAllByRole('option')).toHaveLength(4);
    expect(document.querySelector('[data-base-ui-inert]')).toBeNull();
  });

  it('passes all automated quality rules without diagnostics', async () => {
    await expectAutomatedQuality(commandQualityRules, commandChecks);
  });

  it('warns for an input named only by its placeholder', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Command.Root items={['a']}>
        <Command.Input placeholder="Type a command" />
      </Command.Root>,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] Command.Input: No accessible name source',
        ),
      ),
    );
    cleanup();
    warn.mockClear();
    render(
      <Command.Root items={['a']}>
        <Command.Input aria-label="Find" />
      </Command.Root>,
    );
    await settle();
    expect(diagnostics(warn)).toEqual([]);
  });
});
