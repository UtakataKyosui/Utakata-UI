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
import { Input, type InputProps } from '../components/Input.js';
import {
  inputManifest,
  inputQualityRules,
} from '../metadata/components/Input.js';
import { inputChecks } from './quality/Input.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Type fixtures checked by pnpm typecheck.
const validProps: InputProps = { size: 'lg', type: 'email', readOnly: true };
// @ts-expect-error The visual size replaces the numeric native size attribute.
const nativeSize: InputProps = { size: 20 };
// @ts-expect-error Sizes are limited to the manifest.
const unsupportedSize: InputProps = { size: 'xl' };
// @ts-expect-error className must be a string.
const functionClass: InputProps = { className: () => 'x' };
void [validProps, nativeSize, unsupportedSize, functionClass];

function Controlled() {
  const [value, setValue] = useState('');
  return (
    <>
      <Input
        aria-label="Email"
        value={value}
        onValueChange={(next) => setValue(next.toUpperCase())}
      />
      <output>{value}</output>
    </>
  );
}

describe('Input', () => {
  it('renders one text input with defaults, className and ref', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} aria-label="Name" className="custom" />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveClass('ui-input', 'ui-input--md', 'custom');
    expect(ref.current).toBe(input);
    expect(inputManifest.props.size.default).toBe('md');
  });

  it('passes controlled values through as the consumer sets them', () => {
    render(<Controlled />);
    const input = screen.getByRole('textbox', { name: 'Email' });
    fireEvent.change(input, { target: { value: 'ab' } });
    expect(input).toHaveValue('AB');
    expect(screen.getByText('AB')).toBeInTheDocument();
  });

  it('preserves name, form, autoComplete, aria and size attributes', () => {
    render(
      <Input
        aria-label="Email"
        name="email"
        form="f"
        autoComplete="email"
        aria-describedby="hint"
        size="sm"
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveAttribute('form', 'f');
    expect(input).toHaveAttribute('autocomplete', 'email');
    expect(input).toHaveClass('ui-input--sm');
    expect(input).not.toHaveAttribute('size');
  });

  it('satisfies automated quality rules', async () => {
    await expectAutomatedQuality(inputQualityRules, inputChecks);
  });

  it('warns without a name source and stays quiet with a Field label', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const view = render(
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <Input />
      </Field.Root>,
    );
    await settle();
    expect(warn).not.toHaveBeenCalled();
    view.unmount();
    render(<Input />);
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] Input: No accessible name source',
        ),
      ),
    );
  });
});
