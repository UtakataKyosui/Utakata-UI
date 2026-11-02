import type { QualityRule } from '../quality.js';

export const inputQualityRules = [
  {
    id: 'input.field-association',
    requirement:
      'Inside Field.Root, Input renders exactly one input that is named by Field.Label and described by Field.Description and Field.Error.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Use Input in place of Field.Control; do not nest Field.Control and Input. Outside Field, give the input a label element, aria-label or aria-labelledby.',
  },
  {
    id: 'input.value-form',
    requirement:
      'Typed values reach onChange and onValueChange unchanged and are submitted with the form under the field name.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Pass value/defaultValue and name through to the native input; do not rewrite input values in the component.',
  },
  {
    id: 'input.disabled-readonly',
    requirement:
      'A disabled input cannot be focused or edited; a read-only input keeps its value and stays focusable.',
    verification: 'automated',
    severity: 'error',
    remediation: 'Use the native disabled and readOnly attributes.',
  },
  {
    id: 'input.invalid-state',
    requirement:
      'An invalid input exposes aria-invalid and an associated error message; the error is not communicated by border color alone.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Render Field.Error with text explaining how to fix the value; rely on Field validation or aria-invalid.',
  },
  {
    id: 'input.visual-theme',
    requirement:
      'Borders, placeholder, focus ring, disabled and invalid states are distinguishable in every supported theme, at 200% zoom and in forced colors; every size keeps a target of at least 24×24 CSS px.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Measure rendered contrast and inspect zoom, reflow and forced colors in a real browser.',
  },
] as const satisfies readonly QualityRule[];

export const inputManifest = {
  qualityRules: inputQualityRules,
  description:
    'A single-line native text input built on Base UI Input that integrates with Field.',
  props: {
    type: { type: 'native input type', default: 'text' },
    size: { type: 'sm | md | lg', default: 'md' },
    disabled: { type: 'boolean', default: false },
    readOnly: { type: 'boolean', default: false },
    onValueChange: {
      type: '(value: string, eventDetails) => void',
      default: undefined,
    },
  },
  sizes: ['sm', 'md', 'lg'],
  composition:
    'Use Input instead of Field.Control inside Field.Root; Base UI Input is Field.Control, so one input receives the label, description and error. size is the visual size; the native size attribute is not supported, use CSS width instead. Development diagnostics warn when no name source is found.',
  avoid: [
    'Do not nest Input inside Field.Control or render both for one field.',
    'Do not use placeholder text as the only label.',
    'Do not mask, coerce or auto-correct values in the component; validate with Field instead.',
  ],
  example:
    '<Field.Root name="email"><Field.Label>Email</Field.Label><Input type="email" required autoComplete="email" /><Field.Description>Used for replies.</Field.Description></Field.Root>',
  accessibility:
    'Keeps native input semantics. Field.Label, Field.Description and Field.Error are associated with the single input and Field validation sets aria-invalid. Consumers provide a visible label, input purpose (autoComplete) and error text explaining the fix.',
} as const;

export type InputSize = (typeof inputManifest.sizes)[number];
