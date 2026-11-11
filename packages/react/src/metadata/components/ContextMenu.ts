import type { QualityRule } from '../quality.js';

export const contextMenuQualityRules = [
  {
    id: 'context-menu.semantics',
    requirement:
      'Right click on the Trigger area opens a menu named by the consumer (aria-label or aria-labelledby on Popup) with menuitem, group (named by GroupLabel) and separator roles; disabled items expose aria-disabled.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Name ContextMenu.Popup with aria-label or aria-labelledby and compose Item, Group, GroupLabel and Separator inside it.',
  },
  {
    id: 'context-menu.keyboard-open',
    requirement:
      'In a real browser the ContextMenu key and Shift+F10 on a focusable element inside the Trigger open the menu, and the first item receives focus.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Make the Trigger area contain a focusable element (or give it tabIndex={0} with an accessible name and role) so keyboard users can reach it; do not stop contextmenu events.',
  },
  {
    id: 'context-menu.keyboard',
    requirement:
      'In a real browser arrow keys, Home/End and typeahead move the highlight; disabled items stay discoverable with arrow keys but cannot be activated by click or Enter.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Preserve Base UI roving focus and typeahead; use the disabled prop instead of removing items.',
  },
  {
    id: 'context-menu.activate-dismiss',
    requirement:
      'In a real browser activating an item with Enter or Space runs its action once and closes the menu; Escape closes it without an action; in both cases focus returns to the element that was focused when the menu opened.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Handle actions in Item onClick; do not reimplement dismissal or focus return.',
  },
  {
    id: 'context-menu.forced-highlight',
    requirement:
      'In a real browser with forced colors active the highlighted item, including a highlighted disabled item, uses the Highlight and HighlightText system colors.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the shared dropdown-menu forced-colors overrides for highlighted and disabled-highlighted items.',
  },
  {
    id: 'context-menu.alternative-manual',
    requirement:
      'Touch long press, screen-reader announcements, edge collision positioning, real high-contrast modes and 200% browser zoom are verified on real devices and assistive technology, and every action has a visible non-contextual alternative.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Provide the same actions through a visible control such as DropdownMenu; record device, assistive technology, commit and findings before release and leave unverified until performed.',
  },
] as const satisfies readonly QualityRule[];

export const contextMenuManifest = {
  qualityRules: contextMenuQualityRules,
  description:
    'A menu of actions opened by right click, long press, or the ContextMenu key and Shift+F10, built on Base UI ContextMenu and sharing DropdownMenu parts.',
  parts: [
    'Root',
    'Trigger',
    'Portal',
    'Positioner',
    'Popup',
    'Item',
    'Group',
    'GroupLabel',
    'Separator',
  ],
  partProps: {
    Root: 'Base UI ContextMenuRootProps (open, defaultOpen, onOpenChange, loopFocus); renders no element',
    Trigger:
      'Base UI ContextMenuTriggerProps; renders a div area that opens the menu',
    Portal: 'Base UI MenuPortalProps',
    Positioner: 'Base UI ContextMenuPositionerProps (side, align, sideOffset)',
    Popup:
      'Base UI MenuPopupProps; renders role="menu"; requires aria-label or aria-labelledby (ContextMenuPopupProps)',
    Item: 'Same as DropdownMenu.Item (onClick, disabled, label, closeOnClick)',
    Group: 'Same as DropdownMenu.Group; renders role="group"',
    GroupLabel: 'Same as DropdownMenu.GroupLabel; names its Group',
    Separator: 'Same as DropdownMenu.Separator; renders role="separator"',
  },
  defaults: { open: false, loopFocus: true, closeOnClick: true },
  composition:
    'ContextMenu.Root contains a Trigger area and a Portal with Positioner and Popup. Popup (named with aria-label or aria-labelledby) contains Items, optionally in Groups with a GroupLabel, separated by Separator. Item, Group, GroupLabel and Separator are the DropdownMenu parts. Submenus, checkbox and radio items are not provided. The Trigger is a plain div: put a focusable element inside it (or make the area focusable with a role and name) so the ContextMenu key and Shift+F10 can open the menu, and offer every action through a visible control such as a DropdownMenu because long press and right click are not discoverable or available on every device.',
  avoid: [
    'Do not make a context menu the only way to reach an action; provide a visible alternative such as DropdownMenu.',
    'Do not use it for site navigation links or for form fields; use a list of links or Popover.',
    'Do not suppress the contextmenu event inside the Trigger or rely on right click alone.',
  ],
  example:
    '<ContextMenu.Root><ContextMenu.Trigger><Button variant="outline">ファイル</Button></ContextMenu.Trigger><ContextMenu.Portal><ContextMenu.Positioner><ContextMenu.Popup aria-label="ファイルの操作"><ContextMenu.Item>編集</ContextMenu.Item><ContextMenu.Item disabled>削除</ContextMenu.Item></ContextMenu.Popup></ContextMenu.Positioner></ContextMenu.Portal></ContextMenu.Root>',
  accessibility:
    'Base UI provides menu/menuitem roles, roving focus, Home/End, typeahead, disabled items, Escape/outside dismissal and focus return. The ContextMenu key and Shift+F10 fire the browser contextmenu event on the focused element inside the Trigger. Development diagnostics warn about an unnamed Popup; item labels, the focusable Trigger content and a non-contextual alternative are supplied by the consumer.',
} as const;
