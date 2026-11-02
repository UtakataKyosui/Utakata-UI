import { fireEvent, render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { Kbd, KbdGroup } from '../../components/Kbd.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

export const kbdChecks: Record<string, QualityCheck> = {
  'kbd.semantics': async () => {
    const { container } = render(
      <KbdGroup aria-label="Control and K">
        <span aria-hidden="true">
          <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd>
        </span>
      </KbdGroup>,
    );
    expect(
      screen.getByRole('group', { name: 'Control and K' }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll('kbd')).toHaveLength(2);
    expect((await audit(container)).violations).toEqual([]);
  },
  'kbd.no-key-handling': () => {
    let received = 0;
    const { container } = render(
      <KbdGroup aria-label="Command and K">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>,
    );
    container.addEventListener('keydown', () => received++);
    for (const element of container.querySelectorAll('kbd, [role="group"]')) {
      expect(element).not.toHaveAttribute('tabindex');
      fireEvent.keyDown(element, { key: 'k', metaKey: true });
    }
    expect(received).toBe(3);
  },
};
