import type { QualityRule } from '../quality.js';

export const carouselQualityRules = [
  {
    id: 'carousel.structure',
    requirement:
      'Expose a named region, named controls and a single polite status. Keep inactive slides out of the accessibility tree and the Tab order.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Provide localized labels and position text. Use a unique, stable ID for every slide.',
    criteria: ['1.3.1', '2.4.3', '4.1.2', '4.1.3'],
  },
  {
    id: 'carousel.navigation',
    requirement:
      'Button activation, viewport keys and native touch scrolling update the visible position. Boundaries disable the relevant action without losing keyboard focus. Slide content receives its own keys.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the scroll-snap viewport, Base UI controls and the status tied to the same position.',
    criteria: ['2.1.1', '2.4.3', '2.5.1', '2.5.7', '4.1.3'],
  },
  {
    id: 'carousel.visual',
    requirement:
      'Controls wrap at 320 CSS pixels and meet the minimum target size. Position text remains readable, and keyboard focus remains visible in forced colors. The component does not autoplay or animate button navigation.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Preserve wrapping, theme tokens, focus styles and instant navigation.',
    criteria: ['1.4.3', '1.4.10', '2.4.7', '2.5.8'],
  },
  {
    id: 'carousel.platform',
    requirement:
      'Verify the position announcement, boundaries and reading order with screen readers, native swipes on physical devices and layout at real 200% zoom.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Record browser, device and assistive technology results; leave unperformed checks unverified.',
  },
] as const satisfies readonly QualityRule[];

export const carouselManifest = {
  qualityRules: carouselQualityRules,
  description:
    'A horizontal, one-slide-at-a-time carousel with native scroll snapping, previous and next buttons, and a localized position indicator.',
  props: {
    slides: { type: 'readonly CarouselSlide[] (required)' },
    labels: { type: 'CarouselLabels (required)' },
    dir: { type: 'ltr | rtl | auto', default: 'inherit' },
  },
  composition:
    'Pass slides with stable unique IDs and content, and localized labels for the region, role description, viewport, previous, next and position. The first slide is selected by default. An empty list renders nothing. The current slide keeps its ID when reordered; if it is removed, selection returns to the first slide.',
  avoid: [
    'Provide alt text and meaningful names for media and controls inside slides.',
    'Autoplay, wrapping and multiple visible slides are outside this component’s scope.',
  ],
  example:
    '<Carousel slides={[{ id: "news", content: "News" }]} labels={{ name: "Updates", roleDescription: "carousel", viewport: "Slides", previous: "Previous", next: "Next", position: (n, total) => n + " of " + total }} />',
  accessibility:
    'Use Tab to reach the controls and slide content. In the viewport, Arrow Left and Arrow Right follow its writing direction, and Home and End select the first or last slide. Native swipe is available on touch devices. Position is announced politely; inactive slides are inert. Localize labels and verify accessibility of consumer content.',
} as const;
