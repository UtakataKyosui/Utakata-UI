import { fireEvent, render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { Field } from '../../components/Field.js';
import { Input } from '../../components/Input.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';
import { expectDisabledAndReadOnlyTextboxes } from '../quality-helpers.js';

export const inputChecks: Record<string, QualityCheck> = {
  'input.field-association': async () => {
    const { container } = render(
      <Field.Root name="email">
        <Field.Label>Email</Field.Label>
        <Input type="email" />
        <Field.Description>Used for replies.</Field.Description>
      </Field.Root>,
    );
    expect(container.querySelectorAll('input')).toHaveLength(1);
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAccessibleDescription('Used for replies.');
    expect((screen.getByText('Email') as HTMLLabelElement).control).toBe(input);
    expect((await audit(container)).violations).toEqual([]);
  },
  'input.value-form': () => {
    const values: string[] = [];
    const { container } = render(
      <form>
        <Field.Root name="email">
          <Field.Label>Email</Field.Label>
          <Input
            type="email"
            onChange={(event) => values.push(event.currentTarget.value)}
            onValueChange={(value) => values.push(value)}
          />
        </Field.Root>
      </form>,
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: 'a@example.com' },
    });
    expect(values).toEqual(['a@example.com', 'a@example.com']);
    const form = container.querySelector('form') as HTMLFormElement;
    expect(new FormData(form).get('email')).toBe('a@example.com');
  },
  'input.disabled-readonly': () => {
    render(
      <>
        <Input aria-label="Disabled" disabled defaultValue="x" />
        <Input aria-label="Read only" readOnly defaultValue="kept" />
      </>,
    );
    expectDisabledAndReadOnlyTextboxes();
  },
  'input.invalid-state': async () => {
    const { container } = render(
      <Field.Root name="email" invalid>
        <Field.Label>Email</Field.Label>
        <Input type="email" defaultValue="x" />
        <Field.Error match>
          Enter an address such as name@example.com.
        </Field.Error>
      </Field.Root>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(
      'Enter an address such as name@example.com.',
    );
    expect((await audit(container)).violations).toEqual([]);
  },
};
