import type { QualityRule } from '../quality.js';

export const badgeQualityRules = [
  {
    id: 'badge.static-text',
    requirement:
      'Badge renders a non-interactive span whose meaning is conveyed by its text, in every variant, and forwards ARIA attributes unchanged.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Write the status or category as visible text; do not rely on the variant color. Use Button or a link for actions.',
  },
  {
    id: 'badge.not-interactive',
    requirement:
      'Badge adds no link or button role, no tabindex and no click behavior.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Wrap the Badge in a Button or link when an action is needed instead of making the Badge itself focusable.',
  },
  {
    id: 'badge.visual-theme',
    requirement:
      'In a real browser, every variant keeps text contrast of at least 4.5:1 against its effective background for short, long and icon content in every supported theme and in forced colors, and long text wraps inside a 320 CSS px viewport and at 200% text size without clipping or horizontal overflow.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep wrapping enabled (overflow-wrap) and avoid fixed block sizes or overflow clipping; check --ui-badge-background and --ui-badge-color overrides for contrast.',
  },
  {
    id: 'badge.zoom-assistive',
    requirement:
      'At real 200% browser zoom the badge text stays legible, and assistive technology reads the badge text in document order.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check browser zoom and screen reader output in a real browser; leave unverified until performed.',
  },
] as const satisfies readonly QualityRule[];

export const badgeManifest = {
  qualityRules: badgeQualityRules,
  description:
    'A static label that shows a status or category with short text and an optional icon.',
  props: {
    variant: {
      type: 'solid | outline | subtle | destructive',
      default: 'subtle',
    },
    children: { type: 'ReactNode (required visible text)' },
  },
  variants: ['solid', 'outline', 'subtle', 'destructive'],
  composition:
    'Renders a span with text and optional decorative icons (aria-hidden="true"). Badge variants express status emphasis and are not Button variants; Badge has no action. Colors use --ui-badge-background, --ui-badge-color and --ui-badge-border.',
  avoid: [
    'Do not use Badge as a button, link, removable tag or notification counter.',
    'Do not convey status with the variant color alone; write the status in text.',
  ],
  example: '<Badge variant="outline">下書き</Badge>',
  accessibility:
    'A plain span with no role or tabindex; its text is read in document order. Decorative icons need aria-hidden="true". Consumers supply text that states the status without color.',
} as const;

export type BadgeVariant = (typeof badgeManifest.variants)[number];
