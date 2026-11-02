import type { QualityRule } from '../quality.js';

export const nativeSelectQualityRules = [
  {
    id: 'native-select.field-association',
    requirement:
      'Inside Field.Root, NativeSelect renders one native select named by Field.Label and described by Field.Description; the decorative arrow is hidden from assistive technology and ignores pointer input.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Use NativeSelect in place of Field.Control; outside Field, give the select a label element, aria-label or aria-labelledby.',
  },
  {
    id: 'native-select.value-form',
    requirement:
      'Options, optgroups and disabled options keep native behavior; the selected value reaches onChange, is submitted with the form and returns to defaultValue on form reset.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Pass option/optgroup children, value/defaultValue, name and form through to the native select.',
  },
  {
    id: 'native-select.disabled',
    requirement:
      'A disabled select cannot be focused or changed and is not submitted.',
    verification: 'automated',
    severity: 'error',
    remediation: 'Use the native disabled attribute or Field.Root disabled.',
  },
  {
    id: 'native-select.browser-behavior',
    requirement:
      'Chromium light/dark verifies every size, label/description/error associations, keyboard selection, disabled Tab exclusion, form values/reset, target dimensions and rendered text/border/focus/arrow contrast.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Run native-select.browser-behavior in the required browser gate and preserve native select behavior and visible styling.',
  },
  {
    id: 'native-select.platform-picker',
    requirement:
      'Verify platform option pickers, physical forced colors, actual text zoom and screen-reader announcements on supported Windows, macOS and iOS configurations.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Open the picker with keyboard and pointer on Windows, macOS and iOS browsers; inspect forced colors and zoom.',
  },
] as const satisfies readonly QualityRule[];

export const nativeSelectManifest = {
  qualityRules: nativeSelectQualityRules,
  description:
    'A styled native single-value select that integrates with Field labelling.',
  props: {
    size: { type: 'sm | md | lg', default: 'md' },
    disabled: { type: 'boolean', default: false },
    required: { type: 'boolean', default: false },
    children: { type: 'option and optgroup elements', default: undefined },
  },
  sizes: ['sm', 'md', 'lg'],
  composition:
    'Use NativeSelect instead of Field.Control inside Field.Root and pass option/optgroup elements as children. It renders Base UI Field.Control with a native select; className and ref target the select. size is the visual size; the native size and multiple attributes are not supported. Prefer NativeSelect for short, familiar option lists and forms that must work with platform pickers; use a custom Select for rich option content. Development diagnostics warn when no name source is found.',
  avoid: [
    'Do not use multiple or the listbox size attribute; they are out of scope.',
    'Do not use a placeholder option as the only label.',
  ],
  example:
    '<Field.Root name="country"><Field.Label>Country</Field.Label><NativeSelect defaultValue="jp"><option value="jp">Japan</option><option value="us">United States</option></NativeSelect></Field.Root>',
  accessibility:
    'Keeps native select semantics, platform pickers and keyboard selection. The arrow is decorative (aria-hidden, pointer-events: none). Consumers provide a visible label and meaningful option text.',
} as const;

export type NativeSelectSize = (typeof nativeSelectManifest.sizes)[number];
