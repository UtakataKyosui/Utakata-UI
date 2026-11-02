import type { QualityRule } from '../quality.js';

export const accordionQualityRules = [
  {
    id: 'accordion.header-trigger',
    requirement:
      'Each trigger is a named button inside a heading of the configured level, exposes aria-expanded, references its open panel with aria-controls, and the panel is labelled by its trigger.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Compose Item > Header > Trigger and Item > Panel; choose Header level to match the page outline.',
  },
  {
    id: 'accordion.expansion-modes',
    requirement:
      'All items are closed by default, defaultValue opens the listed items, single mode keeps one item open, multiple keeps several open, and controlled value renders the provided state.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Pass value/defaultValue as arrays of Item values and set multiple for independent expansion; do not mirror state in another useState.',
  },
  {
    id: 'accordion.disabled-tab-order',
    requirement:
      'Every enabled trigger is a native button in the Tab order (Base UI 1.9 provides no arrow-key roving for Accordion), and a disabled item exposes its disabled state and does not open.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Keep triggers as Base UI Accordion.Trigger buttons, do not add tabindex, and set disabled on Accordion.Item.',
  },
  {
    id: 'accordion.closed-content',
    requirement:
      'Closed panel content, including links, is removed or hidden from the accessibility tree and Tab order.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Let Accordion.Panel manage hidden state; do not force display on a closed panel with custom CSS.',
  },
  {
    id: 'accordion.keyboard-focus',
    requirement:
      'In a real browser Tab visits each enabled trigger in order and skips disabled ones, Enter and Space toggle an item, Tab then moves into the open panel links in DOM order, focus stays on the trigger after closing, and closed panel links are skipped.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Preserve Base UI Accordion keyboard and hidden-state handling; do not add tabindex or force display on a closed panel.',
  },
  {
    id: 'accordion.motion-forced',
    requirement:
      'In a real browser the open state is shown by a rotating indicator rather than color alone, the height and indicator transitions run by default and are removed under prefers-reduced-motion, and in forced colors the focused trigger keeps a system-color outline of at least 2px.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the prefers-reduced-motion override, the rotating indicator and the transparent focus outline that forced colors expose.',
  },
  {
    id: 'accordion.zoom-theme',
    requirement:
      'At real 200% browser zoom and in real high-contrast modes the triggers and panel content reflow without loss.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check browser zoom, dark theme and high-contrast modes in a real browser; leave unverified until performed.',
  },
  {
    id: 'accordion.screen-reader',
    requirement:
      'Screen readers announce each heading level, trigger name, expanded state and the revealed panel content.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Record NVDA + Firefox and VoiceOver + Safari results; leave unverified until performed.',
  },
] as const satisfies readonly QualityRule[];

export const accordionManifest = {
  qualityRules: accordionQualityRules,
  description:
    'A set of headed sections that expand and collapse, built on Base UI Accordion.',
  parts: ['Root', 'Item', 'Header', 'Trigger', 'Panel'],
  partProps: {
    Root: 'Base UI AccordionRootProps (value/defaultValue arrays, onValueChange, multiple, disabled, orientation, loopFocus, keepMounted, hiddenUntilFound)',
    Item: 'Base UI AccordionItemProps (value, disabled, onOpenChange)',
    Header: 'Base UI AccordionHeaderProps + level (2 | 3 | 4 | 5 | 6)',
    Trigger: 'Base UI AccordionTriggerProps; renders a button',
    Panel: 'Base UI AccordionPanelProps (keepMounted, hiddenUntilFound)',
  },
  props: {
    level: { type: '2 | 3 | 4 | 5 | 6 (Header)', default: 3 },
  },
  headingLevels: [2, 3, 4, 5, 6],
  defaults: {
    defaultValue: [],
    multiple: false,
    disabled: false,
    orientation: 'vertical',
    loopFocus: true,
    keepMounted: false,
    hiddenUntilFound: false,
  },
  composition:
    'Accordion.Root contains Accordion.Item elements; each Item contains Accordion.Header wrapping Accordion.Trigger, followed by Accordion.Panel. value and defaultValue are arrays of Item values even in single mode. Set Header level to fit the heading outline.',
  avoid: [
    'Do not put interactive content other than the Trigger inside Accordion.Header.',
    'Do not use Accordion for a single region; use Collapsible.',
    'Do not keep a duplicate open state in useState; use value with onValueChange.',
  ],
  example:
    '<Accordion.Root><Accordion.Item value="shipping"><Accordion.Header><Accordion.Trigger>Shipping</Accordion.Trigger></Accordion.Header><Accordion.Panel>Ships within 3 business days.</Accordion.Panel></Accordion.Item></Accordion.Root>',
  accessibility:
    'Base UI renders triggers as buttons with aria-expanded/aria-controls, labels panels by their trigger, keeps every trigger in the Tab order (Base UI 1.9 has no arrow-key roving for Accordion) and removes closed content from the Tab order. Consumers choose the heading level and wording. Development diagnostics warn about unnamed triggers.',
} as const;

export type AccordionHeadingLevel =
  (typeof accordionManifest.headingLevels)[number];
