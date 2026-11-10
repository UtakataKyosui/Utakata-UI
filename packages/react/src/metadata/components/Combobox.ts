import type { QualityRule } from '../quality.js';

export const comboboxQualityRules = [
  {
    id: 'combobox.input-name',
    requirement:
      'The input exposes role="combobox" with a name that does not depend on its text or placeholder, the Trigger and Clear buttons are named, and the open listbox and options are named without axe violations.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Name the input with Field.Label, a label element, aria-label or aria-labelledby; give Combobox.Trigger and Combobox.Clear an aria-label; resolve development diagnostics.',
    applicability:
      'jsdom render of the input, buttons and an open listbox inside and outside Field.Root.',
    residual:
      'Speech output and name computation by real assistive technology are not measured.',
    criteria: ['1.3.1', '2.5.3', '4.1.2'],
  },
  {
    id: 'combobox.value-form',
    requirement:
      'Without a selection the placeholder is shown. Uncontrolled and controlled values select the matching item and show its label in the input, typing filters the options, emptying the input clears the value, free text that matches no item is never the value, and the named hidden input submits the selected value.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Pass items so Base UI filters and labels them, set name on Root, and control value with value and onValueChange (not by mirroring the input text).',
    applicability:
      'Root with items of value/label objects; uncontrolled, controlled and Field.Root compositions in jsdom.',
    residual:
      'Browser autofill, form restoration and server round trips are not covered.',
    criteria: ['3.3.2', '4.1.2'],
  },
  {
    id: 'combobox.empty-disabled',
    requirement:
      'When no option matches, Combobox.Empty text is shown in its always-mounted status region and Enter selects nothing. A disabled Root cannot be focused or opened, a disabled item cannot be selected, and a read-only Root keeps its value.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Render Combobox.Empty with a localized message inside Combobox.Popup; never hide it with display:none or conditional rendering. Use disabled on Root or Item and readOnly on Root instead of custom handlers.',
    applicability:
      'Root disabled/readOnly, a disabled item and a no-match query.',
    residual: 'Live-region announcements are not measured.',
    criteria: ['3.3.1', '4.1.3'],
  },
  {
    id: 'combobox.ime-composition',
    requirement:
      'While an IME composition is in progress (synthetic composition events, Enter reported as keyCode 229), Enter does not select the highlighted item and the popup stays open; after composition ends, Enter selects it.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Do not add Enter or keydown handlers that bypass Base UI composition handling; do not commit values on every key press.',
    applicability:
      'jsdom with synthetic compositionstart/compositionend and keydown events; not a real IME.',
    residual:
      'Real Japanese IME behavior on each browser and OS is verified separately (combobox.real-ime). Base UI does not track composition on Android.',
    criteria: ['3.2.2'],
  },
  {
    id: 'combobox.keyboard-selection',
    requirement:
      'In a real browser, typing opens the popup and filters options, ArrowDown and ArrowUp move the highlight (aria-activedescendant) while focus stays in the input, Enter selects the highlighted option, fills the input with its label, closes the popup and submits the value, and disabled options are never selected.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Preserve Base UI Combobox keyboard and virtual focus handling; do not add custom key handlers or move DOM focus into the list.',
    applicability:
      'Chromium light and dark with real Tab, typing, ArrowDown, ArrowUp and Enter.',
    residual:
      'Other browsers, physical keyboards and assistive-technology key handling are not covered.',
    criteria: ['2.1.1', '2.4.3', '4.1.2'],
  },
  {
    id: 'combobox.dismiss-focus',
    requirement:
      'In a real browser, Escape with the popup open closes it without changing the value and keeps focus in the input; Escape with the popup closed clears the input and value; an outside press closes the popup without changing the value; the popup opens within the viewport next to the input.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Preserve Base UI dismissal and positioning; do not constrain the popup with custom overflow or z-index rules or swallow Escape.',
    applicability:
      'Chromium light and dark; keyboard Escape and mouse outside press.',
    residual:
      'Collision placement near viewport edges and touch dismissal are not covered.',
    criteria: ['1.4.13', '2.1.1', '3.2.2'],
  },
  {
    id: 'combobox.visual-forced',
    requirement:
      'In a real browser the focused input frame shows a focus ring and, in forced colors, a solid outline of at least 2px; the highlighted option keeps an outline of at least 2px and the selected option shows a check glyph, not color alone; option and input text reach 4.5:1; the Trigger and Clear targets are at least 24x24 CSS px; and the input frame and popup stay inside a 320 CSS px viewport without clipping.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the frame focus ring and outline, the highlighted-option outline, the item indicator and the minimum Trigger and Clear sizes; do not remove them with custom CSS.',
    applicability:
      'Chromium light and dark with the standard theme; forced colors by emulation; a 320 CSS px viewport (not browser zoom).',
    residual:
      'Real 200% zoom, OS high contrast, custom CSS and consumer backgrounds are checked manually (combobox.visual-state).',
    criteria: ['1.4.3', '1.4.10', '1.4.11', '2.4.7', '2.5.8'],
  },
  {
    id: 'combobox.ime-browser',
    requirement:
      'In Chromium with composition emulated through the DevTools protocol, Enter pressed during composition does not select the highlighted option, and Enter after the composition commits does.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Do not intercept keydown before Base UI sees composition state; keep Enter selection inside Base UI.',
    applicability:
      'Chromium light and dark using Input.imeSetComposition and Input.dispatchKeyEvent with keyCode 229.',
    residual:
      'Emulated composition is not a real IME; see combobox.real-ime. Safari and Firefox key reporting differs and is not covered.',
    criteria: ['3.2.2'],
  },
  {
    id: 'combobox.real-ime',
    requirement:
      'With a real IME (for example macOS Japanese input in Safari and Chrome, Microsoft IME on Windows, iOS keyboard), pressing Enter to confirm a conversion does not select an option, and typing after conversion filters correctly.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Record browser, OS, IME, commit and results; leave unverified until performed.',
  },
  {
    id: 'combobox.screen-reader',
    requirement:
      'Screen readers announce the input name and role, expanded state, the highlighted option while arrowing, the selected value and the no-results message.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Record browser, assistive technology, commit and results; leave unverified until performed.',
  },
  {
    id: 'combobox.visual-state',
    requirement:
      'Highlighted, selected, disabled, read-only, invalid and focus states are distinguishable without color alone, long labels wrap legibly, and the Trigger and Clear targets are at least 24x24 CSS px in every supported theme, forced colors and 200% zoom.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check rendered contrast, the item indicator, the frame focus indicator, long labels and forced colors in a real browser.',
  },
] as const satisfies readonly QualityRule[];

