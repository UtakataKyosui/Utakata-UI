import type { QualityRule } from '../quality.js';

export const sheetQualityRules = [
  {
    id: 'sheet.semantics',
    requirement:
      'For every side an open sheet exposes role="dialog" with an accessible name from Sheet.Title and a description from Sheet.Description, and Sheet.Popup places itself on the requested side (right by default).',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Compose Sheet.Title and Sheet.Description inside Sheet.Popup and pass only a supported side; resolve development diagnostics.',
  },
  {
    id: 'sheet.escape-focus-return',
    requirement:
      'For every side Escape and Sheet.Close close the sheet and restore focus to the trigger.',
    verification: 'automated',
    severity: 'error',
    remediation: 'Preserve Base UI Dialog dismissal and focus management.',
  },
  {
    id: 'sheet.focus-containment',
    requirement:
      'In a real browser opening a sheet on every side moves focus into the popup, Tab and Shift+Tab keep focus inside it instead of reaching the page behind.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep Sheet.Popup inside Sheet.Portal and preserve Base UI modal focus management; do not render the panel outside the dialog.',
    applicability:
      'Default modal Sheet on each side with a connected trigger and a Close button; modal={false} is not covered.',
    residual: 'Nested modals and trigger removal need separate evidence.',
    criteria: ['2.1.1', '2.1.2', '2.4.3'],
  },
  {
    id: 'sheet.dismissal-focus-return',
    requirement:
      'In a real browser on every side Escape, Sheet.Close and a pointer press on the backdrop close the sheet and restore focus to the trigger.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep Base UI Dialog dismissal; leave a visible backdrop area and a Sheet.Close inside the popup.',
    applicability:
      'Default modal Sheet on each side at a viewport wide enough to leave backdrop visible.',
    residual:
      'Touch gestures and physical device behavior stay outside this check.',
    criteria: ['2.1.1', '2.4.3'],
  },
  {
    id: 'sheet.placement-scroll',
    requirement:
      'In a real browser each side attaches to its viewport edge, adds no horizontal page overflow at 320 CSS px with 200% root text size, and long content scrolls inside the popup so the last control stays reachable by Tab and unobscured while the page behind does not scroll.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the fixed edge placement, the popup overflow scrolling and its size limits; do not set fixed heights on popup content.',
    applicability:
      'Each side with one long English and Japanese content fixture; text size is root font scaling, not browser zoom.',
    residual:
      'Real browser zoom, consumer layouts and custom --ui-sheet-size values need separate verification.',
    criteria: ['1.4.4', '1.4.10', '2.1.1', '2.4.11'],
  },
  {
    id: 'sheet.reduced-motion',
    requirement:
      'In a real browser the slide transition runs without a reduced-motion preference and is removed with prefers-reduced-motion: reduce, while the sheet still opens and closes on every side.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the prefers-reduced-motion override for .ui-sheet__popup and do not add other animations.',
    applicability: 'Media emulation in Chromium on each side.',
    residual: 'OS preference propagation and physical perception stay manual.',
    criteria: ['2.3.3 (product requirement)'],
  },
  {
    id: 'sheet.forced-focus',
    requirement:
      'In a real browser with forced colors active the popup keeps a visible border and every focused popup control keeps a system-color outline of at least 2px.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the forced-colors popup border and the outline fallback for focusable popup descendants.',
    applicability: 'Right-side Sheet with a Close button and an action.',
    criteria: ['1.4.11', '2.4.7', '2.4.11'],
  },
  {
    id: 'sheet.platform-manual',
    requirement:
      'Title, description, entry and return announcements, real 200% browser zoom, real high-contrast modes and touch operation on physical devices are verified in real browsers with screen readers.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Record browser, assistive technology, theme and findings before release; leave unverified until performed.',
  },
] as const satisfies readonly QualityRule[];

export const sheetManifest = {
  qualityRules: sheetQualityRules,
  description:
    'A modal panel attached to the top, right, bottom or left edge of the viewport, composed from Base UI Dialog parts.',
  parts: [
    'Root',
    'Trigger',
    'Portal',
    'Backdrop',
    'Popup',
    'Title',
    'Description',
    'Close',
  ],
  partProps: {
    Root: 'Base UI DialogRootProps (open, defaultOpen, onOpenChange)',
    Trigger: 'Base UI DialogTriggerProps',
    Portal: 'Base UI DialogPortalProps',
    Backdrop: 'Base UI DialogBackdropProps',
    Popup:
      'Base UI DialogPopupProps (initialFocus, finalFocus) plus side, with a string className',
    Title: 'Base UI DialogTitleProps',
    Description: 'Base UI DialogDescriptionProps',
    Close: 'Base UI DialogCloseProps',
  },
  props: {
    side: {
      type: 'top | right | bottom | left',
      default: 'right',
    },
  },
  defaults: { open: false },
  sides: ['top', 'right', 'bottom', 'left'],
  composition:
    'Sheet.Root contains a Trigger and a Portal with Backdrop and Popup. Sheet.Popup takes the edge through side and should include a Sheet.Title, a useful Sheet.Description and a Sheet.Close. Set the panel size with the --ui-sheet-size custom property (width for left and right, maximum height for top and bottom). Lay out the content with your own layout primitives and keep it free of fixed heights so it can scroll. The sides are physical (left stays left in right-to-left languages). Use Dialog for a centered modal and AlertDialog for confirmations.',
  avoid: [
    'Do not create a sheet without a Sheet.Title.',
    'Do not omit a visible Sheet.Close; Escape and backdrop presses are not the only dismissal a user can find.',
    'Do not use a sheet for a non-modal side panel or set modal to false; that behavior is not provided or verified.',
    'Do not duplicate Base UI open state, focus management, scroll lock or Escape dismissal.',
  ],
  example:
    '<Sheet.Root><Sheet.Trigger render={<Button />}>Open filters</Sheet.Trigger><Sheet.Portal><Sheet.Backdrop /><Sheet.Popup side="right"><Sheet.Title>Filters</Sheet.Title><Sheet.Description>Narrow the list.</Sheet.Description><Sheet.Close render={<Button variant="outline" />}>Close</Sheet.Close></Sheet.Popup></Sheet.Portal></Sheet.Root>',
  accessibility:
    'Base UI manages the modal dialog role, focus trapping, scroll lock, Escape and backdrop dismissal and focus restoration; Sheet adds only edge placement, scrolling and a slide transition that prefers-reduced-motion removes. Consumers supply the Title, a useful Description, a Close control and the content. side must be one of the four edges at typecheck time; the accessible name needs development diagnostics and axe checks.',
} as const;

export type SheetSide = (typeof sheetManifest.sides)[number];
