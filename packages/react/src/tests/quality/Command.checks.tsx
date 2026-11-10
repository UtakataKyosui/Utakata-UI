import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { expect } from 'vitest';
import { Command } from '../../components/Command.js';
import { Dialog } from '../../components/Dialog.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

export const commandGroups = [
  {
    value: 'Pages',
    items: [
      { value: 'home', label: 'Home' },
      { value: 'settings', label: 'Settings' },
    ],
  },
  {
    value: 'Actions',
    items: [
      { value: 'copy', label: 'Copy link' },
      { value: 'delete', label: 'Delete project' },
    ],
  },
];
export type CommandGroup = (typeof commandGroups)[number];
export type CommandEntry = CommandGroup['items'][number];

/** "Delete project" is disabled so checks can prove it never runs. */
export function CommandList({
  run,
  label = 'Search commands',
}: {
  run: (value: string) => void;
  label?: string;
}) {
  return (
    <Command.Root items={commandGroups}>
      <Command.Panel>
        <Command.Input aria-label={label} placeholder="Type a command" />
        <Command.Empty>No commands found</Command.Empty>
        <Command.List>
          {(group: CommandGroup) => (
            <Command.Group key={group.value} items={group.items}>
              <Command.GroupLabel>{group.value}</Command.GroupLabel>
              <Command.Collection>
                {(item: CommandEntry) => (
                  <Command.Item
                    key={item.value}
                    value={item}
                    disabled={item.value === 'delete'}
                    onClick={() => run(item.value)}
                  >
                    {item.label}
                  </Command.Item>
                )}
              </Command.Collection>
            </Command.Group>
          )}
        </Command.List>
      </Command.Panel>
    </Command.Root>
  );
}

/** A command palette in a Dialog; running a command closes the Dialog. */
export function CommandPalette({ run }: { run: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>Open palette</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup>
          <Dialog.Title>Command palette</Dialog.Title>
          <CommandList
            run={(value) => {
              run(value);
              setOpen(false);
            }}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const input = () => screen.getByRole<HTMLInputElement>('combobox');
export const optionNames = () =>
  screen.queryAllByRole('option').map((option) => option.textContent);

const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

/** Types text as a user edit (an input event with inputType insertText). */
export async function typeText(text: string) {
  await act(async () => {
    fireEvent.input(input(), {
      target: { value: text },
      inputType: 'insertText',
      data: text.slice(-1),
    });
  });
  await flush();
}

/** Dispatches a key as DOM events; real keyboard input is covered in browser tests. */
export async function press(key: string, init: KeyboardEventInit = {}) {
  await act(async () => {
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key,
      ...init,
    });
  });
  await flush();
}

export const commandChecks: Record<string, QualityCheck> = {
  'command.input-name': async () => {
    const view = render(<CommandList run={() => {}} />);
    const named = screen.getByRole('combobox', { name: 'Search commands' });
    expect(named).not.toHaveAccessibleName('Type a command');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(4);
    expect(screen.getByRole('group', { name: 'Pages' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Actions' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Home' })).toBeInTheDocument();
    expect((await audit(view.container)).violations).toEqual([]);
  },
  'command.search-empty-disabled': async () => {
    const ran: string[] = [];
    render(<CommandList run={(value) => ran.push(value)} />);
    input().focus();
    await typeText('s');
    // "Settings" matches; "Home" does not. Case-insensitive, any position.
    expect(optionNames()).toContain('Settings');
    expect(optionNames()).not.toContain('Home');
    await typeText('copy');
    expect(optionNames()).toEqual(['Copy link']);
    // A group without a match is not rendered.
    expect(
      screen.queryByRole('group', { name: 'Pages' }),
    ).not.toBeInTheDocument();
    await typeText('zzz');
    expect(optionNames()).toEqual([]);
    expect(screen.getByRole('status')).toHaveTextContent('No commands found');
    await press('Enter');
    expect(ran).toEqual([]);
    // A disabled command never runs from the pointer or the keyboard.
    await typeText('delete');
    expect(optionNames()).toEqual(['Delete project']);
    const disabled = screen.getByRole('option', { name: 'Delete project' });
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(disabled);
    await press('ArrowDown');
    await press('Enter');
    expect(ran).toEqual([]);
    // Clearing the query restores the whole list and hides the empty message.
    await typeText('');
    expect(optionNames()).toHaveLength(4);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  },
  'command.run-item': async () => {
    const ran: string[] = [];
    render(<CommandList run={(value) => ran.push(value)} />);
    input().focus();
    // Nothing is highlighted or run until the user moves with the arrow keys.
    await press('Enter');
    expect(ran).toEqual([]);
    await press('ArrowDown');
    const first = screen.getByRole('option', { name: 'Home' });
    expect(input()).toHaveAttribute('aria-activedescendant', first.id);
    expect(input()).toHaveFocus();
    await press('ArrowDown');
    expect(input()).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'Settings' }).id,
    );
    await press('ArrowUp');
    expect(input()).toHaveAttribute('aria-activedescendant', first.id);
    await press('ArrowDown');
    await press('Enter');
    expect(ran).toEqual(['settings']);
    // The query is not replaced by the executed command's label.
    expect(input()).toHaveValue('');
    // A pointer click runs the command too.
    fireEvent.click(screen.getByRole('option', { name: 'Copy link' }));
    await flush();
    expect(ran).toEqual(['settings', 'copy']);
    // The list stays rendered: Command has no open state to close.
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  },
  'command.dialog-composition': async () => {
    const ran: string[] = [];
    render(<CommandPalette run={(value) => ran.push(value)} />);
    const trigger = screen.getByRole('button', { name: 'Open palette' });
    await act(async () => {
      fireEvent.click(trigger);
    });
    await flush();
    const dialog = await screen.findByRole('dialog', {
      name: 'Command palette',
    });
    expect(
      screen.getByRole('combobox', { name: 'Search commands' }),
    ).toBeInTheDocument();
    expect((await audit(dialog)).violations).toEqual([]);
    await typeText('hom');
    await press('ArrowDown');
    await press('Enter');
    expect(ran).toEqual(['home']);
    await flush();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  },
};
