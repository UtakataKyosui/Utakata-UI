import type { QualityRule } from '../quality.js';

export const selectQualityRules = [
  {
    id: 'select.trigger-name',
    requirement:
      'The trigger exposes role="combobox" with a name that does not depend on the selected value, and the open listbox and options are named.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Use Select.Label, Field.Label, aria-label or aria-labelledby on the trigger and Select.ItemText inside each Select.Item; resolve development diagnostics.',
  },
  {
    id: 'select.keyboard-selection',
    requirement:
      'Arrow keys open the popup and move between options, typing moves to a matching option, Enter selects, and focus returns to the trigger.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Preserve Base UI Select keyboard, typeahead and focus management; do not add custom key handlers.',
  },
  {
    id: 'select.escape-focus-return',
    requirement:
      'Escape closes the popup without changing the value and restores focus to the trigger.',
    verification: 'automated',
    severity: 'error',
    remediation: 'Preserve Base UI dismissal and focus restoration.',
  },
  {
    id: 'select.value-form',
    requirement:
      'Without a value the placeholder is shown; the trigger shows the selected item label, disabled items cannot be selected, controlled values are respected and the named hidden input submits the value.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Pass items so Select.Value can show labels, use Select.Value placeholder, set name on Root and mark unavailable options disabled.',
  },
  {
    id: 'select.real-keyboard-screen-reader',
    requirement:
      'In a real browser the popup opens, positions, scrolls and closes on outside press, and screen readers announce the name, expanded state, active option and selection.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Record browser, assistive technology, commit and results; leave unverified until performed.',
  },
  {
    id: 'select.visual-state',
    requirement:
      'Highlighted, selected, disabled and focus states are distinguishable without color alone, long labels wrap or truncate legibly, and targets are at least 24x24 CSS px in every supported theme, forced colors and 200% zoom.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check rendered contrast, the item indicator, focus ring, long labels and forced colors in a real browser.',
  },
] as const satisfies readonly QualityRule[];

export const selectManifest = {
  qualityRules: selectQualityRules,
  description:
    'A single-selection select built on Base UI Select with a portalled listbox popup.',
  parts: [
    'Root',
    'Label',
    'Trigger',
    'Value',
    'Icon',
    'Portal',
    'Positioner',
    'Popup',
    'List',
    'Item',
    'ItemText',
    'ItemIndicator',
    'Group',
    'GroupLabel',
  ],
  partProps: {
    Root: 'Base UI SelectRootProps without multiple (value, defaultValue, onValueChange, items, name, disabled, required, readOnly)',
    Label: 'Base UI SelectLabelProps; names the trigger',
    Trigger: 'Base UI SelectTriggerProps; renders role="combobox"',
    Value: 'Base UI SelectValueProps (placeholder)',
    Icon: 'Base UI SelectIconProps; decorative',
    Portal: 'Base UI SelectPortalProps',
    Positioner: 'Base UI SelectPositionerProps (side, align, sideOffset)',
    Popup: 'Base UI SelectPopupProps',
    List: 'Base UI SelectListProps; renders role="listbox"',
    Item: 'Base UI SelectItemProps (value, disabled, label)',
    ItemText: 'Base UI SelectItemTextProps',
    ItemIndicator: 'Base UI SelectItemIndicatorProps',
    Group: 'Base UI SelectGroupProps',
    GroupLabel: 'Base UI SelectGroupLabelProps',
  },
  defaults: { disabled: false, required: false, defaultOpen: false },
  composition:
    'Select.Root contains Select.Label, Select.Trigger (with Select.Value and an optional Select.Icon) and Select.Portal > Positioner > Popup > List > Item > ItemText. Pass items (value/label pairs) to Root so the trigger shows the selected label before the popup has opened. Use Group and GroupLabel for sections. Use NativeSelect when native platform pickers are preferred; Select provides a styled single-value listbox.',
  avoid: [
    'Do not use the selected value or placeholder as the only name of the trigger.',
    'Do not implement multiple selection, search input or asynchronous options with Select.',
    'Do not duplicate Base UI open state, focus management or typeahead.',
  ],
  example:
    '<Select.Root name="theme" defaultValue="system" items={[{ value: "system", label: "System" }, { value: "dark", label: "Dark" }]}><Select.Label>Theme</Select.Label><Select.Trigger><Select.Value placeholder="Choose a theme" /><Select.Icon /></Select.Trigger><Select.Portal><Select.Positioner><Select.Popup><Select.List><Select.Item value="system"><Select.ItemText>System</Select.ItemText><Select.ItemIndicator /></Select.Item><Select.Item value="dark"><Select.ItemText>Dark</Select.ItemText><Select.ItemIndicator /></Select.Item></Select.List></Select.Popup></Select.Positioner></Select.Portal></Select.Root>',
  accessibility:
    'Base UI exposes the trigger as role="combobox" with aria-expanded and aria-controls, the list as role="listbox" and items as role="option" with aria-selected and aria-disabled. The trigger name cannot be enforced by types because it may come from Select.Label or Field.Label; development diagnostics warn when no name source is found. The selected option is marked by an indicator glyph, not color alone.',
} as const;
