import type { QualityRule } from '../quality.js';

export const drawerQualityRules = [
  {
    id: 'drawer.semantics',
    requirement:
      'For every side an open drawer exposes role="dialog" with an accessible name from Drawer.Title and a description from Drawer.Description, and Drawer.Popup places itself on the side set on Drawer.Root (bottom by default).',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Compose Drawer.Title and Drawer.Description inside Drawer.Popup and pass only a supported side to Drawer.Root; resolve development diagnostics.',
  },
  {
    id: 'drawer.no-drag-dismissal',
    requirement:
      'For every side Escape and Drawer.Close close the drawer and restore focus to the trigger, so closing never requires a drag gesture.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Include a visible Drawer.Close in every Drawer.Popup and preserve Base UI dismissal and focus management; never make swiping the only way to close.',
  },
  {
    id: 'drawer.focus-containment',
    requirement:
      'In a real browser opening a drawer on every side moves focus into the popup, Tab and Shift+Tab keep focus inside it instead of reaching the page behind.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep Drawer.Popup inside Drawer.Portal and preserve Base UI modal focus management; do not render the panel outside the drawer.',
    applicability:
      'Modal Drawer on each side with a connected trigger and a Close button; Drawer.Root does not accept the modal option.',
    residual: 'Nested drawers and trigger removal need separate evidence.',
    criteria: ['2.1.1', '2.1.2', '2.4.3'],
  },
  {
    id: 'drawer.dismissal-focus-return',
    requirement:
      'In a real browser on every side Escape, Drawer.Close and a pointer press on the backdrop close the drawer and restore focus to the trigger without any drag.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep Base UI Drawer dismissal; leave a visible backdrop area and a Drawer.Close inside the popup.',
    applicability:
      'Modal Drawer on each side at a viewport wide enough to leave backdrop visible.',
    residual:
      'Touch gestures and physical device behavior stay outside this check.',
    criteria: ['2.1.1', '2.4.3', '2.5.1', '2.5.7'],
  },
  {
    id: 'drawer.swipe-scroll',
    requirement:
      'In a real browser a touch drag toward the attached edge dismisses the drawer and returns focus to the trigger, a short drag springs it back open, scrolling long content with the wheel never dismisses it, and pressing an action and dragging off before release does not run the action.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep Drawer.Popup inside the Base UI viewport and the scrollable content region; run irreversible actions from click or keyboard activation, never from pointer or touch start.',
    applicability:
      'Chromium touch input emulated through the DevTools protocol on each side (Base UI does not swipe on mouse drags); it is not a physical touch.',
    residual:
      'Real touch scrolling and swipe conflicts on physical phones, momentum and browser overscroll stay manual.',
    criteria: ['2.5.1', '2.5.2', '2.5.7'],
  },
  {
    id: 'drawer.placement-scroll',
    requirement:
      'In a real browser each side attaches to its viewport edge, adds no horizontal page overflow at 320 CSS px with 200% root text size, and long content scrolls inside the popup so the last control stays reachable by Tab and unobscured while the page behind does not scroll.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the fixed edge placement, the content region overflow scrolling and its size limits; do not set fixed heights on drawer content.',
    applicability:
      'Each side with one long English and Japanese content fixture; text size is root font scaling, not browser zoom.',
    residual:
      'Real browser zoom, consumer layouts and custom --ui-drawer-size values need separate verification.',
    criteria: ['1.4.4', '1.4.10', '2.1.1', '2.4.11'],
  },
  {
    id: 'drawer.reduced-motion',
    requirement:
      'In a real browser the slide transition runs without a reduced-motion preference and is removed with prefers-reduced-motion: reduce, while the drawer still opens and closes on every side.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the prefers-reduced-motion override for .ui-drawer__popup and do not add other animations.',
    applicability: 'Media emulation in Chromium on each side.',
    residual: 'OS preference propagation and physical perception stay manual.',
    criteria: ['2.3.3 (product requirement)'],
  },
  {
    id: 'drawer.forced-focus',
    requirement:
      'In a real browser with forced colors active the popup keeps a visible border and every focused popup control keeps a system-color outline of at least 2px.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the forced-colors popup border and the outline fallback for focusable popup descendants.',
    applicability: 'Bottom Drawer with a Close button and an action.',
    criteria: ['1.4.11', '2.4.7', '2.4.11'],
  },
  {
    id: 'drawer.platform-manual',
    requirement:
      'Title, description, entry and return announcements, real touch scrolling and swipe on physical phones, real 200% browser zoom and real high-contrast modes are verified in real browsers with screen readers.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Record browser, assistive technology, device, theme and findings before release; leave unverified until performed.',
  },
] as const satisfies readonly QualityRule[];

