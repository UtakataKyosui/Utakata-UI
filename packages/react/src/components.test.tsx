import { fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button.js';
import { Dialog } from './Dialog.js';
import { Field } from './Field.js';
import { componentManifest } from './manifest.js';

describe('Button', () => {
  it('uses the manifest defaults and forwards native button behavior', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Button disabled ref={ref}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });

    expect(button).toBeDisabled();
    expect(button).toHaveClass('ui-button--solid', 'ui-button--md');
    expect(ref.current).toBe(button);
  });

  it('allows supported variants and sizes', () => {
    render(
      <Button size="lg" variant="outline">
        Cancel
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass(
      'ui-button--outline',
      'ui-button--lg',
    );
    expect(componentManifest.components.Button.variants).toContain('outline');
    expect(componentManifest.components.Button.sizes).toContain('lg');
  });
});

describe('Field', () => {
  it('associates the visible label and description with its control', () => {
    render(
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <Field.Control type="email" />
        <Field.Description>Used for account updates.</Field.Description>
      </Field.Root>,
    );

    expect(
      screen.getByRole('textbox', { name: 'Email' }),
    ).toHaveAccessibleDescription('Used for account updates.');
  });
});

describe('Dialog', () => {
  it('opens a labelled modal and closes through its trigger control', async () => {
    render(
      <Dialog.Root>
        <Dialog.Trigger>Open preferences</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Dialog.Title>Preferences</Dialog.Title>
            <Dialog.Description>Choose your settings.</Dialog.Description>
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open preferences' }));
    expect(
      await screen.findByRole('dialog', { name: 'Preferences' }),
    ).toBeVisible();
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription(
      'Choose your settings.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('accessibility', () => {
  it('has no axe violations for a labelled field and button', async () => {
    const { container } = render(
      <>
        <Field.Root>
          <Field.Label>Name</Field.Label>
          <Field.Control />
        </Field.Root>
        <Button>Submit</Button>
      </>,
    );

    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
