import type { QualityRule } from '../quality.js';

export const progressQualityRules = [
  {
    id: 'progress.name-value',
    requirement:
      'The progressbar has an accessible name and aria-valuenow, aria-valuemin, aria-valuemax and the indicator width match the clamped value, including 0, 50, 100 and custom min/max.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Provide label, aria-label or aria-labelledby on Progress.Root; pass numeric value, min and max and keep the Indicator inside the Track.',
  },
  {
    id: 'progress.indeterminate',
    requirement:
      'value={null} (and non-finite values) is indeterminate: aria-valuenow is omitted and data-indeterminate distinguishes it from value 0.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Use value={null} while the amount is unknown; do not pass 0 to mean unknown.',
  },
  {
    id: 'progress.no-duplicate-announcement',
    requirement:
      'Progress.Value is visual only (aria-hidden) and no live region is added, so the value is not announced twice.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Use Progress.Value for visible text; announce completion separately only when the task needs it.',
  },
  {
    id: 'progress.visual-motion',
    requirement:
      'In a real browser the indicator width matches the value, the fill keeps at least 3:1 contrast against the track and the track boundary against the surface, the value text keeps 4.5:1, the indeterminate bar animates by default and becomes a static patterned bar under prefers-reduced-motion, and forced colors keep the fill and track boundary visible.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the reduced-motion pattern and forced-colors fill; check --ui-progress-color overrides against the track.',
  },
  {
    id: 'progress.os-reduced-motion',
    requirement:
      'With the operating system reduced-motion setting and real high-contrast modes the indeterminate bar shows no motion and remains distinguishable.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check the OS reduced-motion and high-contrast settings in a real browser; leave unverified until performed.',
  },
  {
    id: 'progress.screen-reader',
    requirement:
      'Screen readers announce the name and value when focus or the virtual cursor reaches the progressbar.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Record NVDA + Firefox and VoiceOver + Safari results before release.',
  },
] as const satisfies readonly QualityRule[];

export const progressManifest = {
  qualityRules: progressQualityRules,
  description:
    'Shows determinate or indeterminate task progress, built on Base UI Progress.',
  parts: ['Root', 'Track', 'Indicator', 'Label', 'Value'],
  partProps: {
    Root: 'Base UI ProgressRootProps + label; requires label, aria-label or aria-labelledby',
    Track: 'Base UI ProgressTrackProps',
    Indicator: 'Base UI ProgressIndicatorProps',
    Label: 'Base UI ProgressLabelProps',
    Value: 'Base UI ProgressValueProps (aria-hidden visual text)',
  },
  props: {
    value: {
      type: 'number | null; null (or NaN/non-finite) is indeterminate, finite values are clamped to min..max',
      default: 'required',
    },
    min: { type: 'number', default: 0 },
    max: { type: 'number', default: 100 },
    label: {
      type: 'string | ReactElement; rendered with Progress.Label and used as the name',
      default: 'none; one of label, aria-label or aria-labelledby is required',
    },
  },
  defaults: { min: 0, max: 100 },
  composition:
    'Progress.Root (with label, aria-label or aria-labelledby) contains an optional Progress.Value and Progress.Track > Progress.Indicator. A missing name is a type error; development diagnostics warn about empty names and dangling references. When placing Progress.Label yourself, give it an id and pass the same id as aria-labelledby on Root. Use Spinner for short tasks without a measurable amount.',
  avoid: [
    'Do not use value={0} to mean unknown progress; use value={null}.',
    'Do not add an aria-live region for every value change; announce completion separately if needed.',
    'Do not use Progress for user-adjustable values; use a slider.',
  ],
  example:
    '<Progress.Root value={45} label="アップロード"><Progress.Value /><Progress.Track><Progress.Indicator /></Progress.Track></Progress.Root>',
  accessibility:
    'Base UI renders role="progressbar" with aria-valuemin/max/now and aria-valuetext (formatted percentage, or "indeterminate progress"). Progress.Value is aria-hidden. The consumer announces completion or errors with visible text when needed. Indeterminate animation stops under prefers-reduced-motion and keeps a striped pattern.',
} as const;
