import { render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { Alert } from '../../components/Alert.js';
import { alertManifest } from '../../metadata/components/Alert.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

export const alertChecks: Record<string, QualityCheck> = {
  'alert.role': () => {
    const { container } = render(
      <>
        {alertManifest.variants.map((variant) => (
          <Alert.Root key={variant} variant={variant}>
            <Alert.Title>{variant} message</Alert.Title>
          </Alert.Root>
        ))}
        <Alert.Root variant="destructive" role="alert">
          <Alert.Title>Could not save</Alert.Title>
        </Alert.Root>
        <Alert.Root role="status">
          <Alert.Title>Draft saved</Alert.Title>
        </Alert.Root>
      </>,
    );
    const alerts = container.querySelectorAll<HTMLElement>('.ui-alert');
    expect(alerts).toHaveLength(alertManifest.variants.length + 2);
    for (const variant of alertManifest.variants) {
      const root = screen.getByText(`${variant} message`).parentElement;
      expect(root).not.toHaveAttribute('role');
      expect(root).not.toHaveAttribute('tabindex');
    }
    expect(screen.getByRole('alert')).toHaveTextContent('Could not save');
    expect(screen.getByRole('status')).toHaveTextContent('Draft saved');
    expect(document.activeElement).toBe(document.body);
  },
  'alert.text-meaning': async () => {
    const { container } = render(
      <Alert.Root variant="destructive">
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="7" fill="currentColor" />
        </svg>
        <Alert.Title>Error: payment failed</Alert.Title>
        <Alert.Description>
          Check the card number and try again.
        </Alert.Description>
      </Alert.Root>,
    );
    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(container.querySelector('.ui-alert__title')).toHaveTextContent(
      'Error: payment failed',
    );
    expect((await audit(container)).violations).toEqual([]);
  },
};
