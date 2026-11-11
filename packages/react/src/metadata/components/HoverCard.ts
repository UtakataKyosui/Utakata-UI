import type { QualityRule } from '../quality.js';

export const hoverCardQualityRules = [
  {
    id: 'hover-card.trigger-link',
    requirement:
      'The Trigger is a link with its own accessible name and a destination (href), and opening the card adds no extra Tab stop.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Give HoverCard.Trigger an href and visible link text, aria-label or aria-labelledby; do not put interactive content in the Popup.',
  },
  {
    id: 'hover-card.focus-hover-escape',
    requirement:
      'In a real browser the card opens after the delay on pointer hover and on keyboard focus of the Trigger, Escape closes it without moving focus, and the link stays operable with Enter.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Preserve Base UI hover/focus handling; do not open the card only from pointer events or stop Escape.',
  },
  {
    id: 'hover-card.hoverable',
    requirement:
      'In a real browser moving the pointer from the Trigger onto the Popup keeps the card open, and leaving both closes it (WCAG 1.4.13).',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep a closeDelay long enough to cross the gap between the Trigger and the Popup and keep sideOffset small.',
  },
  {
    id: 'hover-card.visual-position',
    requirement:
      'In a real browser the Popup text keeps at least 4.5:1 contrast against its background in every supported theme, the Popup stays inside a 320 CSS px viewport, and in forced colors the Popup keeps a visible border and the focused Trigger keeps a system-color outline of at least 2px.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the popup collision handling, the forced-colors border and the trigger outline; check --ui-hover-card-background and --ui-hover-card-color overrides.',
  },
  {
    id: 'hover-card.platform-manual',
    requirement:
      'Touch usability (the link is followed and the card is never required), screen-reader behavior with the unannounced card, real 200% browser zoom and real high-contrast modes are verified on real devices and assistive technology, and every piece of information in the card is also available on the page or the link target.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Record browser, assistive technology, device, commit and findings before release; leave unverified until performed.',
  },
] as const satisfies readonly QualityRule[];

export const hoverCardManifest = {
  qualityRules: hoverCardQualityRules,
  description:
    'A supplementary preview of a link target shown on pointer hover and keyboard focus, built on Base UI PreviewCard.',
  parts: ['Root', 'Trigger', 'Portal', 'Positioner', 'Popup', 'Arrow'],
  partProps: {
    Root: 'Base UI PreviewCardRootProps (open, defaultOpen, onOpenChange, actionsRef, handle)',
    Trigger:
      'Base UI PreviewCardTriggerProps plus required href; renders an <a> or the render element; delay (600ms) and closeDelay (300ms) are set here',
    Portal: 'Base UI PreviewCardPortalProps',
    Positioner: 'Base UI PreviewCardPositionerProps (side, align, sideOffset)',
    Popup: 'Base UI PreviewCardPopupProps; supplementary content only',
    Arrow: 'Base UI PreviewCardArrowProps',
  },
  defaults: { delay: 600, closeDelay: 300, open: false, side: 'bottom' },
  composition:
    'HoverCard.Root contains a Trigger link and a Portal with Positioner and Popup (optionally Arrow). Use a framework link through render (for example render={<Link href="/x" />}) and keep href. The card is not focus-managed, not announced as a dialog and ignored for touch.',
  avoid: [
    'Do not place links, buttons or form controls in the Popup; it cannot be reached with the keyboard. Use Popover for interactive content.',
    'Do not put essential information only in the card; touch and screen-reader users never see it. Show it on the page or in the link target.',
    'Do not use a HoverCard where a Tooltip (short text for a control) or Popover (opened by activation) fits better.',
  ],
  example:
    '<HoverCard.Root><HoverCard.Trigger href="https://example.com/utakata">Utakata-UI</HoverCard.Trigger><HoverCard.Portal><HoverCard.Positioner sideOffset={8}><HoverCard.Popup>An accessible React component library.</HoverCard.Popup></HoverCard.Positioner></HoverCard.Portal></HoverCard.Root>',
  accessibility:
    'Base UI opens the card on hover and keyboard focus of the link, keeps it open while hovered and closes it with Escape. Touch users simply follow the link. The Popup is supplementary: it is not announced and cannot receive focus, so the consumer must keep every essential fact available outside the card and name the link with its visible text.',
} as const;