export const drawerManifest = {
  qualityRules: drawerQualityRules,
  description:
    'A modal panel attached to a viewport edge that can also be dismissed by swiping toward that edge, built on Base UI Drawer.',
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
    Root: 'Base UI DrawerRootProps without modal, swipeDirection and the snap point options, plus side (open, defaultOpen, onOpenChange, disablePointerDismissal)',
    Trigger: 'Base UI DrawerTriggerProps',
    Portal: 'Base UI DrawerPortalProps',
    Backdrop: 'Base UI DrawerBackdropProps with a string className',
    Popup:
      'Base UI DrawerPopupProps (initialFocus, finalFocus) with a string className; renders the viewport and content regions itself',
    Title: 'Base UI DrawerTitleProps with a string className',
    Description: 'Base UI DrawerDescriptionProps with a string className',
    Close: 'Base UI DrawerCloseProps',
  },
  props: {
    side: {
      type: 'top | right | bottom | left',
      default: 'bottom',
    },
  },
  defaults: { open: false },
  sides: ['top', 'right', 'bottom', 'left'],
  composition:
    'Drawer.Root takes the edge through side and contains a Trigger and a Portal with Backdrop and Popup. Drawer.Popup should include a Drawer.Title, a useful Drawer.Description and a visible Drawer.Close, because a swipe is never the only way to close. Set the panel size with the --ui-drawer-size custom property (width for left and right, maximum height for top and bottom). Lay out the content with your own layout primitives and keep it free of fixed heights so the content region can scroll. The sides are physical (left stays left in right-to-left languages). Use Sheet for a non-gesture edge panel on desktop-style layouts, Dialog for a centered modal and AlertDialog for confirmations.',
  avoid: [
    'Do not create a drawer without a Drawer.Title.',
    'Do not omit a visible Drawer.Close; swiping, Escape and backdrop presses are not the only dismissal a user can find.',
    'Do not run an irreversible action on pointer or touch start; use the Button click so the user can cancel by moving away.',
    'Do not use a drawer for a non-modal panel or with snap points; Drawer.Root rejects modal, swipeDirection and snap point options at typecheck time and they are not provided or verified.',
    'Do not duplicate Base UI open state, focus management, scroll lock, swipe handling or Escape dismissal.',
  ],
  example:
    '<Drawer.Root side="bottom"><Drawer.Trigger render={<Button />}>Open filters</Drawer.Trigger><Drawer.Portal><Drawer.Backdrop /><Drawer.Popup><Drawer.Title>Filters</Drawer.Title><Drawer.Description>Narrow the list.</Drawer.Description><Drawer.Close render={<Button variant="outline" />}>Close</Drawer.Close></Drawer.Popup></Drawer.Portal></Drawer.Root>',
  accessibility:
    'Base UI manages the modal dialog role, focus trapping, scroll lock, Escape and backdrop dismissal, swipe dismissal and focus restoration; Drawer adds only edge placement, a scrollable content region and a slide transition that prefers-reduced-motion removes. Consumers supply the Title, a useful Description, a visible Close control, the content and the confirmation of irreversible actions. side must be one of the four edges and modal, swipeDirection and snap points cannot be set at typecheck time; the accessible name needs development diagnostics and axe checks. Physical touch behavior and screen reader output are not verified by automated checks.',
} as const;

export type DrawerSide = (typeof drawerManifest.sides)[number];
