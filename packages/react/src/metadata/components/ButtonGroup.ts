import type { QualityRule } from '../quality.js';

export const buttonGroupQualityRules = [
  {
    id: 'button-group.name',
    requirement:
      'ButtonGroup exposes role="group" with an accessible name from aria-label or aria-labelledby.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Pass aria-label or aria-labelledby (required by types) that describes the related actions.',
  },
  {
    id: 'button-group.button-behavior',
    requirement:
      'Grouped Buttons keep their click, disabled, type, variant, size and ref behavior, and every enabled Button stays in the normal Tab order without roving focus.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Pass existing Button elements as children; do not add tabIndex, toolbar or radiogroup behavior to the group.',
  },
  {
    id: 'button-group.keyboard',
    requirement:
      'In a real browser, Tab and Shift+Tab move through each enabled Button in visual order and the focus ring of each Button is not covered by its neighbors.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Verify with real keyboard input in each supported browser; record results in the evidence log.',
  },
  {
    id: 'button-group.visual',
    requirement:
      'Joined borders and end radii look correct for horizontal and vertical groups, one or many Buttons and mixed variants, in every theme, at 200% zoom, at 320 CSS px width and in forced colors.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Inspect the rendered group in a real browser; wrap long groups or switch to vertical orientation at narrow widths.',
  },
] as const satisfies readonly QualityRule[];

export const buttonGroupManifest = {
  qualityRules: buttonGroupQualityRules,
  description:
    'A named group that visually joins related Buttons horizontally or vertically.',
  props: {
    orientation: { type: 'horizontal | vertical', default: 'horizontal' },
    'aria-label': {
      type: 'string; this or aria-labelledby is required',
      default: undefined,
    },
    'aria-labelledby': {
      type: 'string; this or aria-label is required',
      default: undefined,
    },
  },
  orientations: ['horizontal', 'vertical'],
  composition:
    'ButtonGroup (native div props) contains existing Button elements and only joins adjacent borders and end radii with CSS. Buttons keep their own variant, size, disabled and type, and each enabled Button is a separate Tab stop. A horizontal group wraps at narrow widths. Use ToggleGroup for pressed options.',
  avoid: [
    'Do not use ButtonGroup for a set of pressed options; use ToggleGroup.',
    'Do not add toolbar arrow-key navigation or roving tabIndex.',
    'Do not group unrelated actions only for appearance.',
  ],
  example:
    '<ButtonGroup aria-label="履歴"><Button variant="outline">戻す</Button><Button variant="outline">やり直す</Button></ButtonGroup>',
  accessibility:
    'Static div with role="group"; the name is required at typecheck time. No client code or development diagnostics, so verify computed names with axe. Grouped Buttons keep their native semantics, Button diagnostics and focus order; the focused Button is raised so its ring is not hidden.',
} as const;

export type ButtonGroupOrientation =
  (typeof buttonGroupManifest.orientations)[number];
