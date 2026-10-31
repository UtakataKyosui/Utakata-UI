import { fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { Button } from './Button.js';
import { Dialog } from './Dialog.js';
import { Field } from './Field.js';

async function audit(element: HTMLElement) {
  // jsdom has no layout engine; verify contrast in a real browser manually.
  return axe.run(element, {
    rules: { 'color-contrast': { enabled: false } },
  });
}

describe('accessibility regression checks', () => {
  it('detects an unnamed button (audit harness control)', async () => {
    const { container } = render(<button type="button" />);
    const result = await audit(container);
    expect(result.violations.map(({ id }) => id)).toContain('button-name');
  });

  it.each(['solid', 'outline', 'ghost'] as const)(
    'audits the %s button',
    async (variant) => {
      const { container } = render(<Button variant={variant}>Save</Button>);
      expect((await audit(container)).violations).toEqual([]);
    },
  );

  it('preserves field naming and instructions', async () => {
    const { container } = render(
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <Field.Control type="email" required />
        <Field.Description>Enter your contact email.</Field.Description>
      </Field.Root>,
    );
    expect(
      screen.getByRole('textbox', { name: 'Email' }),
    ).toHaveAccessibleDescription('Enter your contact email.');
    expect((await audit(container)).violations).toEqual([]);
  });

  it('audits an open dialog including its portal', async () => {
    render(
      <Dialog.Root>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Dialog.Title>Settings</Dialog.Title>
            <Dialog.Description>Update preferences.</Dialog.Description>
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = await screen.findByRole('dialog', { name: 'Settings' });
    expect(dialog).toHaveAccessibleDescription('Update preferences.');
    expect((await audit(document.body)).violations).toEqual([]);
  });
});
