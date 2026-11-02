import { fireEvent, render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { Toggle } from '../../components/Toggle.js';
import { toggleManifest } from '../../metadata/components/Toggle.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

export const toggleChecks: Record<string, QualityCheck> = {
  'toggle.pressed-state': async () => {
    const changes: boolean[] = [];
    const { container } = render(
      <Toggle onPressedChange={(pressed) => changes.push(pressed)}>
        Bold
      </Toggle>,
    );
    const toggle = screen.getByRole('button', { name: 'Bold' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Bold' })).toBe(toggle);
    fireEvent.click(toggle);
    expect(changes).toEqual([true, false]);
    expect((await audit(container)).violations).toEqual([]);
  },
  'toggle.accessible-name': async () => {
    for (const variant of toggleManifest.variants) {
      for (const size of toggleManifest.sizes) {
        const { container, unmount } = render(
          <Toggle
            iconOnly
            aria-label="Italic"
            variant={variant}
            size={size}
            defaultPressed
          >
            <span aria-hidden="true">I</span>
          </Toggle>,
        );
        expect(
          screen.getByRole('button', { name: 'Italic', pressed: true }),
        ).toBeInTheDocument();
        expect((await audit(container)).violations).toEqual([]);
        unmount();
      }
    }
  },
  'toggle.disabled-no-submit': () => {
    let submits = 0;
    const changes: boolean[] = [];
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submits++;
        }}
      >
        <Toggle onPressedChange={(pressed) => changes.push(pressed)}>
          Bold
        </Toggle>
        <Toggle disabled onPressedChange={(pressed) => changes.push(pressed)}>
          Underline
        </Toggle>
      </form>,
    );
    const enabled = screen.getByRole('button', { name: 'Bold' });
    const disabled = screen.getByRole('button', { name: 'Underline' });
    expect(enabled).toHaveAttribute('type', 'button');
    fireEvent.click(enabled);
    fireEvent.click(disabled);
    expect(disabled).toBeDisabled();
    expect(disabled).toHaveAttribute('aria-pressed', 'false');
    expect(changes).toEqual([true]);
    expect(submits).toBe(0);
  },
};
