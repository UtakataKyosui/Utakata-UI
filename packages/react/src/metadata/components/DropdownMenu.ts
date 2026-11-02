import type { QualityRule } from '../quality.js';

export const dropdownMenuQualityRules = [
  {
    id: 'dropdown-menu.semantics',
    requirement:
      'The trigger exposes aria-haspopup="menu" and expanded state; the popup is a menu named by the trigger, with menuitem, group (named by GroupLabel) and separator roles.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Compose Item, Group, GroupLabel and Separator inside DropdownMenu.Popup; name groups with GroupLabel.',
  },
  {
    id: 'dropdown-menu.keyboard',
    requirement:
      'Arrow keys, Home/End and typeahead move the highlight; disabled items stay discoverable with arrow keys (as in the APG menu pattern) but cannot be activated by click or Enter.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Preserve Base UI roving focus and typeahead; use the disabled prop instead of removing items.',
  },
  {
    id: 'dropdown-menu.activate-dismiss',
    requirement:
      'Activating an item runs its action once and closes the menu; Escape and outside press close the menu and restore focus to the trigger.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Handle actions in Item onClick; do not reimplement dismissal or focus return.',
  },
  {
    id: 'dropdown-menu.real-browser',
    requirement:
      'Verify real keyboard operation, edge positioning, highlight visibility in every theme and forced colors, 200% zoom and screen-reader announcements.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Record browser, assistive technology, commit and findings before release.',
  },
] as const satisfies readonly QualityRule[];

export const dropdownMenuManifest = {
  qualityRules: dropdownMenuQualityRules,
  description:
    'A menu of actions opened from a trigger button, built on Base UI Menu.',
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
    Root: 'Base UI MenuRootProps (open, defaultOpen, onOpenChange, modal, loopFocus)',
    Trigger: 'Base UI MenuTriggerProps; renders a button',
    Portal: 'Base UI MenuPortalProps',
    Positioner: 'Base UI MenuPositionerProps (side, align, sideOffset)',
    Popup: 'Base UI MenuPopupProps; renders role="menu"',
    Item: 'Base UI MenuItemProps (onClick, disabled, label, closeOnClick)',
    Group: 'Base UI MenuGroupProps; renders role="group"',
    GroupLabel: 'Base UI MenuGroupLabelProps; names its Group',
    Separator: 'Base UI SeparatorProps; renders role="separator"',
  },
  defaults: { open: false, modal: true, loopFocus: true, closeOnClick: true },
  composition:
    'DropdownMenu.Root contains a Trigger and a Portal with Positioner and Popup. Popup contains Items, optionally in Groups with a GroupLabel, separated by Separator. Submenus, checkbox and radio items are not provided.',
  avoid: [
    'Do not use a dropdown menu for site navigation links; use a list of links or navigation landmark.',
    'Do not place form fields or non-menu content inside the popup; use Popover.',
    'Do not hide unavailable actions only by color; use disabled.',
  ],
  example:
    '<DropdownMenu.Root><DropdownMenu.Trigger render={<Button variant="outline" />}>操作</DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Positioner sideOffset={4}><DropdownMenu.Popup><DropdownMenu.Item>編集</DropdownMenu.Item><DropdownMenu.Item disabled>削除</DropdownMenu.Item></DropdownMenu.Popup></DropdownMenu.Positioner></DropdownMenu.Portal></DropdownMenu.Root>',
  accessibility:
    'Base UI provides menu/menuitem roles, roving focus, Home/End, typeahead, disabled items, Escape/outside dismissal and focus return to the trigger. Development diagnostics warn about unnamed triggers; item labels are supplied by the consumer.',
} as const;
