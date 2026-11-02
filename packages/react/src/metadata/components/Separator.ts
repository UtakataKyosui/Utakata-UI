import type { QualityRule } from '../quality.js';

export const separatorQualityRules = [
  {
    id: 'separator.semantics',
    requirement:
      'Decorative separators are hidden from assistive technology; semantic separators expose role="separator" and their orientation.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Use decorative (default) for visual dividers and decorative={false} only when the separation is meaningful.',
  },
  {
    id: 'separator.not-interactive',
    requirement: 'Separators are not focusable and imply no resize action.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'The public props reject tabIndex and contentEditable. Do not add drag behavior; use a dedicated resizable component instead.',
  },
  {
    id: 'separator.visual-contrast',
    requirement:
      'A meaningful separator remains visible in every supported theme, forced colors and inside Flex layouts.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check rendered contrast, vertical stretching and forced colors in a real browser.',
  },
] as const satisfies readonly QualityRule[];

export const separatorManifest = {
  qualityRules: separatorQualityRules,
  description:
    'A horizontal or vertical divider that is decorative by default.',
  props: {
    orientation: { type: 'horizontal | vertical', default: 'horizontal' },
    decorative: {
      type: 'boolean; false exposes role="separator"',
      default: true,
    },
  },
  orientations: ['horizontal', 'vertical'],
  composition:
    'Place between content. A vertical separator stretches to the height of its Flex parent. Thickness and color use --ui-separator-size and --ui-separator-color. Implemented with HTML instead of Base UI Separator, which always exposes role="separator".',
  avoid: [
    'Do not make separators focusable or draggable.',
    'Do not use decorative={false} for purely visual spacing.',
  ],
  example:
    '<Flex style={{ alignItems: "center", gap: "0.75rem" }}><Text>Profile</Text><Separator orientation="vertical" /><Text>Settings</Text></Flex>',
  accessibility:
    'Decorative separators use aria-hidden. Semantic separators expose role="separator" and aria-orientation="vertical" when vertical.',
} as const;
