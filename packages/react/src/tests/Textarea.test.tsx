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
import { Textarea, type TextareaProps } from '../components/Textarea.js';
import {
  textareaManifest,
  textareaQualityRules,
} from '../metadata/components/Textarea.js';
import { textareaChecks } from './quality/Textarea.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Type fixtures checked by pnpm typecheck.
const validProps: TextareaProps = { size: 'sm', rows: 4, maxLength: 500 };
// @ts-expect-error Sizes are limited to the manifest.
const unsupportedSize: TextareaProps = { size: 'xl' };
// @ts-expect-error className must be a string.
const functionClass: TextareaProps = { className: () => 'x' };
void [validProps, unsupportedSize, functionClass];

function Controlled() {
  const [value, setValue] = useState('a');
  return (
    <Textarea
      aria-label="Controlled"
      value={value}
      onChange={(event) => setValue(event.currentTarget.value)}
    />
  );
}

describe('Textarea', () => {
  it('renders one textarea with defaults, className and ref', () => {
    const ref = createRef<HTMLTextAreaElement>();
    const { container } = render(
      <Textarea ref={ref} aria-label="Notes" className="custom" />,
    );
    const textarea = screen.getByRole('textbox', { name: 'Notes' });
    expect(container.querySelectorAll('textarea')).toHaveLength(1);
    expect(textarea).toHaveAttribute('rows', '3');
    expect(textarea).toHaveClass('ui-textarea', 'ui-textarea--md', 'custom');
    expect(ref.current).toBe(textarea);
    expect(textareaManifest.props.rows.default).toBe(3);
  });

  it('supports controlled and uncontrolled values', () => {
    render(
      <>
        <Controlled />
        <Textarea aria-label="Uncontrolled" defaultValue="start" size="lg" />
      </>,
    );
    const controlled = screen.getByRole('textbox', { name: 'Controlled' });
    fireEvent.change(controlled, { target: { value: 'a\nb' } });
    expect(controlled).toHaveValue('a\nb');
    const uncontrolled = screen.getByRole('textbox', { name: 'Uncontrolled' });
    expect(uncontrolled).toHaveValue('start');
    expect(uncontrolled).toHaveClass('ui-textarea--lg');
  });

  it('marks required textareas and submits with the field name', () => {
    render(
      <Field.Root name="bio">
        <Field.Label>Bio</Field.Label>
        <Textarea required rows={6} />
      </Field.Root>,
    );
    const textarea = screen.getByRole('textbox', { name: 'Bio' });
    expect(textarea).toBeRequired();
    expect(textarea).toHaveAttribute('name', 'bio');
    expect(textarea).toHaveAttribute('rows', '6');
  });

  it('satisfies automated quality rules', async () => {
    await expectAutomatedQuality(textareaQualityRules, textareaChecks);
  });

  it('warns without a name source and stays quiet with a Field label', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const view = render(
      <Field.Root>
        <Field.Label>Notes</Field.Label>
        <Textarea />
      </Field.Root>,
    );
    await settle();
    expect(warn).not.toHaveBeenCalled();
    view.unmount();
    render(<Textarea />);
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] Textarea: No accessible name source',
        ),
      ),
    );
  });
});
