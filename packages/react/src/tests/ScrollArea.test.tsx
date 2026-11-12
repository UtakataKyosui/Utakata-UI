import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { ScrollArea } from '../components/ScrollArea.js';
import { scrollAreaQualityRules } from '../metadata/components/ScrollArea.js';
import { scrollAreaChecks } from './quality/ScrollArea.checks.js';
import { expectAutomatedQuality } from './quality-helpers.js';

afterEach(cleanup);

it('passes its named region rule and forwards the ref, styling and children', async () => {
  await expectAutomatedQuality(scrollAreaQualityRules, scrollAreaChecks);
});

it('uses a direct label when a visible heading is unavailable', () => {
  render(<ScrollArea aria-label="History">Previous entries</ScrollArea>);
  expect(screen.getByRole('region', { name: 'History' })).toHaveTextContent(
    'Previous entries',
  );
});

it('defaults to native scrollbar visibility and can hide it on request', () => {
  const { rerender } = render(<ScrollArea aria-label="History" />);
  const region = screen.getByRole('region', { name: 'History' });
  expect(region).toHaveAttribute('data-scrollbar', 'auto');

  rerender(<ScrollArea aria-label="History" scrollbar="hidden" />);
  expect(region).toHaveAttribute('data-scrollbar', 'hidden');
  expect(region).toHaveAttribute('tabindex', '0');
});
