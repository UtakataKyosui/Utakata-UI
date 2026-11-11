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
    id: 'input-otp.target-size',
    requirement:
      'In Chromium light/dark, every slot (empty, filled, invalid and disabled) has a rendered target of at least 24x24 CSS px.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep slot inline and block sizes at or above 24 CSS px, including custom CSS and size overrides.',
  },
  {
    id: 'input-otp.contrast',
    requirement:
      'In Chromium light/dark, enabled slot text meets 4.5:1 and the slot border meets 3:1 against its rendered background; disabled slots are exempt.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Use theme tokens with sufficient contrast; recheck rendered colors after customizing slot CSS.',
  },
  {
    id: 'input-otp.focus-visible',
    requirement:
      'In Chromium light/dark, a keyboard-focused slot shows a solid outline of at least 2 CSS px with 3:1 contrast against its background and a focus shadow.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Do not remove the slot focus outline or ring; keep outline width, style and color when restyling.',
  },
  {
    id: 'input-otp.invalid-state',
    requirement:
      'In Chromium light/dark, an invalid code is shown by aria-invalid, a thicker slot border (not color alone) with 3:1 border contrast, and an associated error message.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the invalid border-width change and render Field.Error text with how to recover.',
  },
  {
    id: 'input-otp.forced-colors',
    requirement:
      'Under Chromium forced-colors emulation, slot borders stay drawn and a keyboard-focused slot keeps a visible solid outline of at least 2 CSS px.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Do not set borders or outlines to none or transparent; rely on system colors in forced colors.',
  },
  {
    id: 'input-otp.reflow',
    requirement:
      'At a 320 CSS px viewport, slots wrap inside the viewport without clipping, horizontal page scroll or targets under 24 CSS px.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep flex-wrap on the Root and avoid fixed widths that exceed the viewport.',
  },
  {
    id: 'input-otp.zoom-physical',
    requirement:
      'Actual 200% browser zoom and text spacing, physical forced-colors and high-contrast settings, and rendering on real platforms keep the code readable and operable. Chromium emulation does not establish these.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Inspect zoom, reflow and forced colors in real browsers and platforms; record environment and results, and leave unverified until performed.',
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
