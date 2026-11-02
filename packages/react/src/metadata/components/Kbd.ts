import type { QualityRule } from '../quality.js';

export const kbdQualityRules = [
  {
    id: 'kbd.semantics',
    requirement:
      'Each key renders a kbd element and a key combination is exposed as a group with an understandable name.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Use Kbd for each key inside KbdGroup; when symbols read poorly, name the group with aria-label and hide the visual keys with aria-hidden.',
  },
  {
    id: 'kbd.no-key-handling',
    requirement:
      'Kbd and KbdGroup only display keys; they are not focusable and do not intercept keyboard events.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Register shortcuts in application code; do not add tabIndex, contentEditable or keyboard handlers to Kbd or KbdGroup.',
  },
  {
    id: 'kbd.wrapping-theme',
    requirement:
      'Long combinations wrap without clipping and keys stay legible in every supported theme and forced colors.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check narrow viewports, 200% text zoom, dark theme and forced colors in a real browser.',
  },
] as const satisfies readonly QualityRule[];

export const kbdManifest = {
  qualityRules: kbdQualityRules,
  description:
    'Displays a keyboard key or a key combination using the native kbd element.',
  parts: ['Kbd', 'KbdGroup'],
  partProps: {
    Kbd: 'native kbd props + size; excludes tabIndex, contentEditable and keyboard handlers',
    KbdGroup:
      'native span props excluding tabIndex, contentEditable and keyboard handlers; renders role="group"',
  },
  props: {
    size: { type: 'sm | md', default: 'md' },
  },
  sizes: ['sm', 'md'],
  composition:
    'Use one Kbd per key. Wrap combinations in KbdGroup. Key labels and platform notation are supplied by the consumer; no OS detection or shortcut registration is performed.',
  avoid: [
    'Do not use Kbd as a button or attach shortcut handlers to it.',
    'Do not rely on symbols such as ⌘ alone when they may be read ambiguously; name the group instead.',
  ],
  example:
    '<KbdGroup aria-label="Control and K"><span aria-hidden="true"><Kbd>Ctrl</Kbd> + <Kbd>K</Kbd></span></KbdGroup>',
  accessibility:
    'Renders native kbd elements without focus or key handling. Consumers provide readable key labels and an aria-label on KbdGroup when symbols are ambiguous.',
} as const;
