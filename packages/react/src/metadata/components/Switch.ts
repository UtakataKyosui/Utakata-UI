import type { QualityRule } from '../quality.js';

export const switchQualityRules = [
  {
    id: 'switch.name-state',
    requirement:
      'The switch exposes role="switch", a stable name from Field.Label or a wrapping label, and aria-checked synchronized with the thumb position.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Compose Switch.Root with Switch.Thumb inside Field.Root with Field.Label, or wrap it in a label; keep the label text unchanged across states.',
  },
  {
    id: 'switch.keyboard-pointer',
    requirement:
      'Space and click each toggle the switch once; disabled and read-only switches do not change.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Preserve Base UI Switch keyboard, disabled and readOnly behavior.',
  },
  {
    id: 'switch.form',
    requirement:
      'An on switch submits its name and value with the form, controlled updates are reflected, and form reset restores defaultChecked.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Use the Base UI hidden input via name/value; do not add another input.',
  },
  {
    id: 'switch.visual-state',
    requirement:
      'On and off differ by thumb position as well as color in every theme and forced colors, focus is visible, the target is at least 24×24 CSS px and motion is removed for reduced motion.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Inspect both states, focus, disabled, forced colors, reduced motion and 200% zoom in a real browser.',
  },
] as const satisfies readonly QualityRule[];

export const switchManifest = {
  qualityRules: switchQualityRules,
  description:
    'An on/off switch for settings that take effect immediately, built on Base UI Switch.',
  parts: ['Root', 'Thumb'],
  partProps: {
    Root: 'Base UI SwitchRootProps (checked, defaultChecked, onCheckedChange, disabled, readOnly, required, name, value)',
    Thumb: 'Base UI SwitchThumbProps',
  },
  defaults: { defaultChecked: false, disabled: false, readOnly: false },
  composition:
    'Switch.Root contains Switch.Thumb. Name it with Field.Label inside Field.Root or with a wrapping label element; keep the label text the same in both states. Base UI submits name/value through its own hidden input. Use Checkbox for choices confirmed by a submit button. Development diagnostics warn when no name source is found.',
  avoid: [
    'Do not change the label to describe the current state (for example "On"/"Off").',
    'Do not use Switch for a mixed or three-state value.',
  ],
  example:
    '<Field.Root name="notifications"><Switch.Root><Switch.Thumb /></Switch.Root><Field.Label>Enable notifications</Field.Label></Field.Root>',
  accessibility:
    'Base UI exposes role="switch", aria-checked and Space toggling. The thumb position communicates state in addition to color. Consumers provide a stable visible label.',
} as const;
