import type { QualityRule } from '../quality.js';

export const menubarQualityRules = [
  {
    id: 'menubar.semantics',
    requirement:
      'The root exposes role="menubar" with an accessible name; each trigger is a menuitem with aria-haspopup="menu" and expanded state; each popup is a menu named by its trigger; a submenu trigger is a menuitem that exposes aria-haspopup and expanded state.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Name Menubar.Root with aria-label or aria-labelledby, put each Menu inside Menubar.Root, and compose Item, Group, GroupLabel, Separator and SubmenuRoot inside Menubar.Popup.',
  },
  {
    id: 'menubar.keyboard',
    requirement:
      'In a real browser Left/Right (Up/Down when vertical) move between triggers and loop, Home/End jump to the first and last trigger, Down opens a menu and highlights its first item, arrow keys move between items including disabled ones (which cannot be activated), Right opens and Left closes a submenu, and the horizontal arrow keys swap in right-to-left layout.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Preserve Base UI Menubar roving focus and submenu handling; use the disabled prop instead of removing items and provide the Base UI DirectionProvider for right-to-left content.',
    applicability:
      'Horizontal menubar with a disabled menu, a disabled item and a submenu, in ltr and in rtl.',
    residual:
      'Vertical orientation is rendered and scanned with axe in a browser fixture, but its arrow-key movement and a non-default loopFocus are not exercised by a dedicated real-keyboard test.',
  },
  {
    id: 'menubar.activate-dismiss',
    requirement:
      'In a real browser Enter or Space on an item runs its action once, closes every open menu and returns focus to its trigger; Escape closes the open menu and restores focus to its trigger, and a submenu Escape closes only the submenu.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Handle actions in Item onClick; do not reimplement dismissal or focus return.',
  },
  {
    id: 'menubar.forced-highlight',
    requirement:
      'In a real browser with forced colors active the highlighted item and the highlighted trigger of an open menu use the Highlight and HighlightText system colors and the focused trigger keeps a system-color outline of at least 2px.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the forced-colors overrides for highlighted items, open triggers and the trigger outline fallback with enough specificity.',
  },
  {
    id: 'menubar.platform-manual',
    requirement:
      'Edge collision positioning, narrow-viewport overflow of a long bar, real 200% browser zoom, high-contrast modes, touch and screen-reader announcements (menubar, menu and submenu navigation) are verified on real devices and assistive technology.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Record browser, assistive technology, commit and findings before release; leave unverified until performed.',
  },
] as const satisfies readonly QualityRule[];

export const menubarManifest = {
  qualityRules: menubarQualityRules,
  description:
    'A bar of menus (File, Edit, View) with arrow-key movement between menus, built on Base UI Menubar and Menu.',
  parts: [
    'Root',
    'Menu',
    'Trigger',
    'Portal',
    'Positioner',
    'Popup',
    'Item',
    'Group',
    'GroupLabel',
    'Separator',
    'SubmenuRoot',
    'SubmenuTrigger',
  ],
  partProps: {
    Root: 'Base UI MenubarProps (modal, disabled, orientation, loopFocus); aria-label or aria-labelledby required',
    Menu: 'Base UI MenuRootProps (open, defaultOpen, onOpenChange, disabled)',
    Trigger: 'Base UI MenuTriggerProps; renders a button with role="menuitem"',
    Portal: 'Base UI MenuPortalProps',
    Positioner: 'Base UI MenuPositionerProps (side, align, sideOffset)',
    Popup: 'Base UI MenuPopupProps; renders role="menu"',
    Item: 'Base UI MenuItemProps (onClick, disabled, label, closeOnClick)',
    Group: 'Base UI MenuGroupProps; renders role="group"',
    GroupLabel: 'Base UI MenuGroupLabelProps; names its Group',
    Separator: 'Base UI SeparatorProps; renders role="separator"',
    SubmenuRoot: 'Base UI MenuSubmenuRootProps (open, defaultOpen, disabled)',
    SubmenuTrigger:
      'Base UI MenuSubmenuTriggerProps; a menuitem that opens a nested Portal',
  },
  props: {
    modal: { type: 'boolean', default: true },
    disabled: { type: 'boolean', default: false },
    orientation: { type: 'horizontal | vertical', default: 'horizontal' },
    loopFocus: { type: 'boolean', default: true },
  },
  defaults: {
    modal: true,
    disabled: false,
    orientation: 'horizontal',
    loopFocus: true,
    closeOnClick: true,
  },
  orientations: ['horizontal', 'vertical'],
  composition:
    'Menubar.Root (named with aria-label or aria-labelledby) contains one Menubar.Menu per top-level menu. Each Menu has a Trigger and a Portal with Positioner and Popup. Popup contains Items, optionally in Groups with a GroupLabel, separated by Separator. For a submenu put SubmenuRoot inside Popup with a SubmenuTrigger and a nested Portal > Positioner > Popup. The popup parts are the DropdownMenu parts and share their styles. Checkbox and radio items are not provided. Right-to-left layout needs the Base UI DirectionProvider around the bar.',
  avoid: [
    'Do not use a menubar for site navigation links; use a navigation landmark with a list of links.',
    'Do not use it for a single menu; use DropdownMenu.',
    'Do not place form fields or non-menu content inside a popup; use Popover.',
    'Do not hide unavailable actions only by color; use disabled.',
    'Do not add Tab stops or key handlers to triggers; Base UI roves focus with arrow keys.',
  ],
  example:
    '<Menubar.Root aria-label="アプリケーション"><Menubar.Menu><Menubar.Trigger>ファイル</Menubar.Trigger><Menubar.Portal><Menubar.Positioner sideOffset={4}><Menubar.Popup><Menubar.Item>新規作成</Menubar.Item><Menubar.SubmenuRoot><Menubar.SubmenuTrigger>共有</Menubar.SubmenuTrigger><Menubar.Portal><Menubar.Positioner><Menubar.Popup><Menubar.Item>メール</Menubar.Item></Menubar.Popup></Menubar.Positioner></Menubar.Portal></Menubar.SubmenuRoot></Menubar.Popup></Menubar.Positioner></Menubar.Portal></Menubar.Menu></Menubar.Root>',
  accessibility:
    'Base UI provides menubar/menuitem/menu roles, a single Tab stop with arrow-key roving between triggers (swapped in rtl), Home/End, Down to open, submenu arrow keys, typeahead, disabled items, Escape/outside dismissal and focus return. The bar name is required at typecheck time and development diagnostics warn about unnamed roots, triggers and submenu triggers; item labels are supplied by the consumer. Whole-page landmark and shortcut-key design are the consumer responsibility.',
} as const;
