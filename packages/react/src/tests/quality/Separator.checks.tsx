import { render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { Separator } from '../../components/Separator.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

export const separatorChecks: Record<string, QualityCheck> = {
  'separator.semantics': async () => {
    const { container } = render(
      <>
        <p>Profile</p>
        <Separator data-testid="decorative" />
        <Separator decorative={false} />
        <Separator decorative={false} orientation="vertical" />
        <p>Settings</p>
      </>,
    );
    expect(screen.getByTestId('decorative')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    const [horizontal, vertical] = screen.getAllByRole('separator');
    expect(horizontal).not.toHaveAttribute('aria-orientation');
    expect(vertical).toHaveAttribute('aria-orientation', 'vertical');
    expect((await audit(container)).violations).toEqual([]);
  },
  'separator.not-interactive': () => {
    const { container } = render(
      <>
        <Separator />
        <Separator decorative={false} orientation="vertical" />
      </>,
    );
    for (const element of container.querySelectorAll<HTMLElement>(
      '.ui-separator',
    )) {
      expect(element).not.toHaveAttribute('tabindex');
      element.focus();
      expect(element).not.toHaveFocus();
    }
  },
};
