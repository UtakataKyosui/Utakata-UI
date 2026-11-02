import type { QualityRule } from '../quality.js';

export const spinnerQualityRules = [
  {
    id: 'spinner.status-name',
    requirement:
      'A non-decorative Spinner exposes one role="status" live region whose only text is the visually hidden label (default "読み込み中"), and the graphic is hidden.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Keep the default label or pass a nonempty label describing the process.',
  },
  {
    id: 'spinner.decorative',
    requirement:
      'A decorative Spinner is hidden from assistive technology and adds no status, so a Button keeps its visible text as the only name and its disabled state.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Use decorative inside Button or next to visible progress text, and write the processing state in that text.',
  },
  {
    id: 'spinner.motion-theme',
    requirement:
      'Under prefers-reduced-motion the rotation stops and a static partial ring remains recognizable; the ring is visible in every supported theme and forced colors.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check the OS reduced-motion setting, rendered contrast in dark theme and forced colors in a real browser.',
  },
  {
    id: 'spinner.announcement',
    requirement:
      'Screen readers announce the status label once when the Spinner appears, without repeated announcements.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Record screen reader, browser and observed announcement; render the Spinner into an existing region if it is not announced.',
  },
] as const satisfies readonly QualityRule[];

export const spinnerManifest = {
  qualityRules: spinnerQualityRules,
  description:
    'An indeterminate loading indicator with a visually hidden status label.',
  props: {
    size: { type: 'sm | md | lg', default: 'md' },
    label: {
      type: 'string; not allowed when decorative',
      default: '読み込み中',
    },
    decorative: {
      type: 'boolean; true hides the Spinner from assistive technology',
      default: false,
    },
  },
  sizes: ['sm', 'md', 'lg'],
  composition:
    'Standalone Spinners render role="status" with a visually hidden label. Inside Button use decorative and write the state in the button text, e.g. "保存中". The ring uses currentColor and --ui-spinner-size. No display delay or process management.',
  avoid: [
    'Do not pass an empty label; the type system cannot reject empty strings.',
    'Do not render a non-decorative Spinner inside a Button; it duplicates the name.',
  ],
  example: '<Button disabled><Spinner size="sm" decorative />保存中</Button>',
  accessibility:
    'Non-decorative: role="status" with a visually hidden label; the ring is aria-hidden. decorative omits the status and label. Under prefers-reduced-motion the rotation stops and the ring stays as a static shape. Announcement timing depends on the screen reader.',
} as const;

export type SpinnerSize = (typeof spinnerManifest.sizes)[number];
