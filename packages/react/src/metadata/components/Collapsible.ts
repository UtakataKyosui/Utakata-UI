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
      'Enter and Space toggle the trigger with real keyboard input, focus stays on the trigger after closing, and the panel height change does not hide focus.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Verify with real keyboard input in each supported browser and record the results.',
  },
  {
    id: 'collapsible.motion-theme',
    requirement:
      'The open/closed indicator does not rely on color, height animation is removed under prefers-reduced-motion, and content reflows at 200% zoom in every theme and forced colors.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check reduced motion, zoom, dark theme and forced colors in a real browser.',
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
