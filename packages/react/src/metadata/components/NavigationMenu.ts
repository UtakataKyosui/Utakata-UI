import type { QualityRule } from '../quality.js';

export const navigationMenuQualityRules = [
  {
    id: 'navigation-menu.semantics',
    requirement:
      'The root is a nav landmark with an accessible name; the list is a list of items; each trigger is a button with aria-expanded that references its panel when open; links keep their href and the current page link exposes aria-current="page"; the open panel links are real links reachable from the trigger.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Name NavigationMenu.Root with aria-label or aria-labelledby, compose Root > List > Item, give every Link an href (or a router link through render), mark the current page with the active prop and put panel links in NavigationMenu.Content.',
  },
  {
    id: 'navigation-menu.keyboard',
    requirement:
      'In a real browser Tab visits every top-level link and trigger in order (a disabled trigger is reachable, exposes aria-disabled and never opens), Enter or Space on a trigger opens its panel and keeps focus on the trigger, Tab then moves into the panel links and Shift+Tab returns to the trigger, Escape closes the panel and restores focus to its trigger, the horizontal arrow keys move between triggers and Down opens a panel, and Enter on a panel link follows the link.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Preserve Base UI NavigationMenu focus handling; do not add tabindex, key handlers or role="menu" semantics to triggers, links or panels.',
    applicability:
      'Horizontal navigation with a current-page link, a disabled trigger and two panels. Tab, Enter/Space and Escape run in ltr and rtl; arrow keys run in ltr only.',
    residual:
      'Vertical orientation is rendered and scanned with axe in a browser fixture, but its arrow-key behavior is not exercised by a dedicated real-keyboard test. Mirroring the horizontal arrow keys for right-to-left needs the Base UI DirectionProvider, which this package does not re-export, so that mirroring is unverified.',
  },
  {
    id: 'navigation-menu.pointer',
    requirement:
      'In a real browser hovering a trigger opens its panel, moving the pointer from the trigger onto the panel keeps it open, moving the pointer away closes it, clicking a trigger toggles its panel, and an outside press closes it without following any link.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the trigger and the panel visually adjacent (sideOffset small) so the pointer path stays inside the hover region, and keep the Base UI delay and closeDelay unless a user-controlled setting replaces them.',
  },
  {
    id: 'navigation-menu.touch',
    requirement:
      'In a browser with touch input a tap on a trigger opens its panel without a hover step, a second tap closes it, a tap outside closes it, and a tap on a panel link follows it.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Do not require hover for any link or content; keep triggers at least 2.5rem tall and handle navigation in the link, not in the trigger.',
    residual:
      'Emulated touch input in Chromium is not a physical touch device; real device and screen reader touch exploration remain manual.',
  },
  {
    id: 'navigation-menu.forced-colors',
    requirement:
      'In a real browser with forced colors active the open trigger uses the Highlight and HighlightText system colors, focused triggers and links keep a system-color outline of at least 2px, and the current-page link keeps its underline so it differs without color.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the forced-colors overrides for the open trigger, the focus outline fallback and the current-page underline with enough specificity.',
  },
  {
    id: 'navigation-menu.platform-manual',
    requirement:
      'Edge collision positioning, narrow-viewport overflow of a long navigation, real 200% browser zoom, high-contrast modes, physical touch devices and screen-reader announcements (landmark, expanded state, current page) are verified on real devices and assistive technology.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Record browser, assistive technology, commit and findings before release; leave unverified until performed.',
  },
] as const satisfies readonly QualityRule[];

export const navigationMenuManifest = {
  qualityRules: navigationMenuQualityRules,
  description:
    'Site navigation made of links and triggers that open panels of more links, built on Base UI NavigationMenu.',
  parts: [
    'Root',
    'List',
    'Item',
    'Trigger',
    'Icon',
    'Content',
    'Link',
    'Portal',
    'Positioner',
    'Popup',
    'Viewport',
  ],
  partProps: {
    Root: 'Base UI NavigationMenuRootProps (value, defaultValue, onValueChange, delay, closeDelay, orientation); aria-label or aria-labelledby required',
    List: 'Base UI NavigationMenuListProps; renders a ul',
    Item: 'Base UI NavigationMenuItemProps (value); renders an li',
    Trigger:
      'Base UI NavigationMenuTriggerProps; renders a button with aria-expanded',
    Icon: 'Base UI NavigationMenuIconProps; a decorative span hidden from assistive technology; empty by default and drawn as a chevron that rotates when its panel is open',
    Content:
      'Base UI NavigationMenuContentProps (keepMounted); the panel shown in the Viewport',
    Link: 'Base UI NavigationMenuLinkProps (active, closeOnClick) + native a props; requires href or render',
    Portal: 'Base UI NavigationMenuPortalProps (keepMounted, container)',
    Positioner:
      'Base UI NavigationMenuPositionerProps (side, align, sideOffset)',
    Popup: 'Base UI NavigationMenuPopupProps; renders a nav element',
    Viewport: 'Base UI NavigationMenuViewportProps',
  },
  props: {
    delay: { type: 'number', default: '50' },
    closeDelay: { type: 'number', default: '50' },
    orientation: { type: 'horizontal | vertical', default: 'horizontal' },
  },
  defaults: {
    delay: 50,
    closeDelay: 50,
    orientation: 'horizontal',
    closeOnClick: false,
  },
  composition:
    'NavigationMenu.Root (named with aria-label or aria-labelledby) contains a List of Items. An Item holds either a Link, or a Trigger with an optional Icon and a Content whose children are Links (typically a list). Put one Portal > Positioner > Popup > Viewport as a sibling of the List inside Root; Base UI shows the open Content inside the Viewport. Mark the current page with Link active. Router links go through the Link render prop and must render an anchor with an href.',
  avoid: [
    'Do not use it for application commands; use DropdownMenu or Menubar.',
    'Do not give the navigation role="menu" or role="menuitem" semantics; links are ordinary links.',
    'Do not put forms or dialogs inside a Content panel; use Popover for interactive widgets.',
    'Do not open panels only on hover; the trigger must also work with click, tap and keyboard.',
    'Do not mark more than one link as the current page.',
    'Do not expect a panel to close when a link in it is activated; set closeOnClick on the Link for single-page navigation.',
  ],
  example:
    '<NavigationMenu.Root aria-label="メイン"><NavigationMenu.List><NavigationMenu.Item><NavigationMenu.Link href="/" active>ホーム</NavigationMenu.Link></NavigationMenu.Item><NavigationMenu.Item value="products"><NavigationMenu.Trigger>製品<NavigationMenu.Icon /></NavigationMenu.Trigger><NavigationMenu.Content><ul><li><NavigationMenu.Link href="/products/ui">UI</NavigationMenu.Link></li></ul></NavigationMenu.Content></NavigationMenu.Item></NavigationMenu.List><NavigationMenu.Portal><NavigationMenu.Positioner sideOffset={8}><NavigationMenu.Popup><NavigationMenu.Viewport /></NavigationMenu.Popup></NavigationMenu.Positioner></NavigationMenu.Portal></NavigationMenu.Root>',
  accessibility:
    'Base UI provides the nav landmark, aria-expanded and aria-controls on triggers, aria-current on the active link, hover/click/tap opening, focus movement into the panel, Escape and outside-press dismissal and focus return. The landmark name is required at typecheck time and development diagnostics warn about an unnamed root, trigger or link. Link destinations, link text quality, the current-page choice, router integration and the overall page landmark structure are the consumer responsibility.',
} as const;
