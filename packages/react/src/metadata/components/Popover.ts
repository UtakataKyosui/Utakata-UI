import type { QualityRule } from '../quality.js';

export const popoverQualityRules = [
  {
    id: 'popover.accessible-name',
    requirement:
      'The trigger has an accessible name and the open popup is a dialog named by Popover.Title and described by Popover.Description.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Include Popover.Title (or aria-label) and, when useful, Popover.Description inside Popover.Popup.',
  },
  {
    id: 'popover.open-dismiss-focus',
    requirement:
      'In a real browser the trigger opens the popup with expanded state, focus moves into the popup, and Close, Escape and outside press close it and restore focus to the trigger; pressing inside does not close it.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Preserve Base UI focus management and dismissal; do not reimplement outside-press handling.',
  },
  {
    id: 'popover.disabled-controlled',
    requirement:
      'A disabled trigger does not open the popup and controlled open state is respected.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Pass disabled to Popover.Trigger and drive open with open/onOpenChange on Popover.Root.',
  },
  {
    id: 'popover.forced-focus',
    requirement:
      'In a real browser with forced colors active the focused trigger, the focused popup and focusable popup descendants each keep a system-color outline of at least 2px, and the popup keeps a visible border.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the forced-colors outline fallback for the trigger, the popup and its focusable descendants; box shadows are suppressed in forced colors.',
  },
  {
    id: 'popover.platform-manual',
    requirement:
      'Edge collision positioning, real 200% browser zoom and reflow, real high-contrast modes and screen-reader announcements are verified on real devices and assistive technology.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Record browser, assistive technology, commit and findings before release; leave unverified until performed.',
  },
] as const satisfies readonly QualityRule[];

export const popoverManifest = {
  qualityRules: popoverQualityRules,
  description:
    'A non-modal popup anchored to a trigger for small interactive content, built on Base UI Popover.',
  parts: [
    'Root',
    'Trigger',
    'Portal',
    'Positioner',
    'Popup',
    'Arrow',
    'Title',
    'Description',
    'Close',
  ],
  partProps: {
    Root: 'Base UI PopoverRootProps (open, defaultOpen, onOpenChange, modal)',
    Trigger: 'Base UI PopoverTriggerProps; renders a button',
    Portal: 'Base UI PopoverPortalProps',
    Positioner: 'Base UI PopoverPositionerProps (side, align, sideOffset)',
    Popup: 'Base UI PopoverPopupProps; renders role="dialog"',
    Arrow: 'Base UI PopoverArrowProps',
    Title: 'Base UI PopoverTitleProps; renders h2',
    Description: 'Base UI PopoverDescriptionProps; renders p',
    Close: 'Base UI PopoverCloseProps; renders a button',
  },
  defaults: { open: false, modal: false, side: 'bottom', sideOffset: 0 },
  composition:
    'Popover.Root contains a Trigger and a Portal with Positioner and Popup. Popup should include a Title, an optional Description and a Close button. Trigger and Close render bare unstyled buttons, so compose them onto Button with render (for example render={<Button variant="outline" />}) to keep their text readable in every theme.',
  avoid: [
    'Do not create a popover without a Popover.Title or other accessible name.',
    'Do not use Popover for hover-only content or as a modal; use Tooltip or Dialog.',
    'Do not duplicate Base UI positioning, focus management or Escape/outside dismissal.',
  ],
  example:
    '<Popover.Root><Popover.Trigger render={<Button variant="outline" />}>表示設定</Popover.Trigger><Popover.Portal><Popover.Positioner sideOffset={8}><Popover.Popup><Popover.Title>表示設定</Popover.Title><Popover.Description>表示を調整します。</Popover.Description><Popover.Close render={<Button />}>閉じる</Popover.Close></Popover.Popup></Popover.Positioner></Popover.Portal></Popover.Root>',
  accessibility:
    'Base UI exposes the trigger expanded state, a dialog role named by Title and described by Description, focus movement and return, and Escape/outside dismissal. Development diagnostics warn about unnamed triggers, close buttons and popups.',
} as const;
