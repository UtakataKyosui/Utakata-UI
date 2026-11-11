import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Carousel } from '../components/Carousel.js';
import { carouselQualityRules } from '../metadata/components/Carousel.js';
import {
  carouselChecks,
  expectCarouselStructure,
  carouselLabels as labels,
  carouselSlides as slides,
} from './quality/Carousel.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

afterEach(cleanup);

describe('Carousel', () => {
  it('checks named controls, slide isolation and the position status', async () => {
    await expectAutomatedQuality(carouselQualityRules, carouselChecks);
  });

  it('warns about a missing region or viewport name', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      render(
        <Carousel
          slides={slides}
          labels={{ ...labels, name: '', viewport: '' }}
        />,
      );
      await settle(0);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Set labels.name'),
      );
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Set labels.viewport'),
      );
    } finally {
      warn.mockRestore();
    }
  });

  it('detects an inactive slide exposed to assistive technology', () => {
    render(<Carousel slides={slides} labels={labels} />);
    const viewport = screen.getByRole('group', { name: labels.viewport });
    viewport.children[1]?.removeAttribute('aria-hidden');
    viewport.children[1]?.removeAttribute('inert');
    expect(expectCarouselStructure).toThrow();
  });

  it('retains the current ID on reorder and returns to the first slide after removal', () => {
    const { rerender } = render(<Carousel slides={slides} labels={labels} />);
    const viewport = screen.getByRole('group', { name: labels.viewport });
    Object.defineProperty(viewport, 'scrollBy', { value: vi.fn() });
    fireEvent.click(screen.getByRole('button', { name: labels.next }));
    expect(screen.getByRole('link', { name: 'Article two' })).toBeVisible();
    rerender(
      <Carousel slides={[slides[1], slides[0], slides[2]]} labels={labels} />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('1 of 3');
    expect(screen.getByRole('link', { name: 'Article two' })).toBeVisible();
    rerender(<Carousel slides={[slides[2]]} labels={labels} />);
    expect(screen.getByRole('status')).toHaveTextContent('1 of 1');
    expect(screen.getByRole('link', { name: 'Article three' })).toBeVisible();
    for (const name of [labels.previous, labels.next]) {
      expect(screen.getByRole('button', { name })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    }
    rerender(<Carousel slides={[]} labels={labels} />);
    expect(screen.queryByRole('region')).toBeNull();
  });
});
