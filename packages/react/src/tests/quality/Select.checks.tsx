import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect } from 'vitest';
import { Select, type SelectRootProps } from '../../components/Select.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

const themes = [
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

function ThemeSelect(props: SelectRootProps<string>) {
  return (
    <main>
      <form>
        <Select.Root name="theme" items={themes} {...props}>
          <Select.Label>Theme</Select.Label>
          <Select.Trigger>
            <Select.Value placeholder="Choose a theme" />
            <Select.Icon />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.List>
                  {themes.map((theme) => (
                    <Select.Item
                      key={theme.value}
                      value={theme.value}
                      disabled={theme.value === 'dark'}
                    >
                      <Select.ItemText>{theme.label}</Select.ItemText>
                      <Select.ItemIndicator>✓</Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </form>
    </main>
  );
}

const trigger = () => screen.getByRole('combobox', { name: 'Theme' });
const formValue = () =>
  [...new FormData(document.querySelector('form') as HTMLFormElement)].at(0);

async function press(key: string) {
  fireEvent.keyDown(document.activeElement ?? document.body, { key });
  await new Promise((resolve) => setTimeout(resolve, 20));
}

async function openWithKeyboard() {
  trigger().focus();
  await press('ArrowDown');
  await screen.findByRole('listbox');
}

async function expectClosedWithFocus() {
  await waitFor(() =>
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
  );
  expect(trigger()).toHaveFocus();
}

export const selectChecks: Record<string, QualityCheck> = {
  'select.trigger-name': async () => {
    const { container } = render(<ThemeSelect />);
    fireEvent.click(trigger());
    const listbox = await screen.findByRole('listbox');
    expect(screen.getByRole('option', { name: 'Light' })).toBeVisible();
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect((await audit(container)).violations).toEqual([]);
    // The popup is portalled outside the render container.
    expect((await audit(listbox)).violations).toEqual([]);
  },
  'select.keyboard-selection': async () => {
    render(<ThemeSelect />);
    await openWithKeyboard();
    expect(document.activeElement).toHaveTextContent('System');
    await press('l');
    expect(document.activeElement).toHaveTextContent('Light');
    await press('Enter');
    await expectClosedWithFocus();
    expect(trigger()).toHaveTextContent('Light');
  },
  'select.escape-focus-return': async () => {
    render(<ThemeSelect defaultValue="system" />);
    await openWithKeyboard();
    await press('ArrowDown');
    await press('ArrowDown');
    expect(document.activeElement).toHaveTextContent('Light');
    await press('Escape');
    await expectClosedWithFocus();
    expect(trigger()).toHaveTextContent('System');
    expect(formValue()).toEqual(['theme', 'system']);
  },
  'select.value-form': async () => {
    const changes: (string | null)[] = [];
    const view = render(
      <ThemeSelect value={null} onValueChange={(v) => changes.push(v)} />,
    );
    expect(trigger()).toHaveTextContent('Choose a theme');
    expect(formValue()).toEqual(['theme', '']);
    await openWithKeyboard();
    await press('ArrowDown');
    expect(document.activeElement).toHaveTextContent('Dark');
    expect(document.activeElement).toHaveAttribute('aria-disabled', 'true');
    await press('Enter');
    expect(changes).toEqual([]);
    await press('l');
    await press('Enter');
    expect(changes).toEqual(['light']);
    // Controlled: the trigger follows the value prop.
    expect(trigger()).toHaveTextContent('Choose a theme');
    view.rerender(<ThemeSelect value="light" />);
    expect(trigger()).toHaveTextContent('Light');
    expect(formValue()).toEqual(['theme', 'light']);
  },
};
