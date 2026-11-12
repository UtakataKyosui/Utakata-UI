import type { QualityRule } from '../quality.js';

export const resizableQualityRules = [
  {
    id: 'resizable.separator-semantics',
    requirement:
      'Each Handle is a focusable role="separator" with an accessible name from aria-label or aria-labelledby, an aria-orientation perpendicular to the panel layout, aria-valuenow equal to the size in percent of the panel before it, and aria-valuemin / aria-valuemax equal to the range that panel and its neighbour allow. aria-controls references the panel before the handle.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Place Resizable.Handle directly between two Resizable.Panel elements and pass aria-label or aria-labelledby (required by types) that says which panel is resized.',
  },
  {
    id: 'resizable.keyboard-constraints',
    requirement:
      'The arrow keys along the layout axis move the boundary by keyboardStep percent (reversed for dir="rtl" in horizontal groups), Home and End jump to the minimum and maximum, sizes never leave the minSize/maxSize range of either neighbour, unrelated panels keep their size, and onLayoutChange reports the new layout.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Keep minSize <= defaultSize <= maxSize for every panel and do not add custom key handlers to the Handle.',
  },
  {
    id: 'resizable.pointer',
    requirement:
      'Dragging a Handle with a single pointer resizes the neighbouring panels proportionally to the pointer movement, honors minSize/maxSize, follows the writing direction in RTL, and ends on release or cancel.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Keep the pointer handlers on the Handle; do not cover the Handle with another element.',
  },
  {
    id: 'resizable.layout',
    requirement:
      'Default sizes are resolved to percentages that sum to 100; panels without defaultSize share the remainder equally, and sizes are re-resolved when panels are added or removed.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Give every Panel a unique panelId; use defaultSize values that sum to at most 100.',
  },
  {
    id: 'resizable.keyboard-pointer-browser',
    requirement:
      'In a real browser, Tab reaches each Handle once in DOM order, the arrow, Home and End keys resize in horizontal and vertical groups and in RTL, a real mouse drag resizes within the limits and keeps keyboard focus on the Handle, and aria-valuenow follows the rendered size.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Preserve the Handle focus, key and pointer behavior and the percentage-based panel flex sizing.',
  },
  {
    id: 'resizable.visual-layout',
    requirement:
      'In Chromium light/dark, every Handle has a rendered target of at least 24x24 CSS px while taking up only its line width in layout, its keyboard focus shows a solid outline of at least 2 CSS px, the layout stays inside a 320 CSS px viewport without horizontal page scroll, and under forced-colors emulation the handle line and focus outline remain drawn.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the handle hit area, focus outline, min-inline-size: 0 on panels and the forced-colors rules; use orientation="vertical" for narrow viewports.',
  },
  {
    id: 'resizable.screen-reader',
    requirement:
      'Screen readers announce the separator name, orientation and value (percent), and updated values while resizing, in the supported browser and assistive-technology combinations.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Record browser, assistive technology, commit and results; leave unverified until performed.',
  },
  {
    id: 'resizable.zoom-touch-theme',
    requirement:
      'Actual 200% browser zoom and text spacing, physical high-contrast settings, every supported theme, and touch dragging on real devices keep the layout readable and operable. A single-pointer alternative to dragging is supplied where WCAG 2.5.7 applies.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Inspect in real browsers and on devices; record environment and results, and leave unverified until performed.',
  },
] as const satisfies readonly QualityRule[];

export const resizableManifest = {
  qualityRules: resizableQualityRules,
  description:
    'Resizable panels separated by keyboard- and pointer-operable splitters (window splitter pattern). Implemented with React, Lism and CSS custom properties; Base UI has no equivalent.',
  parts: ['Group', 'Panel', 'Handle'],
  partProps: {
    Group:
      'Native div props, orientation, keyboardStep (percent per arrow key press) and onLayoutChange(layout: Record<panel id, percent>)',
    Panel:
      'Native div props, required unique panelId (stable key of the panel in layouts; the native id is optional and generated when omitted), defaultSize, minSize and maxSize in percent of the group',
    Handle:
      'Native div props except role, tabIndex and aria-orientation/valuenow/valuemin/valuemax/controls; aria-label or aria-labelledby is required',
  },
  props: {
    orientation: { type: 'horizontal | vertical', default: 'horizontal' },
    keyboardStep: { type: 'number (percent)', default: 5 },
    panelId: {
      type: 'string; required on Resizable.Panel',
      default: undefined,
    },
    defaultSize: {
      type: 'number (percent); remaining space is shared equally when omitted',
      default: undefined,
    },
    minSize: { type: 'number (percent)', default: 10 },
    maxSize: { type: 'number (percent)', default: 100 },
    'aria-label': {
      type: 'string; Resizable.Handle needs this or aria-labelledby',
      default: undefined,
    },
    'aria-labelledby': {
      type: 'string; Resizable.Handle needs this or aria-label',
      default: undefined,
    },
  },
  orientations: ['horizontal', 'vertical'],
  composition:
    'Resizable.Group lays out Resizable.Panel elements in a row (horizontal) or a column (vertical); put one Resizable.Handle directly between each pair of neighbouring panels. Sizes are percentages that sum to 100 and are uncontrolled: set defaultSize, observe changes with onLayoutChange and persist them yourself. A Handle resizes only the two panels beside it. The Handle is a focusable role="separator" whose aria-valuenow is the percent size of the panel before it. In a horizontal group the separator itself is vertical (aria-orientation="vertical"), and in a vertical group it is horizontal. Arrow keys follow the writing direction (dir="rtl" is supported). For narrow viewports switch the Group to orientation="vertical" or stack the layout in your own CSS.',
  avoid: [
    'Do not place anything except Panels and Handles as direct children, and do not separate a Handle from its two neighbouring Panels.',
    'Do not use Resizable for a static divider; use Separator.',
    'Do not use it to show a value or progress; use Slider or Progress.',
    'Do not hide essential content in a panel that can be resized below its content size without making it scrollable or reachable.',
  ],
  example:
    '<Resizable.Group orientation="horizontal" style={{ blockSize: 240 }}><Resizable.Panel panelId="nav" defaultSize={30} minSize={15} maxSize={50}>ナビゲーション</Resizable.Panel><Resizable.Handle aria-label="ナビゲーションの幅" /><Resizable.Panel panelId="main" defaultSize={70}>本文</Resizable.Panel></Resizable.Group>',
  accessibility:
    'Handle is a focusable role="separator" with a name, orientation and aria-valuenow/min/max (APG window splitter, without collapse). The name is required by types; the Handle position between two Panels and unique panelId values cannot be checked by types, so a development warning reports a Handle without neighbouring Panels and the Handle name diagnostics apply. Dragging has a keyboard alternative (arrow, Home, End). Consumers remain responsible for the meaning of each panel region (headings, landmarks, labels), reachable scrolling content, a single-pointer alternative where WCAG 2.5.7 applies, persistence of the layout, and not shrinking panels below their content needs. Collapsible panels, nested persistence, pixel units and controlled sizes are not provided.',
} as const;

export type ResizableOrientation =
  (typeof resizableManifest.orientations)[number];
