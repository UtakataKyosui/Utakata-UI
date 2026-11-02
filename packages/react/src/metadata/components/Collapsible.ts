import type { QualityRule } from '../quality.js';

export const collapsibleQualityRules = [
  {
    id: 'collapsible.trigger-state',
    requirement:
      'The trigger is a named button exposing aria-expanded and, while open, aria-controls referencing the panel.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Use Collapsible.Trigger with visible text inside Collapsible.Root; do not replace Base UI state attributes.',
  },
  {
    id: 'collapsible.closed-content',
    requirement:
      'Closed panel content is removed or hidden from the accessibility tree and Tab order, including with keepMounted.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Let Collapsible.Panel manage hidden state; do not force display on a closed panel with custom CSS.',
  },
  {
    id: 'collapsible.controlled-disabled',
    requirement:
      'defaultOpen and controlled open render the matching state, and a disabled collapsible does not toggle.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Pass open with onOpenChange for controlled use and disabled on Collapsible.Root; do not mirror the state in another useState.',
  },
  {
    id: 'collapsible.keyboard-focus',
    requirement:
      'In a real browser Tab reaches the trigger, Enter opens and Space closes the panel, focus stays on the trigger, closed panel content (including with keepMounted) is skipped by Tab while open content is reached, and the focused trigger stays inside the viewport with a visible focus indicator.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Preserve Base UI Collapsible keyboard and hidden-state handling; do not force display on a closed panel or remove the focus indicator.',
  },
  {
    id: 'collapsible.motion-forced',
    requirement:
      'In a real browser the open/closed indicator changes by rotation rather than color, the height and indicator transitions run by default and are removed under prefers-reduced-motion, and in forced colors the focused trigger keeps a system-color outline of at least 2px.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the prefers-reduced-motion override, the rotating indicator and the transparent focus outline that forced colors expose.',
  },
  {
    id: 'collapsible.zoom-theme',
    requirement:
      'At real 200% browser zoom and in real high-contrast modes the trigger and panel content reflow without loss.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check browser zoom, dark theme and high-contrast modes in a real browser; leave unverified until performed.',
  },
] as const satisfies readonly QualityRule[];

export const collapsibleManifest = {
  qualityRules: collapsibleQualityRules,
  description:
    'Shows and hides a single region with one trigger, built on Base UI Collapsible.',
  parts: ['Root', 'Trigger', 'Panel'],
  partProps: {
    Root: 'Base UI CollapsibleRootProps (open, defaultOpen, onOpenChange, disabled)',
    Trigger: 'Base UI CollapsibleTriggerProps; renders a button',
    Panel: 'Base UI CollapsiblePanelProps (keepMounted, hiddenUntilFound)',
  },
  defaults: {
    defaultOpen: false,
    disabled: false,
    keepMounted: false,
    hiddenUntilFound: false,
  },
  composition:
    'Collapsible.Root contains one Collapsible.Trigger with visible text and one Collapsible.Panel. Closed panels are unmounted by default; keepMounted keeps them hidden in the DOM. Height animates with --collapsible-panel-height and is disabled under prefers-reduced-motion.',
  avoid: [
    'Do not use Collapsible for several coordinated sections; use Accordion.',
    'Do not keep a duplicate open state in useState; use open with onOpenChange.',
    'Do not reveal a closed panel with custom CSS.',
  ],
  example:
    '<Collapsible.Root><Collapsible.Trigger>Advanced settings</Collapsible.Trigger><Collapsible.Panel>Additional settings</Collapsible.Panel></Collapsible.Root>',
  accessibility:
    'Base UI renders the trigger as a native button with aria-expanded and aria-controls and removes closed content from the Tab order. Development diagnostics warn about unnamed triggers. Consumers provide the trigger text and surrounding heading structure.',
} as const;
