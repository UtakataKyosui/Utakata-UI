import type { QualityRule } from '../quality.js';

export const textareaQualityRules = [
  {
    id: 'textarea.field-association',
    requirement:
      'Inside Field.Root, Textarea renders exactly one textarea that is named by Field.Label and described by Field.Description and Field.Error, with aria-invalid when invalid.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Use Textarea in place of Field.Control; outside Field, give the textarea a label element, aria-label or aria-labelledby.',
  },
  {
    id: 'textarea.value-form',
    requirement:
      'Multi-line values including line breaks reach onChange and are submitted with the form; maxLength is forwarded to the native element.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Pass value/defaultValue, maxLength and name through to the native textarea.',
  },
  {
    id: 'textarea.disabled-readonly',
    requirement:
      'A disabled textarea cannot be focused or edited and is not submitted; a read-only textarea keeps its value and stays focusable.',
    verification: 'automated',
    severity: 'error',
    remediation: 'Use the native disabled and readOnly attributes.',
  },
  {
    id: 'textarea.keyboard-input',
    requirement:
      'In a real browser, Enter inserts a newline, maxLength prevents excess typing, disabled textareas are skipped by Tab and read-only values cannot be edited.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Run the required textarea.keyboard-input browser check using real keyboard input; preserve native textarea behavior.',
  },
  {
    id: 'textarea.visual-resize',
    requirement:
      'Long text wraps, the textarea can be resized vertically, and borders, focus, disabled and invalid states stay distinguishable in every theme, at 200% zoom and in forced colors.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check wrapping, manual resizing, zoom, reflow, contrast and forced colors in a real browser.',
  },
] as const satisfies readonly QualityRule[];

export const textareaManifest = {
  qualityRules: textareaQualityRules,
  description:
    'A multi-line native textarea that integrates with Field labelling and validation.',
  props: {
    rows: { type: 'number', default: 3 },
    size: { type: 'sm | md | lg', default: 'md' },
    disabled: { type: 'boolean', default: false },
    readOnly: { type: 'boolean', default: false },
  },
  sizes: ['sm', 'md', 'lg'],
  composition:
    'Use Textarea instead of Field.Control inside Field.Root. It renders Base UI Field.Control with a native textarea, so one textarea receives the label, description, error and validation state. size changes padding and font size only, never maxLength. Resizing is vertical. Development diagnostics warn when no name source is found.',
  avoid: [
    'Do not render Textarea inside Field.Control or add a second textarea for the same field.',
    'Do not use placeholder text as the only label or to state the length limit.',
  ],
  example:
    '<Field.Root name="notes"><Field.Label>Notes</Field.Label><Textarea rows={4} maxLength={500} /><Field.Description>Up to 500 characters.</Field.Description></Field.Root>',
  accessibility:
    'Keeps native textarea semantics, including Enter for line breaks. Consumers state length limits and required conditions as visible text, for example in Field.Description.',
} as const;

export type TextareaSize = (typeof textareaManifest.sizes)[number];
