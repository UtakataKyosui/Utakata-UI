import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { expect } from 'vitest';
import { Field } from '../../components/Field.js';
import { Input } from '../../components/Input.js';
import { InputGroup } from '../../components/InputGroup.js';
import { Textarea } from '../../components/Textarea.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

const searchIcon = (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
    <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" />
  </svg>
);

export const inputGroupChecks: Record<string, QualityCheck> = {
  'input-group.single-control': async () => {
    const values: string[] = [];
    const inputRef = createRef<HTMLInputElement>();
    const textareaRef = createRef<HTMLTextAreaElement>();
    const { container } = render(
      <>
        <Field.Root name="query">
          <Field.Label>Search</Field.Label>
          <InputGroup.Root>
            <InputGroup.Addon>{searchIcon}</InputGroup.Addon>
            <Input
              ref={inputRef}
              onChange={(event) => values.push(event.currentTarget.value)}
            />
          </InputGroup.Root>
          <Field.Description>Search by title.</Field.Description>
        </Field.Root>
        <Field.Root name="message">
          <Field.Label>Message</Field.Label>
          <InputGroup.Root>
            <Textarea ref={textareaRef} />
            <InputGroup.Addon align="block-end">
              <InputGroup.Text>Markdown supported</InputGroup.Text>
            </InputGroup.Addon>
          </InputGroup.Root>
        </Field.Root>
      </>,
    );
    expect(container.querySelectorAll('input, textarea')).toHaveLength(2);
    const input = screen.getByRole('textbox', { name: 'Search' });
    expect(input).toHaveAccessibleDescription('Search by title.');
    expect(inputRef.current).toBe(input);
    fireEvent.change(input, { target: { value: 'utakata' } });
    expect(values).toEqual(['utakata']);
    expect(textareaRef.current).toBe(
      screen.getByRole('textbox', { name: 'Message' }),
    );
    for (const root of container.querySelectorAll('.ui-input-group'))
      expect(root).not.toHaveAttribute('role');
    expect((await audit(container)).violations).toEqual([]);
  },
  'input-group.addon-content': async () => {
    const { container } = render(
      <Field.Root name="weight">
        <Field.Label>Weight</Field.Label>
        <InputGroup.Root>
          <InputGroup.Addon>{searchIcon}</InputGroup.Addon>
          <Input inputMode="decimal" aria-describedby="weight-unit" />
          <InputGroup.Addon align="inline-end">
            <InputGroup.Text id="weight-unit">kilograms</InputGroup.Text>
          </InputGroup.Addon>
        </InputGroup.Root>
      </Field.Root>,
    );
    const input = screen.getByRole('textbox', { name: 'Weight' });
    expect(input).toHaveAccessibleDescription('kilograms');
    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect((await audit(container)).violations).toEqual([]);
  },
  'input-group.button': async () => {
    let submits = 0;
    let searches = 0;
    const { container } = render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submits++;
        }}
      >
        <Field.Root name="query">
          <Field.Label>Query</Field.Label>
          <InputGroup.Root>
            <Input />
            <InputGroup.Addon align="inline-end">
              <InputGroup.Button onClick={() => searches++}>
                Search
              </InputGroup.Button>
              <InputGroup.Button iconOnly aria-label="Clear">
                <span aria-hidden="true">×</span>
              </InputGroup.Button>
            </InputGroup.Addon>
          </InputGroup.Root>
        </Field.Root>
      </form>,
    );
    const input = screen.getByRole('textbox', { name: 'Query' });
    const search = screen.getByRole('button', { name: 'Search' });
    expect(screen.getByRole('button', { name: 'Clear' })).toHaveAttribute(
      'type',
      'button',
    );
    expect(search).toHaveAttribute('type', 'button');
    expect(search).toHaveClass(
      'ui-button--ghost',
      'ui-button--sm',
      'ui-input-group__button',
    );
    expect(
      input.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(search.tabIndex).toBe(0);
    fireEvent.click(search);
    expect(searches).toBe(1);
    expect(submits).toBe(0);
    expect((await audit(container)).violations).toEqual([]);
  },
};
