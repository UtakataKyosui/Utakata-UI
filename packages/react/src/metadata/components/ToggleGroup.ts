import type { QualityRule } from '../quality.js';

export const toggleGroupQualityRules = [
  {
    id: 'toggle-group.selection',
    requirement:
      'Without multiple at most one item is pressed and pressing it again clears the selection; with multiple each item toggles independently. value, defaultValue and onValueChange use string arrays in both modes.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Let Base UI ToggleGroup own the pressed state through value/defaultValue and multiple; do not set pressed on items.',
  },
  {
    id: 'toggle-group.names',
    requirement:
      'The group exposes role="group" with an accessible name, and every item is a button with its own name and aria-pressed.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Name the root with aria-label or aria-labelledby, and give each item visible text or iconOnly with aria-label.',
  },
  {
    id: 'toggle-group.roving-focus',
    requirement:
      'The group has a single Tab stop: exactly one enabled item has tabindex="0" and the others have tabindex="-1"; disabled items cannot be focused.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Keep Base UI composite focus management; do not set tabIndex on items.',
  },
  {
    id: 'toggle-group.disabled-no-submit',
    requirement:
      'Disabled items and a disabled group do not change or notify, and items inside a form never submit it.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Use the disabled prop on Root or Item and keep the type="button" rendered by Toggle; use Button for submit actions.',
  },
  {
    id: 'toggle-group.keyboard',
    requirement:
      'In a real browser, arrow keys matching the orientation move focus between enabled items (skipping disabled ones), Home and End move to the ends, Space and Enter toggle the focused item, and Tab leaves the group.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Preserve Base UI ToggleGroup composite focus and keyboard handling for both orientations; do not add custom key handlers or tabindex values.',
  },
  {
    id: 'toggle-group.visual-states',
    requirement:
      'In a real browser pressed items differ from unpressed ones by an inset outline rather than color alone in both orientations, item text keeps at least 4.5:1 contrast, and in forced colors pressed items use the Highlight and HighlightText system colors and the focused item keeps a system-color outline of at least 2px.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the pressed inset outline, the forced-colors pressed colors and the outline fallback for focused items.',
  },
  {
    id: 'toggle-group.zoom-theme',
    requirement:
      'At real 200% browser zoom and in real high-contrast modes pressed, unpressed, focus and disabled items stay distinguishable in both orientations.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check browser zoom, dark theme and high-contrast modes in a real browser; leave unverified until performed.',
  },
] as const satisfies readonly QualityRule[];

export const toggleGroupManifest = {
  qualityRules: toggleGroupQualityRules,
  description:
    'A named group of Toggle items with single or multiple pressed values, built on Base UI ToggleGroup.',
  parts: ['Root', 'Item'],
  partProps: {
    Root: 'Base UI ToggleGroupProps (value, defaultValue, onValueChange, multiple, disabled, loopFocus) + orientation; aria-label or aria-labelledby required',
    Item: 'Toggle props (variant, size, iconOnly, disabled) + required value; pressed props are owned by Root',
  },
  props: {
    value: { type: 'string[]; controlled', default: undefined },
    defaultValue: { type: 'string[]', default: undefined },
    onValueChange: {
      type: '(value: string[], eventDetails) => void',
      default: undefined,
    },
    multiple: { type: 'boolean', default: false },
    orientation: { type: 'horizontal | vertical', default: 'horizontal' },
    disabled: { type: 'boolean', default: false },
    loopFocus: { type: 'boolean', default: true },
  },
  defaults: {
    multiple: false,
    orientation: 'horizontal',
    disabled: false,
    loopFocus: true,
  },
  orientations: ['horizontal', 'vertical'],
  composition:
    'ToggleGroup.Root (named with aria-label or aria-labelledby) contains ToggleGroup.Item elements with unique value strings. The group is a set of toggle buttons that may all be unpressed; use RadioGroup when exactly one option must always be chosen. multiple enables independent toggles. orientation sets the layout and the arrow keys Base UI uses for roving focus. Items render type="button" and are not submitted with forms.',
  avoid: [
    'Do not use ToggleGroup for a required single choice; use RadioGroup.',
    'Do not set pressed or defaultPressed on items; the value belongs to Root.',
    'Do not add hidden inputs for form submission or required validation; store the value yourself.',
    'Do not change item labels when pressed; aria-pressed conveys the state.',
  ],
  example:
    '<ToggleGroup.Root multiple aria-label="書式" defaultValue={["bold"]}><ToggleGroup.Item value="bold" variant="outline">太字</ToggleGroup.Item><ToggleGroup.Item value="italic" variant="outline">斜体</ToggleGroup.Item></ToggleGroup.Root>',
  accessibility:
    'Base UI renders role="group" with roving focus and arrow-key movement; items are native buttons with aria-pressed. The group name is required at typecheck time and development diagnostics warn about empty or dangling names on Root and on each item. Toolbar behavior and required-selection validation are not provided.',
} as const;

export type ToggleGroupOrientation =
  (typeof toggleGroupManifest.orientations)[number];
