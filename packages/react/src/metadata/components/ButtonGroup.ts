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
      'In a real browser, Tab and Shift+Tab move through each enabled Button of both orientations in visual order, skipping disabled ones, and the focused Button is stacked above its neighbors so its focus ring is not covered.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the focus-visible stacking rule and do not add tabIndex, toolbar or radiogroup behavior to the group.',
  },
  {
    id: 'button-group.visual-layout',
    requirement:
      'In a real browser joined Buttons share one border and only the outer ends of horizontal and vertical groups keep rounded corners, long horizontal groups wrap without clipping or overflow at 320 CSS px and 200% text size, and in forced colors the focused Button keeps a system-color outline of at least 2px.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the joined border radii and overlap, group wrapping and the forced-colors outline; switch to vertical orientation at narrow widths when needed.',
  },
  {
    id: 'button-group.zoom-theme',
    requirement:
      'Joined borders and end radii look correct for mixed variants in every theme at real 200% browser zoom and in real high-contrast modes.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Inspect the rendered group in a real browser; leave unverified until performed.',
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
