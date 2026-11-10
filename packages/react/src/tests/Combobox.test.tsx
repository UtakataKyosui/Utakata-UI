import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Combobox, type ComboboxRootProps } from '../components/Combobox.js';
import { Field } from '../components/Field.js';
import { comboboxQualityRules } from '../metadata/components/Combobox.js';
import {
  comboboxChecks,
  type Fruit,
  FruitCombobox,
  formEntries,
  fruits,
  input,
  press,
  typeText,
} from './quality/Combobox.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Checked by pnpm typecheck without rendering invalid JSX.
const single: ComboboxRootProps<string> = { defaultValue: 'apple' };
// @ts-expect-error Combobox is single-selection only.
const multiple: ComboboxRootProps<string> = { multiple: true };
// @ts-expect-error A single Combobox does not accept an array value.
const arrayValue: ComboboxRootProps<string> = { value: ['a'] };
// @ts-expect-error Inline lists are not provided.
const inline: ComboboxRootProps<string> = { inline: true };
void [single, multiple, arrayValue, inline];
// @ts-expect-error An empty Clear button needs a name.
void (<Combobox.Clear />);
// @ts-expect-error An empty Trigger button needs a name.
void (<Combobox.Trigger />);
// @ts-expect-error className must be a string, not a Base UI state callback.
void (<Combobox.Input className={() => 'x'} />);
void (<Combobox.Clear aria-label="Clear" />);
void (<Combobox.Trigger aria-labelledby="label-id" />);
void (<Combobox.Trigger>Open</Combobox.Trigger>);

const diagnostics = (warn: { mock: { calls: unknown[][] } }) =>
  warn.mock.calls
    .map(([message]) => String(message))
    .filter((message) => message.startsWith('[Utakata-UI a11y]'));

