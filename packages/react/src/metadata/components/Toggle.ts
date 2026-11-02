import type { QualityRule } from '../quality.js';

export const toggleQualityRules = [
  {
    id: 'toggle.pressed-state',
    requirement:
      'Toggle exposes its pressed state with aria-pressed, keeps the same accessible name when toggled, and notifies each change once.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Keep the label constant and let Base UI manage aria-pressed through pressed/defaultPressed and onPressedChange.',
  },
  {
    id: 'toggle.accessible-name',
    requirement:
      'Every toggle has an accessible name; icon-only toggles require aria-label or aria-labelledby.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Provide visible text, or set iconOnly with aria-label or aria-labelledby and hide the icon with aria-hidden.',
  },
  {
    id: 'toggle.disabled-no-submit',
    requirement:
      'A disabled toggle does not change or notify, and a toggle inside a form never submits it.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Do not override type="button" or Base UI disabled behavior; use Button for submit actions.',
  },
  {
    id: 'toggle.keyboard',
    requirement:
      'Enter and Space toggle a focused toggle once in a real browser, and focus remains on the toggle.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Verify with real keyboard input in each supported browser; record results in the evidence log.',
  },
  {
    id: 'toggle.visual-states',
    requirement:
      'Pressed, unpressed, focus and disabled states are distinguishable without color alone for every size and variant, in every theme and forced colors.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check rendered contrast, the pressed border/fill and the focus ring in a real browser, including forced colors.',
  },
] as const satisfies readonly QualityRule[];

export const toggleManifest = {
  qualityRules: toggleQualityRules,
  description:
    'A two-state button that stays pressed or unpressed, built on Base UI Toggle.',
  props: {
    pressed: { type: 'boolean; controlled', default: undefined },
    defaultPressed: { type: 'boolean', default: false },
    onPressedChange: {
      type: '(pressed: boolean, eventDetails) => void',
      default: undefined,
    },
    disabled: { type: 'boolean', default: false },
    value: {
      type: 'string; identifies the toggle inside a toggle group',
      default: undefined,
    },
    variant: { type: 'outline | ghost', default: 'ghost' },
    size: { type: 'sm | md | lg', default: 'md' },
    iconOnly: {
      type: 'boolean; true requires aria-label or aria-labelledby',
      default: false,
    },
  },
  variants: ['outline', 'ghost'],
  sizes: ['sm', 'md', 'lg'],
  composition:
    'Use Toggle for a persistent on/off formatting or view option. The label describes the option and does not change with the state. Renders type="button", so it never submits a form.',
  avoid: [
    'Do not use Toggle for one-off actions; use Button.',
    'Do not use Toggle for settings that apply immediately as on/off switches; use a Switch.',
    'Do not change the label text when pressed; aria-pressed conveys the state.',
  ],
  example:
    '<Toggle iconOnly aria-label="Bold" variant="outline"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16"><path d="M4 2h5a3 3 0 0 1 0 6H4zM4 8h6a3 3 0 0 1 0 6H4z" /></svg></Toggle>',
  accessibility:
    'Renders a native button with aria-pressed managed by Base UI. iconOnly requires an explicit name source at typecheck time; development diagnostics warn about missing names. Pressed state is shown by fill and border, not color alone.',
} as const;

export type ToggleSize = (typeof toggleManifest.sizes)[number];
export type ToggleVariant = (typeof toggleManifest.variants)[number];
