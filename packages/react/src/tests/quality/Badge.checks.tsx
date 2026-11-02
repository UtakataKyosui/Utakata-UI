import { render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { Badge } from '../../components/Badge.js';
import { badgeManifest } from '../../metadata/components/Badge.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

export const badgeChecks: Record<string, QualityCheck> = {
  'badge.static-text': async () => {
    const { container } = render(
      <p id="badge-help">
        Status:{' '}
        {badgeManifest.variants.map((variant) => (
          <Badge key={variant} variant={variant} aria-describedby="badge-help">
            {variant} status
          </Badge>
        ))}
      </p>,
    );
    for (const variant of badgeManifest.variants) {
      const badge = screen.getByText(`${variant} status`);
      expect(badge.tagName).toBe('SPAN');
      expect(badge).toHaveClass(`ui-badge--${variant}`);
      expect(badge).toHaveAttribute('aria-describedby', 'badge-help');
    }
    expect((await audit(container)).violations).toEqual([]);
  },
  'badge.not-interactive': () => {
    const { container } = render(
      <Badge variant="solid">
        <svg aria-hidden="true" width="8" height="8" />
        Published
      </Badge>,
    );
    const badge = container.querySelector<HTMLElement>('.ui-badge');
    expect(badge).not.toHaveAttribute('role');
    expect(badge).not.toHaveAttribute('tabindex');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    badge?.focus();
    expect(badge).not.toHaveFocus();
  },
};
