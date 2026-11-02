import type { QualityRule } from '../quality.js';

export const sliderQualityRules = [
  {
    id: 'slider.thumb-name-value',
    requirement:
      'The thumb exposes role="slider" with a name, current value, understandable value text and its minimum and maximum.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Use Slider.Label, Field.Label, aria-label or getAriaLabel; use format or getAriaValueText when the number alone is not understandable.',
  },
  {
    id: 'slider.keyboard',
    requirement:
      'Arrow keys change the value by step, Page Up/Down by largeStep, Home/End move to min/max, and values stay within bounds including decimal steps.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Preserve Base UI Slider keyboard handling; do not add custom key handlers.',
  },
  {
    id: 'slider.change-commit-form',
    requirement:
      'onValueChange reports intermediate values, onValueCommitted reports the committed value, a named slider submits its value, and disabled sliders cannot be changed.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Use onValueCommitted for expensive work, set name on Root and use disabled rather than removing the slider.',
  },
  {
    id: 'slider.pointer-real-browser',
    requirement:
      'Pointer drag and track press change the value in a real browser, and screen readers announce name, value text and changes.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Record browser, assistive technology, commit and results; leave unverified until performed.',
  },
  {
    id: 'slider.visual-state',
    requirement:
      'The thumb has an operable area of at least 24x24 CSS px and a visible focus ring, and the track, indicator and disabled state remain distinguishable in every supported theme, forced colors and 200% zoom.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check rendered contrast, target size, focus ring and forced colors in a real browser.',
  },
] as const satisfies readonly QualityRule[];

export const sliderManifest = {
  qualityRules: sliderQualityRules,
  description:
    'A single-thumb slider for choosing a number in a range, built on Base UI Slider.',
  parts: ['Root', 'Label', 'Value', 'Control', 'Track', 'Indicator', 'Thumb'],
  partProps: {
    Root: 'Base UI SliderRootProps (value, defaultValue, onValueChange, onValueCommitted, min, max, step, largeStep, format, name, disabled, orientation)',
    Label: 'Base UI SliderLabelProps; names the thumb',
    Value: 'Base UI SliderValueProps; renders an output element',
    Control: 'Base UI SliderControlProps; pointer area',
    Track: 'Base UI SliderTrackProps',
    Indicator: 'Base UI SliderIndicatorProps; filled range',
    Thumb:
      'Base UI SliderThumbProps (aria-label, getAriaLabel, aria-valuetext, getAriaValueText, inputRef)',
  },
  defaults: {
    min: 0,
    max: 100,
    step: 1,
    largeStep: 10,
    orientation: 'horizontal',
    disabled: false,
  },
  composition:
    'Slider.Root contains Slider.Label, an optional Slider.Value and Slider.Control > Slider.Track > Slider.Indicator + one Slider.Thumb. Pass a number to value/defaultValue for a single thumb (Base UI also accepts arrays, but only one thumb is supported here). Use onValueCommitted to act on the final value.',
  avoid: [
    'Do not render more than one Slider.Thumb; ranges are out of scope.',
    'Do not convey the value only through the indicator position; show Slider.Value or provide value text.',
    'Do not add a second native range input; Base UI renders the input used for keyboard, assistive technology and forms.',
  ],
  example:
    '<Slider.Root name="volume" defaultValue={50} step={5}><Slider.Label>Volume</Slider.Label><Slider.Value /><Slider.Control><Slider.Track><Slider.Indicator /><Slider.Thumb getAriaValueText={(value) => value.concat(" percent")} /></Slider.Track></Slider.Control></Slider.Root>',
  accessibility:
    'Base UI renders a hidden input type="range" inside the thumb with aria-valuenow, min, max and aria-valuetext, named by Slider.Label. The name cannot be enforced by types because it may come from Slider.Label or Field.Label; development diagnostics check the range input. Slider.Value is an output element and is not live by default.',
} as const;
