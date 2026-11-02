import type { QualityRule } from '../quality.js';

export const radioGroupQualityRules = [
  {
    id: 'radio-group.names',
    requirement:
      'The group exposes role="radiogroup" with a name and every item exposes role="radio" with its own name.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Name the group with aria-labelledby (pointing at visible text) or aria-label, and name each item with visible text content or aria-label; resolve development diagnostics.',
  },
  {
    id: 'radio-group.single-selection',
    requirement:
      'At most one item is checked; controlled and uncontrolled values, the unselected state and value changes are reported through Root.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Manage the value on RadioGroup.Root with value/defaultValue and onValueChange; do not track checked state per item.',
  },
  {
    id: 'radio-group.keyboard',
    requirement:
      'Tab enters and leaves the group once, and arrow keys move focus and selection between enabled items and skip disabled items in a real browser (Base UI composite behavior).',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Preserve Base UI RadioGroup keyboard handling; do not add custom key handlers or tabindex values.',
  },
  {
    id: 'radio-group.form',
    requirement:
      'A named group submits exactly one value and never a disabled item; form reset restores defaultValue, and controlled groups reset through their value.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Set name on RadioGroup.Root; Base UI renders the hidden radio inputs. Uncontrolled groups remount on form reset to restore defaultValue; reset a controlled value in the form onReset handler.',
  },
  {
    id: 'radio-group.real-keyboard-screen-reader',
    requirement:
      'Tab enters the group once, arrow keys move and select in a real browser, and screen readers announce group name, item name, checked state and position.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Record browser, assistive technology, commit and results; leave unverified until performed.',
  },
  {
    id: 'radio-group.visual-state',
    requirement:
      'Checked, focus and disabled states are distinguishable without color alone in every supported theme, forced colors, 200% zoom and both orientations, with targets of at least 24x24 CSS px.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check rendered contrast, the indicator dot, focus ring, reflow and forced colors in a real browser.',
  },
] as const satisfies readonly QualityRule[];

export const radioGroupManifest = {
  qualityRules: radioGroupQualityRules,
  description:
    'A single-selection group of radio items built on Base UI RadioGroup and Radio.',
  parts: ['Root', 'Item', 'Indicator'],
  partProps: {
    Root: 'Base UI RadioGroupProps (value, defaultValue, onValueChange, name, disabled, readOnly, required) + orientation',
    Item: 'Base UI RadioRootProps (value, disabled, readOnly)',
    Indicator:
      'Base UI RadioIndicatorProps; kept mounted by default and draws the circle, with a filled dot when checked',
  },
  props: {
    orientation: { type: 'vertical | horizontal', default: 'vertical' },
  },
  defaults: { orientation: 'vertical', disabled: false, required: false },
  orientations: ['vertical', 'horizontal'],
  composition:
    'RadioGroup.Root contains RadioGroup.Item elements, each with a RadioGroup.Indicator followed by the visible item text. Name the group with aria-labelledby pointing at a visible heading or text, or with aria-label, and name each item with its visible text or aria-label. Do not place RadioGroup inside Field.Root with Field.Label: Base UI then labels every item with the field label and the item names are lost. orientation only changes layout; arrow keys follow Base UI in both directions. Use Checkbox for multiple selection.',
  avoid: [
    'Do not manage checked state on each item; the value belongs to Root.',
    'Do not wrap RadioGroup in Field.Root with Field.Label; every radio would be named by the field label instead of its own text.',
    'Do not add native radio inputs; Base UI renders the hidden inputs used for form submission.',
    'Do not rely on the indicator color alone to show selection.',
    'Do not expect form.reset() to change a controlled value; reset it in onReset.',
  ],
  example:
    '<><Text id="plan-label">Plan</Text><RadioGroup.Root name="plan" defaultValue="free" aria-labelledby="plan-label"><RadioGroup.Item value="free"><RadioGroup.Indicator />Free</RadioGroup.Item><RadioGroup.Item value="pro"><RadioGroup.Indicator />Pro</RadioGroup.Item></RadioGroup.Root></>',
  accessibility:
    'Base UI exposes role="radiogroup" and role="radio" with aria-checked, roving focus and arrow-key selection. Group and item names cannot be enforced by types because they may come from external elements or item text; development diagnostics warn when no name source is found.',
} as const;

export type RadioGroupOrientation =
  (typeof radioGroupManifest.orientations)[number];
