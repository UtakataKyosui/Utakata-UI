import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Field } from '../components/Field.js';
import {
  NativeSelect,
  type NativeSelectProps,
} from '../components/NativeSelect.js';
import {
  nativeSelectManifest,
  nativeSelectQualityRules,
} from '../metadata/components/NativeSelect.js';
import { nativeSelectChecks } from './quality/NativeSelect.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Type fixtures checked by pnpm typecheck.
const validProps: NativeSelectProps = { size: 'lg', required: true };
// @ts-expect-error The listbox size attribute is replaced by the visual size.
const listboxSize: NativeSelectProps = { size: 4 };
// @ts-expect-error Multiple selection is out of scope.
const multiple: NativeSelectProps = { multiple: true };
void [validProps, listboxSize, multiple];

function Controlled() {
  const [value, setValue] = useState('b');
  return (
    <NativeSelect
      aria-label="Letter"
      value={value}
      onChange={(event) => setValue(event.currentTarget.value)}
      size="sm"
    >
      <option value="a">A</option>
      <option value="b">B</option>
    </NativeSelect>
  );
}

describe('NativeSelect', () => {
  it('renders one select with defaults, className and ref', () => {
    const ref = createRef<HTMLSelectElement>();
    const { container } = render(
      <NativeSelect ref={ref} aria-label="Size" className="custom">
        <option value="s">Small</option>
      </NativeSelect>,
    );
    const select = screen.getByRole('combobox', { name: 'Size' });
    expect(container.querySelectorAll('select')).toHaveLength(1);
    expect(select).toHaveClass('ui-native-select__control', 'custom');
    expect(select).not.toHaveAttribute('size');
    expect(select.parentElement).toHaveClass(
      'ui-native-select',
      'ui-native-select--md',
    );
    expect(ref.current).toBe(select);
    ref.current?.focus();
    expect(select).toHaveFocus();
    expect(nativeSelectManifest.props.size.default).toBe('md');
  });

  it('supports controlled values', () => {
    render(<Controlled />);
    const select = screen.getByRole('combobox', { name: 'Letter' });
    expect(select).toHaveValue('b');
    fireEvent.change(select, { target: { value: 'a' } });
    expect(select).toHaveValue('a');
  });

  it('marks required selects and keeps the form attribute', () => {
    render(
      <NativeSelect aria-label="Plan" required form="signup">
        <option value="">Choose a plan</option>
        <option value="free">Free</option>
      </NativeSelect>,
    );
    const select = screen.getByRole('combobox', { name: 'Plan' });
    expect(select).toBeRequired();
    expect(select).toHaveAttribute('form', 'signup');
  });

  it('satisfies automated quality rules', async () => {
    await expectAutomatedQuality(nativeSelectQualityRules, nativeSelectChecks);
  });

  it('warns without a name source and stays quiet with a Field label', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const view = render(
      <Field.Root>
        <Field.Label>Country</Field.Label>
        <NativeSelect>
          <option value="jp">Japan</option>
        </NativeSelect>
      </Field.Root>,
    );
    await settle();
    expect(warn).not.toHaveBeenCalled();
    view.unmount();
    render(
      <NativeSelect>
        <option value="jp">Japan</option>
      </NativeSelect>,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] NativeSelect: No accessible name source',
        ),
      ),
    );
  });
});
