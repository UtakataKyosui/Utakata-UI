import type { QualityRule } from '../quality.js';

export const inputOTPQualityRules = [
  {
    id: 'input-otp.name-slots',
    requirement:
      'The code is a role="group" labelled by Field.Label or aria-labelledby; the first slot takes the field name and every later slot has a distinct position name from getSlotLabel, so slots are not announced as duplicate fields.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Place InputOTP.Root in Field.Root with a Field.Label (or pass aria-labelledby) and give Root getSlotLabel, for example a function returning "Digit 2 of 6" for position 2 of 6.',
  },
  {
    id: 'input-otp.entry-form',
    requirement:
      'Typing fills slots in order, paste and autofill distribute characters across slots, Backspace and Delete remove characters, characters rejected by validationType are reported through onValueInvalid, onValueComplete fires when every slot is filled, and a named field submits its value with the form without submitting automatically.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Set name on Root, keep length equal to the number of InputOTP.Slot parts, use onValueComplete for follow-up work and submit the form with an explicit control.',
  },
  {
    id: 'input-otp.error',
    requirement:
      'An invalid code is exposed with aria-invalid on the slots and a Field.Error message that is associated with the group, not by color or slot borders alone.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Use Field.Root invalid with Field.Error and describe how to recover, for example that the code was wrong or expired.',
  },
  {
    id: 'input-otp.keyboard-paste',
    requirement:
      'In a real browser, Tab enters the code once at the first empty slot, typing advances focus, ArrowLeft/ArrowRight/Home/End move between slots, Backspace moves back and clears, and a real clipboard paste fills the slots.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Preserve Base UI OTPField keyboard, paste and focus handling; do not add custom key or paste handlers.',
  },
  {
    id: 'input-otp.autofill-ime',
    requirement:
      'Platform one-time-code autofill from SMS or a password manager, and IME composition on mobile keyboards, fill the slots correctly on real devices.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Keep the default autoComplete="one-time-code"; record device, browser, OS and results, and leave unverified until performed.',
  },
  {
    id: 'input-otp.screen-reader',
    requirement:
      'Screen readers announce the group name, each slot position, entered characters and the error message without reading the code as duplicate fields.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Record browser, assistive technology, commit and results; leave unverified until performed.',
  },
  {
    id: 'input-otp.visual-state',
    requirement:
      'Each slot has an operable area of at least 24x24 CSS px, a visible focus indicator, and invalid, disabled and read-only states distinguishable in every supported theme, forced colors and 200% zoom without relying on color alone.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check rendered contrast, target size, focus indicator, reflow of long codes and forced colors in a real browser.',
  },
] as const satisfies readonly QualityRule[];

export const inputOTPManifest = {
  qualityRules: inputOTPQualityRules,
  description:
    'A multi-character one-time code input split into slots, built on Base UI OTP Field.',
  parts: ['Root', 'Slot', 'Separator'],
  partProps: {
    Root: 'Base UI OTPFieldRootProps except autoSubmit and aria-label (value, defaultValue, onValueChange, onValueComplete, onValueInvalid, length, validationType, mask, inputMode, autoComplete, normalizeValue, name, form, required, disabled, readOnly), plus required getSlotLabel',
    Slot: 'Base UI OTPFieldInputProps except render, aria-label and aria-labelledby; one input per character',
    Separator:
      'Base UI OTPField Separator props; decorative and hidden from assistive technology by default',
  },
  defaults: {
    validationType: 'numeric',
    autoComplete: 'one-time-code',
    mask: false,
    required: false,
    disabled: false,
    readOnly: false,
  },
  composition:
    'Place InputOTP.Root in Field.Root with a Field.Label, optional Field.Description and Field.Error. Render exactly `length` InputOTP.Slot parts, optionally grouped with InputOTP.Separator. Pass getSlotLabel to Root so slots after the first are named by position. Verify the code on the server; onValueComplete only reports that every slot is filled.',
  avoid: [
    'Do not render a number of InputOTP.Slot parts that differs from length.',
    'Do not submit the form automatically when the code is complete; use an explicit submit control or onValueComplete with visible feedback.',
    'Do not add a second text input for the same code; Base UI renders the hidden input used for validation and forms.',
    'Do not rely on placeholders or slot borders for the label or error; use Field.Label and Field.Error.',
    'Do not use it for passwords or free-form text; use Input.',
  ],
  example:
    '<Field.Root><Field.Label>Verification code</Field.Label><InputOTP.Root name="code" length={6} getSlotLabel={(position, length) => "Digit " + position + " of " + length}><InputOTP.Slot /><InputOTP.Slot /><InputOTP.Slot /><InputOTP.Separator /><InputOTP.Slot /><InputOTP.Slot /><InputOTP.Slot /></InputOTP.Root></Field.Root>',
  accessibility:
    'Base UI renders a role="group" of text inputs; the first slot is named by Field.Label or aria-labelledby and getSlotLabel names later slots so they are not duplicates. Types require getSlotLabel and omit autoSubmit and Root aria-label from props objects (TypeScript does not check hyphenated attributes written directly in JSX, so aria-label on Root or Slot is ignored by Base UI and not a type error); the label itself and the slot count cannot be enforced by types, so development diagnostics check the slots. Consumers remain responsible for the label, the error text, server-side verification, resend and expiry flows, and not blocking paste or autofill.',
} as const;
