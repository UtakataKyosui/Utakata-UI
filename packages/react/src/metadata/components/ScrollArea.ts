import type { QualityRule } from '../quality.js';

export const scrollAreaQualityRules = [
  {
    id: 'scroll-area.named-region',
    requirement:
      'The scroll area exposes a named region, is in the normal Tab order, and preserves the semantics of its contents.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Provide a localized aria-label or reference a visible heading with aria-labelledby.',
  },
  {
    id: 'scroll-area.native-scroll',
    requirement:
      'Keyboard and touch input can scroll overflow; both axes remain available, and keyboard focus stays visible in supported themes and forced colors.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep native overflow and the focus outline. Avoid hiding scrollbars or intercepting scrolling keys and touch gestures.',
  },
  {
    id: 'scroll-area.platform',
    requirement:
      'On physical touch devices and in platform high-contrast modes, the content is reachable and the region and its focus are identifiable.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check native scrolling on a physical touch device and verify the region with a screen reader and platform high contrast.',
  },
] as const satisfies readonly QualityRule[];

export const scrollAreaManifest = {
  qualityRules: scrollAreaQualityRules,
  description: 'A named region with native horizontal and vertical scrolling.',
  props: {
    'aria-label': { type: 'string', default: null },
    'aria-labelledby': { type: 'string', default: null },
  },
  composition:
    'Give the region an accessible name and constrain its block size for vertical overflow. Content can overflow on either axis. Browser and operating system settings control scrollbar visibility.',
  avoid: [
    'Use Table.Container for a data table; wrapping it in ScrollArea creates nested scroll regions.',
    'Use document scrolling for primary page content. Custom scrollbars, virtualization, and scroll snapping are outside this API.',
  ],
  example:
    '<ScrollArea aria-label="更新履歴" style={{ maxBlockSize: "12rem" }}>…</ScrollArea>',
  accessibility:
    'The named section is always in the Tab order. Native scrolling preserves keyboard, touch, and scrollbar behavior. Use a visible heading as the accessible name when available.',
} as const;
