import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { Combobox, type ComboboxRootProps } from '../../components/Combobox.js';
import { Field } from '../../components/Field.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

export const fruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'grape', label: 'Grape' },
];
export type Fruit = (typeof fruits)[number];

/** Banana is disabled so checks can prove it is never selected. */
export function FruitCombobox({
  labelled = 'field',
  ...props
}: Partial<ComboboxRootProps<Fruit>> & { labelled?: 'field' | 'aria' }) {
  const body = (
    <Combobox.Root name="fruit" items={fruits} {...props}>
      <Combobox.InputGroup>
        <Combobox.Input
          placeholder="Search fruit"
          {...(labelled === 'aria' ? { 'aria-label': 'Fruit' } : {})}
        />
        <Combobox.Clear aria-label="Clear fruit" />
        <Combobox.Trigger aria-label="Show fruit options" />
      </Combobox.InputGroup>
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.Empty>No fruit found</Combobox.Empty>
            <Combobox.List>
              {(item: Fruit) => (
                <Combobox.Item
                  key={item.value}
                  value={item}
                  disabled={item.value === 'banana'}
                >
                  {item.label}
                  <Combobox.ItemIndicator />
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
  return (
    <main>
      <form aria-label="Fruit form">
        {labelled === 'field' ? (
          <Field.Root>
            <Field.Label>Fruit</Field.Label>
            {body}
            <Field.Description>Choose one fruit.</Field.Description>
          </Field.Root>
        ) : (
          body
        )}
      </form>
    </main>
  );
}

export const input = () => screen.getByRole<HTMLInputElement>('combobox');
const optionNames = () =>
  screen.queryAllByRole('option').map((option) => option.textContent);
export const formEntries = () =>
  [...new FormData(document.querySelector('form') as HTMLFormElement)].filter(
    ([name]) => name === 'fruit',
  );

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

export const comboboxChecks: Record<string, QualityCheck> = {
  'combobox.input-name': async () => {
    const field = render(<FruitCombobox />);
    const named = screen.getByRole('combobox', { name: 'Fruit' });
    expect(named).toHaveAccessibleDescription('Choose one fruit.');
    expect(named).not.toHaveAccessibleName('Search fruit');
    expect(
      screen.getByRole('button', { name: 'Show fruit options' }),
    ).toBeInTheDocument();
    named.focus();
    await press('ArrowDown');
    const listbox = await screen.findByRole('listbox');
    expect(named).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('option', { name: 'Cherry' })).toBeVisible();
    expect((await audit(field.container)).violations).toEqual([]);
    // The popup is portalled outside the render container.
    expect((await audit(listbox)).violations).toEqual([]);
    field.unmount();

    const labelled = render(<FruitCombobox labelled="aria" />);
    input().focus();
    await typeText('Ch');
    expect(screen.getByRole('combobox', { name: 'Fruit' })).toBeVisible();
    // Selecting an item makes Clear appear; it needs its own name.
    await press('ArrowDown');
    await press('Enter');
    expect(
      screen.getByRole('button', { name: 'Clear fruit' }),
    ).toBeInTheDocument();
    expect((await audit(labelled.container)).violations).toEqual([]);
  },
  'combobox.value-form': async () => {
    const changes: (Fruit | null)[] = [];
    const view = render(
      <FruitCombobox
        value={null}
        onValueChange={(value) => changes.push(value)}
      />,
    );
    expect(input()).toHaveValue('');
    expect(input()).toHaveAttribute('placeholder', 'Search fruit');
    expect(formEntries()).toEqual([['fruit', '']]);

    input().focus();
    await typeText('ap');
    expect(optionNames()).toEqual(['Apple', 'Grape']);
    await press('ArrowDown');
    await press('Enter');
    expect(changes).toEqual([fruits[0]]);
    // Controlled: nothing changes until the parent passes the value back.
    expect(formEntries()).toEqual([['fruit', '']]);
    view.rerender(<FruitCombobox value={fruits[0]} />);
    expect(input()).toHaveValue('Apple');
    expect(formEntries()).toEqual([['fruit', 'apple']]);
    view.rerender(<FruitCombobox value={fruits[2]} />);
    expect(input()).toHaveValue('Cherry');
    expect(formEntries()).toEqual([['fruit', 'cherry']]);
    view.unmount();

    // Uncontrolled: defaultValue selects and labels the input; selecting updates both.
    const uncontrolled: (Fruit | null)[] = [];
    render(
      <FruitCombobox
        defaultValue={fruits[3]}
        onValueChange={(value) => uncontrolled.push(value)}
      />,
    );
    expect(input()).toHaveValue('Grape');
    expect(formEntries()).toEqual([['fruit', 'grape']]);
    input().focus();
    await typeText('Ch');
    await press('ArrowDown');
    await press('Enter');
    expect(uncontrolled).toEqual([fruits[2]]);
    expect(input()).toHaveValue('Cherry');
    expect(formEntries()).toEqual([['fruit', 'cherry']]);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    // Emptying the input clears the value instead of leaving a stale one.
    await typeText('');
    expect(uncontrolled).toEqual([fruits[2], null]);
    expect(formEntries()).toEqual([['fruit', '']]);
    // Text that matches no item is never the submitted value.
    await typeText('zzz');
    expect(formEntries()).toEqual([['fruit', '']]);
    expect(uncontrolled).toEqual([fruits[2], null]);
  },
  'combobox.empty-disabled': async () => {
    const changes: (Fruit | null)[] = [];
    const view = render(
      <FruitCombobox
        labelled="aria"
        onValueChange={(value) => changes.push(value)}
      />,
    );
    input().focus();
    await typeText('zzz');
    expect(optionNames()).toEqual([]);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('No fruit found');
    await press('Enter');
    expect(changes).toEqual([]);
    await typeText('');
    // A disabled option cannot be selected by pointer or keyboard.
    await typeText('an');
    expect(optionNames()).toEqual(['Banana']);
    const banana = screen.getByRole('option', { name: 'Banana' });
    expect(banana).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(banana);
    await flush();
    await press('ArrowDown');
    await press('Enter');
    expect(changes).toEqual([]);
    expect(formEntries()).toEqual([['fruit', '']]);
    view.unmount();

    const disabled = render(<FruitCombobox labelled="aria" disabled />);
    expect(input()).toBeDisabled();
    input().focus();
    expect(input()).not.toHaveFocus();
    await press('ArrowDown');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    disabled.unmount();

    const readOnly = render(
      <FruitCombobox
        labelled="aria"
        readOnly
        defaultValue={fruits[0]}
        onValueChange={(value) => changes.push(value)}
      />,
    );
    expect(input()).toHaveAttribute('readonly');
    input().focus();
    expect(input()).toHaveFocus();
    // Typing is blocked by the browser itself; keys must not select either.
    await press('ArrowDown');
    await press('ArrowDown');
    await press('Enter');
    expect(input()).toHaveValue('Apple');
    expect(changes).toEqual([]);
    expect(formEntries()).toEqual([['fruit', 'apple']]);
    readOnly.unmount();
  },
  'combobox.ime-composition': async () => {
    const changes: (Fruit | null)[] = [];
    render(
      <FruitCombobox
        labelled="aria"
        onValueChange={(value) => changes.push(value)}
      />,
    );
    input().focus();
    await act(async () => {
      fireEvent.compositionStart(input());
      fireEvent.input(input(), {
        target: { value: 'ap' },
        inputType: 'insertCompositionText',
        isComposing: true,
      });
    });
    await flush();
    expect(screen.getByRole('listbox')).toBeVisible();
    await press('ArrowDown');
    expect(input().getAttribute('aria-activedescendant')).not.toBeNull();
    // The Enter that confirms a conversion is reported as keyCode 229.
    await press('Enter', { keyCode: 229, isComposing: true });
    expect(changes).toEqual([]);
    expect(screen.getByRole('listbox')).toBeVisible();
    await act(async () => {
      fireEvent.compositionEnd(input());
    });
    await flush();
    // The query is committed once composition ends; Apple and Grape both match.
    expect(optionNames()).toEqual(['Apple', 'Grape']);
    if (!input().getAttribute('aria-activedescendant'))
      await press('ArrowDown');
    expect(input().getAttribute('aria-activedescendant')).not.toBeNull();
    await press('Enter', { keyCode: 13 });
    expect(changes).toHaveLength(1);
    expect(['apple', 'grape']).toContain(changes[0]?.value);
    expect(input()).toHaveValue(changes[0]?.label);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  },
};
