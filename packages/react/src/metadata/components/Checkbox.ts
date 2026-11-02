import type { QualityRule } from '../quality.js';

export const checkboxQualityRules = [
  {
    id: 'checkbox.name-state',
    requirement:
      'The checkbox exposes role="checkbox", a name from Field.Label or a wrapping label, and aria-checked true, false or mixed matching its state.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Compose Checkbox.Root inside Field.Root with Field.Label, or wrap it in a label element; use indeterminate for the mixed state.',
  },
  {
    id: 'checkbox.keyboard-pointer',
    requirement:
      'Space toggles the checkbox once, clicking the label toggles it, and a disabled checkbox neither changes nor notifies.',
    verification: 'automated',
    severity: 'error',
    remediation: 'Preserve Base UI Checkbox keyboard and disabled behavior.',
  },
  {
    id: 'checkbox.form',
    requirement:
      'A checked checkbox submits its name and value with the form, controlled updates are reflected, and form reset restores defaultChecked.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Use the Base UI hidden input via name/value; do not add another hidden input.',
  },
  {
    id: 'checkbox.visual-state',
    requirement:
      'Unchecked, checked, indeterminate, focus, disabled and invalid states differ by shape as well as color in every theme and forced colors, and the target is at least 24×24 CSS px.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Inspect each state in light and dark themes, forced colors and at 200% zoom in a real browser.',
  },
] as const satisfies readonly QualityRule[];

export const checkboxManifest = {
  qualityRules: checkboxQualityRules,
  description:
    'A checkbox with checked, unchecked and indeterminate states built on Base UI Checkbox.',
  parts: ['Root', 'Indicator'],
  partProps: {
    Root: 'Base UI CheckboxRootProps (checked, defaultChecked, onCheckedChange, indeterminate, disabled, readOnly, required, name, value)',
    Indicator:
      'Base UI CheckboxIndicatorProps; draws a check or dash mark when empty',
  },
  defaults: {
    defaultChecked: false,
    indeterminate: false,
    disabled: false,
  },
  composition:
    'Checkbox.Root contains Checkbox.Indicator. Name it with Field.Label inside Field.Root or with a wrapping label element. An empty Indicator draws a check mark when checked and a dash when indeterminate; custom children replace both marks. Base UI submits name/value through its own hidden input. Development diagnostics warn when no name source is found.',
  avoid: [
    'Do not add a second native or hidden checkbox input.',
    'Do not pass a single check glyph as Indicator children when indeterminate is used; it would hide the mixed state.',
    'Do not change the label text when the state changes.',
  ],
  example:
    '<Field.Root name="terms"><Checkbox.Root value="accepted"><Checkbox.Indicator /></Checkbox.Root><Field.Label>Accept the terms</Field.Label></Field.Root>',
  accessibility:
    'Base UI exposes role="checkbox", aria-checked (including mixed) and Space toggling. State is shown by a mark shape, not color alone. Consumers provide the visible label and any group context.',
} as const;
