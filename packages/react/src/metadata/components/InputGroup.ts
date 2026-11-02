import type { QualityRule } from '../quality.js';

export const inputGroupQualityRules = [
  {
    id: 'input-group.single-control',
    requirement:
      'InputGroup.Root wraps exactly one existing Input or Textarea whose Field label, description, value, onChange and ref are unchanged; the group adds no role, name or second input.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Place Input or Textarea directly in InputGroup.Root inside Field.Root; do not add Field.Control or another input for the addon.',
  },
  {
    id: 'input-group.addon-content',
    requirement:
      'Addon content does not change the input name; meaningful addon text such as a unit reaches the input only as a description through aria-describedby, and decorative icons in the documented pattern are aria-hidden.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Set aria-hidden="true" on decorative icons; give InputGroup.Text an id and reference it from the input with aria-describedby, or include the unit in Field.Label.',
  },
  {
    id: 'input-group.button',
    requirement:
      'InputGroup.Button has an accessible name, renders type="button", follows the input in DOM order without removing itself from the Tab order, and clicking it does not submit the surrounding form.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Give the button visible text or iconOnly with aria-label; keep the default type and place the addon after the input in the DOM.',
  },
  {
    id: 'input-group.keyboard',
    requirement:
      'In a real browser, Tab moves from the input to each enabled addon button in visual order, text input works normally, Enter in the input does not activate the addon button (native implicit submission of a single-field form still applies) and focus stays visible on the group and on the button.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the addon button after the input in the DOM with its default type and do not add tabindex to the group or the input.',
  },
  {
    id: 'input-group.visual-states',
    requirement:
      'In a real browser inline and block addons and long units never overlap the input text, addon text keeps at least 4.5:1 contrast, read-only and disabled frames differ by border style or cursor and invalid frames differ from valid ones while Field.Error text states the problem, content stays inside the group at 320 CSS px and 200% text size, and in forced colors the focused frame keeps a system-color outline of at least 2px.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the frame state styles, wrapping and the forced-colors outline; pair invalid borders with Field.Error text.',
  },
  {
    id: 'input-group.zoom-theme',
    requirement:
      'At real 200% browser zoom and in real high-contrast modes addons, units and states stay readable and distinguishable.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Inspect rendered contrast, spacing, reflow and forced colors in a real browser; leave unverified until performed.',
  },
] as const satisfies readonly QualityRule[];

export const inputGroupManifest = {
  qualityRules: inputGroupQualityRules,
  description:
    'A frame that adds prefix or suffix text, icons and buttons around an existing Input or Textarea.',
  parts: ['Root', 'Addon', 'Text', 'Button'],
  partProps: {
    Root: 'native div props; no role',
    Addon: 'native div props + align',
    Text: 'native span props',
    Button:
      'Button props; defaults variant="ghost", size="sm" and Base UI type="button"',
  },
  props: {
    align: {
      type: 'inline-start | inline-end | block-start | block-end (Addon)',
      default: 'inline-start',
    },
  },
  defaults: { align: 'inline-start', variant: 'ghost', size: 'sm' },
  aligns: ['inline-start', 'inline-end', 'block-start', 'block-end'],
  composition:
    'Field.Root > Field.Label + InputGroup.Root containing one Input or Textarea and InputGroup.Addon parts. align only sets spacing and placement; it does not reorder content, so put inline-start and block-start addons before the control and inline-end and block-end addons after it to keep reading and Tab order equal to the visual order. Root reflects focus, disabled, read-only and invalid states of the control. InputGroup.Text holds static text; link units the label does not mention with aria-describedby. InputGroup.Button is the existing Button with type="button", so activating it does not submit the form; Enter in the input does not activate it, while native implicit submission of a single-field form still applies.',
  avoid: [
    'Do not add a second input or a hidden value for the addon; the Input or Textarea owns the value.',
    'Do not use addon text or a placeholder as the only label; keep Field.Label.',
    'Do not reorder addons with CSS; DOM order must match the visual order.',
    'Do not leave decorative icons exposed to assistive technology; set aria-hidden="true".',
  ],
  example:
    '<Field.Root><Field.Label>検索</Field.Label><InputGroup.Root><Input name="query" type="search" /><InputGroup.Addon align="inline-end"><InputGroup.Button>検索</InputGroup.Button></InputGroup.Addon></InputGroup.Root></Field.Root>',
  accessibility:
    'Static div and span parts without roles or client code; Input, Textarea and Button keep their own semantics, diagnostics and Field associations. The consumer provides the label, hides decorative icons and associates meaningful unit text with aria-describedby. Search, clear and password-visibility logic belong to the consumer.',
} as const;

export type InputGroupAddonAlign = (typeof inputGroupManifest.aligns)[number];