describe('Combobox', () => {
  it('forwards className and refs to each DOM part', async () => {
    const inputRef = createRef<HTMLInputElement>();
    const popupRef = createRef<HTMLDivElement>();
    render(
      <Combobox.Root
        defaultOpen
        defaultValue="a"
        items={[{ value: 'a', items: ['a'] }]}
      >
        <Combobox.InputGroup className="group-frame">
          <Combobox.Input ref={inputRef} className="input" aria-label="Item" />
          <Combobox.Clear className="clear" aria-label="Clear" />
          <Combobox.Trigger className="trigger" aria-label="Show" />
        </Combobox.InputGroup>
        <Combobox.Portal>
          <Combobox.Positioner className="positioner">
            <Combobox.Popup ref={popupRef} className="popup">
              <Combobox.Empty className="empty">None</Combobox.Empty>
              <Combobox.List className="list">
                <Combobox.Group className="group" items={['a']}>
                  <Combobox.GroupLabel className="group-label">
                    Basic
                  </Combobox.GroupLabel>
                  <Combobox.Collection>
                    {(item: string) => (
                      <Combobox.Item key={item} value={item} className="item">
                        {item}
                        <Combobox.ItemIndicator className="indicator" />
                      </Combobox.Item>
                    )}
                  </Combobox.Collection>
                </Combobox.Group>
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>,
    );
    await screen.findByRole('listbox');
    const field = screen.getByRole('combobox', { name: 'Item' });
    expect(inputRef.current).toBe(field);
    expect(field).toHaveClass('ui-combobox__input', 'input');
    expect(popupRef.current).toHaveClass('ui-combobox__popup', 'popup');
    for (const [custom, base] of [
      ['group-frame', 'ui-combobox__input-group'],
      ['clear', 'ui-combobox__clear'],
      ['trigger', 'ui-combobox__trigger'],
      ['positioner', 'ui-combobox__positioner'],
      ['empty', 'ui-combobox__empty'],
      ['list', 'ui-combobox__list'],
      ['group', 'ui-combobox__group'],
      ['group-label', 'ui-combobox__group-label'],
      ['item', 'ui-combobox__item'],
      ['indicator', 'ui-combobox__item-indicator'],
    ])
      expect(document.querySelector(`.${custom}`)).toHaveClass(base as string);
    expect(screen.getByRole('group', { name: 'Basic' })).toBeInTheDocument();
  });

  it('is named, described and reports errors through Field without diagnostics', async () => {
    const warn = vi.spyOn(console, 'warn');
    render(
      <Field.Root invalid>
        <Field.Label>Fruit</Field.Label>
        <Combobox.Root items={fruits}>
          <Combobox.InputGroup>
            <Combobox.Input />
          </Combobox.InputGroup>
        </Combobox.Root>
        <Field.Error match>Choose a fruit.</Field.Error>
      </Field.Root>,
    );
    await settle();
    const field = screen.getByRole('combobox', { name: 'Fruit' });
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription('Choose a fruit.');
    expect(diagnostics(warn)).toEqual([]);
  });

  it('passes all automated quality rules without diagnostics', async () => {
    await expectAutomatedQuality(comboboxQualityRules, comboboxChecks);
  });

  it('documents Escape: it closes an open popup, then clears when closed', async () => {
    const changes: (Fruit | null)[] = [];
    render(
      <FruitCombobox
        labelled="aria"
        defaultValue={fruits[0]}
        onValueChange={(value) => changes.push(value)}
      />,
    );
    input().focus();
    await press('ArrowDown');
    expect(screen.getByRole('listbox')).toBeVisible();
    await press('Escape');
    await waitFor(() =>
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
    );
    expect(input()).toHaveValue('Apple');
    expect(changes).toEqual([]);
    await press('Escape');
    expect(input()).toHaveValue('');
    expect(changes).toEqual([null]);
    expect(formEntries()).toEqual([['fruit', '']]);
  });

  it('lets Enter submit the form when no option is highlighted', async () => {
    render(<FruitCombobox labelled="aria" />);
    input().focus();
    await typeText('Ch');
    expect(screen.getByRole('listbox')).toBeVisible();
    const submitted = vi.fn((event: Event) => event.preventDefault());
    document.querySelector('form')?.addEventListener('submit', submitted);
    const enter = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    await act(async () => {
      input().dispatchEvent(enter);
    });
    // Base UI closes the popup and leaves the default action alone.
    expect(enter.defaultPrevented).toBe(false);
    expect(formEntries()).toEqual([['fruit', '']]);
  });

  it('detects a key handler that turns the composition Enter into a commit', async () => {
    const changes: (Fruit | null)[] = [];
    render(
      <FruitCombobox
        labelled="aria"
        onValueChange={(value) => changes.push(value)}
      />,
    );
    // Known-invalid control: capture Enter during composition and replay it as
    // a plain Enter (keyCode 13), as a handler that ignores composition would.
    const field = input();
    field.addEventListener(
      'keydown',
      (event) => {
        if (event.key !== 'Enter' || event.keyCode !== 229) return;
        event.stopImmediatePropagation();
        field.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Enter',
            keyCode: 13,
            bubbles: true,
            cancelable: true,
          }),
        );
      },
      true,
    );
    field.focus();
    await act(async () => {
      fireEvent.compositionStart(field);
      fireEvent.input(field, {
        target: { value: 'ap' },
        inputType: 'insertCompositionText',
        isComposing: true,
      });
    });
    await settle();
    await press('ArrowDown');
    await press('Enter', { keyCode: 229, isComposing: true });
    expect(changes).toEqual([fruits[0]]);
  });

  it('warns for an input named only by its placeholder and for unnamed buttons', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const view = render(
      <Combobox.Root items={fruits}>
        <Combobox.InputGroup>
          <Combobox.Input placeholder="Search fruit" />
        </Combobox.InputGroup>
      </Combobox.Root>,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] Combobox.Input: No accessible name source',
        ),
      ),
    );
    view.unmount();
    warn.mockClear();
    render(
      <Combobox.Root items={fruits}>
        <Combobox.InputGroup>
          <Combobox.Input aria-label="Fruit" />
          {/* @ts-expect-error The types require a name; this exercises the runtime warning. */}
          <Combobox.Trigger />
        </Combobox.InputGroup>
      </Combobox.Root>,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] Combobox.Trigger: No accessible name source',
        ),
      ),
    );
    expect(
      diagnostics(warn).filter((message) => message.includes('Combobox.Input')),
    ).toEqual([]);
  });
});
