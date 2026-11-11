import { render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import {
  Carousel,
  type CarouselLabels,
  type CarouselSlide,
} from '../../components/Carousel.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

export const carouselLabels: CarouselLabels = {
  name: 'Selected articles',
  roleDescription: 'carousel',
  viewport: 'Slides',
  previous: 'Previous slide',
  next: 'Next slide',
  position: (current, total) => `${current} of ${total}`,
};
export const carouselSlides = [
  { id: 'one', content: <a href="#one">Article one</a> },
  { id: 'two', content: <a href="#two">Article two</a> },
  { id: 'three', content: <a href="#three">Article three</a> },
] as const satisfies readonly CarouselSlide[];

export function expectCarouselStructure() {
  const region = screen.getByRole('region', { name: carouselLabels.name });
  expect(region).toHaveAttribute('aria-roledescription', 'carousel');
  const viewport = screen.getByRole('group', { name: carouselLabels.viewport });
  for (const name of [carouselLabels.previous, carouselLabels.next]) {
    expect(screen.getByRole('button', { name })).toHaveAttribute(
      'aria-controls',
      viewport.id,
    );
  }
  expect(screen.getByRole('status')).toHaveTextContent('1 of 3');
  expect(screen.getByRole('link', { name: 'Article one' })).toBeVisible();
  expect(screen.queryByRole('link', { name: 'Article two' })).toBeNull();
  expect(viewport.children[1]).toHaveAttribute('inert');
  expect(viewport.children[2]).toHaveAttribute('inert');
}

export const carouselChecks: Record<string, QualityCheck> = {
  'carousel.structure': async () => {
    const { container } = render(
      <Carousel slides={carouselSlides} labels={carouselLabels} />,
    );
    expectCarouselStructure();
    expect((await audit(container)).violations).toEqual([]);
  },
};
