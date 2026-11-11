import { render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { expect } from 'vitest';
import { ScrollArea } from '../../components/ScrollArea.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

export const scrollAreaChecks: Record<string, QualityCheck> = {
  'scroll-area.named-region': async () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <>
        <h2 id="history-title">History</h2>
        <ScrollArea
          aria-labelledby="history-title"
          ref={ref}
          className="history"
          p="20"
        >
          <a href="/history/oldest">Oldest entry</a>
        </ScrollArea>
      </>,
    );
    const region = screen.getByRole('region', { name: 'History' });
    expect(ref.current).toBe(region);
    expect(region).toHaveClass('ui-scroll-area', 'history', '-p:20');
    expect(region).not.toHaveAttribute('p');
    expect(region).toHaveAttribute('tabindex', '0');
    expect(
      within(region).getByRole('link', { name: 'Oldest entry' }),
    ).toHaveAttribute('href', '/history/oldest');
    expect((await audit(container)).violations).toEqual([]);
  },
};
