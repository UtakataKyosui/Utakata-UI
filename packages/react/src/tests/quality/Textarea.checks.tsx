import { fireEvent, render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { Field } from '../../components/Field.js';
import { Textarea } from '../../components/Textarea.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';
import { expectDisabledAndReadOnlyTextboxes } from '../quality-helpers.js';

export const textareaChecks: Record<string, QualityCheck> = {
  'textarea.field-association': async () => {
    const { container } = render(
      <Field.Root name="notes" invalid>
        <Field.Label>Notes</Field.Label>
        <Textarea />
        <Field.Description>Up to 500 characters.</Field.Description>
        <Field.Error match>Enter a note.</Field.Error>
      </Field.Root>,
    );
    expect(container.querySelectorAll('textarea, input')).toHaveLength(1);
    const textarea = screen.getByRole('textbox', { name: 'Notes' });
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAccessibleDescription(
      'Up to 500 characters. Enter a note.',
    );
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect((screen.getByText('Notes') as HTMLLabelElement).control).toBe(
      textarea,
    );
    expect((await audit(container)).violations).toEqual([]);
  },
  'textarea.value-form': () => {
    const values: string[] = [];
    const { container } = render(
      <form>
        <Field.Root name="notes">
          <Field.Label>Notes</Field.Label>
          <Textarea
            maxLength={500}
            onChange={(event) => values.push(event.currentTarget.value)}
          />
        </Field.Root>
      </form>,
    );
    const textarea = screen.getByRole('textbox', { name: 'Notes' });
    expect(textarea).toHaveAttribute('maxlength', '500');
    fireEvent.change(textarea, { target: { value: 'line 1\nline 2' } });
    expect(values).toEqual(['line 1\nline 2']);
    const form = container.querySelector('form') as HTMLFormElement;
    expect(new FormData(form).get('notes')).toBe('line 1\nline 2');
  },
  'textarea.disabled-readonly': () => {
    const { container } = render(
      <form>
        <Textarea aria-label="Disabled" name="d" disabled defaultValue="x" />
        <Textarea
          aria-label="Read only"
          name="r"
          readOnly
          defaultValue="kept"
        />
      </form>,
    );
    expectDisabledAndReadOnlyTextboxes();
    const data = new FormData(
      container.querySelector('form') as HTMLFormElement,
    );
    expect([...data.keys()]).toEqual(['r']);
  },
};