export const comboboxManifest = {
  qualityRules: comboboxQualityRules,
  description:
    'A single-selection searchable combobox built on Base UI Combobox: a text input that filters a portalled listbox of options.',
  parts: [
    'Root',
    'InputGroup',
    'Input',
    'Trigger',
    'Clear',
    'Portal',
    'Positioner',
    'Popup',
    'List',
    'Empty',
    'Item',
    'ItemIndicator',
    'Group',
    'GroupLabel',
    'Collection',
  ],
  partProps: {
    Root: 'Base UI ComboboxRootProps without multiple, inline, grid and virtualized (items, value, defaultValue, onValueChange, inputValue, onInputValueChange, open, onOpenChange, name, disabled, required, readOnly, filter, itemToStringLabel, isItemEqualToValue)',
    InputGroup:
      'Base UI ComboboxInputGroupProps; the visual frame around the input and its buttons',
    Input:
      'Base UI ComboboxInputProps (placeholder, aria-label, aria-labelledby); renders role="combobox" and needs a name from Field.Label, a label element or an ARIA attribute',
    Trigger:
      'Base UI ComboboxTriggerProps; a pointer-only button outside the Tab order that needs aria-label or aria-labelledby (visible text is also accepted)',
    Clear:
      'Base UI ComboboxClearProps; a pointer-only button outside the Tab order, rendered only while a value exists, that needs aria-label or aria-labelledby',
    Portal: 'Base UI ComboboxPortalProps',
    Positioner: 'Base UI ComboboxPositionerProps (side, align, sideOffset)',
    Popup: 'Base UI ComboboxPopupProps',
    List: 'Base UI ComboboxListProps; renders role="listbox" and accepts a render function over the filtered items',
    Empty:
      'Base UI ComboboxEmptyProps; an always-mounted status region that shows its children only when no item matches',
    Item: 'Base UI ComboboxItemProps (value, disabled)',
    ItemIndicator: 'Base UI ComboboxItemIndicatorProps',
    Group: 'Base UI ComboboxGroupProps (items)',
    GroupLabel: 'Base UI ComboboxGroupLabelProps',
    Collection:
      'Base UI ComboboxCollectionProps; renders the items of one Group from a render function',
  },
  defaults: {
    disabled: false,
    required: false,
    readOnly: false,
    defaultOpen: false,
    openOnInputClick: true,
    autoHighlight: false,
  },
  composition:
    'Combobox.Root (pass items as value/label objects so Base UI filters, labels and submits them) contains Combobox.InputGroup > Combobox.Input with optional Combobox.Clear and Combobox.Trigger, then Combobox.Portal > Positioner > Popup > Empty + List > Item (+ ItemIndicator). Render the List children as a function over the filtered items. Name the input with Field.Label in Field.Root (put Combobox.Root inside it), a label element with htmlFor, aria-label or aria-labelledby; Combobox.Label is not provided because Base UI labels only the Trigger with it. Put a localized message in Combobox.Empty. Selection is single only; typed text that matches no item is not a value. A controlled value is the item object itself; pass isItemEqualToValue when the object is recreated on each render. Use Select for a fixed list without search and NativeSelect for the native picker.',
  avoid: [
    'Do not use the placeholder or the current text as the only name of the input.',
    'Do not implement multiple selection, chips, creatable entries or asynchronous options with Combobox.',
    'Do not add Enter, Escape or arrow-key handlers, or move DOM focus into the list; Base UI keeps focus in the input and tracks the highlighted option with aria-activedescendant.',
    'Do not hide Combobox.Empty with display:none, hidden or conditional rendering.',
    'Do not treat the input text as the submitted value; submit the selected value through name on Root.',
  ],
  example:
    '<Field.Root><Field.Label>Fruit</Field.Label><Combobox.Root name="fruit" items={[{ value: "apple", label: "Apple" }, { value: "banana", label: "Banana" }]}><Combobox.InputGroup><Combobox.Input placeholder="Search fruit" /><Combobox.Clear aria-label="Clear" /><Combobox.Trigger aria-label="Show options" /></Combobox.InputGroup><Combobox.Portal><Combobox.Positioner><Combobox.Popup><Combobox.Empty>No fruit found</Combobox.Empty><Combobox.List>{(item) => <Combobox.Item key={item.value} value={item}>{item.label}<Combobox.ItemIndicator /></Combobox.Item>}</Combobox.List></Combobox.Popup></Combobox.Positioner></Combobox.Portal></Combobox.Root></Field.Root>',
  accessibility:
    'Base UI exposes the input as role="combobox" with aria-expanded, aria-controls and aria-activedescendant, the list as role="listbox" and items as role="option" with aria-selected and aria-disabled. Focus stays in the input; the highlighted option is conveyed by aria-activedescendant and a highlight style with an outline, and the selected option by an indicator glyph, not color alone. Enter while an IME composition is in progress does not select. The input name cannot be enforced by types because it may come from Field.Label or a label element; Trigger and Clear names are required by types, and development diagnostics warn when the input, Trigger or Clear has no name source. Consumers own the label text, the no-results message and any asynchronous loading announcements.',
} as const;
