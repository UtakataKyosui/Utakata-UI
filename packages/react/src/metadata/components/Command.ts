import type { QualityRule } from '../quality.js';

export const commandQualityRules = [
  {
    id: 'command.input-name',
    requirement:
      'The input exposes role="combobox" with a name that does not depend on its text or placeholder, the always-visible list exposes role="listbox" with named groups and role="option" items, and a Dialog-hosted palette has no axe violations.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Name the input with a label element, aria-label or aria-labelledby; give each Command.Group a Command.GroupLabel; name the Dialog with Dialog.Title; resolve development diagnostics.',
    applicability:
      'jsdom render of the input and grouped list on its own and inside an open Dialog.',
    residual:
      'Speech output and name computation by real assistive technology are not measured.',
    criteria: ['1.3.1', '2.5.3', '4.1.2'],
  },
  {
    id: 'command.search-empty-disabled',
    requirement:
      'Typing filters the commands case-insensitively and hides groups without a match; clearing the query restores the whole list. When nothing matches, Command.Empty text is shown in its always-mounted status region and Enter runs nothing. A disabled command is exposed with aria-disabled and never runs from the pointer or the keyboard.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Pass items so Base UI filters the commands; render Command.Empty with a localized message inside Command.Root and never hide it with display:none or conditional rendering; use disabled on Command.Item instead of custom handlers.',
    applicability:
      'Root with grouped items of value/label objects, a no-match query and a disabled item in jsdom.',
    residual: 'Live-region announcements are not measured.',
    criteria: ['3.3.1', '4.1.2', '4.1.3'],
  },
  {
    id: 'command.run-item',
    requirement:
      'ArrowDown and ArrowUp move the highlight (aria-activedescendant) while focus stays in the input, Enter runs the highlighted command through its onClick, a pointer click runs it too, nothing runs before a command is highlighted, and the query is not replaced by the executed command label.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Run commands from Command.Item onClick only; do not add Enter or arrow-key handlers or move DOM focus into the list.',
    applicability:
      'jsdom with synthetic keydown and click events on a grouped list.',
    residual:
      'DOM events are not browser keyboard input; real keys are covered by command.keyboard-execute.',
    criteria: ['2.1.1', '4.1.2'],
  },
  {
    id: 'command.dialog-composition',
    requirement:
      'Composed inside an open Dialog, the palette is named by Dialog.Title, typing, arrowing and Enter run a command, the consumer closes the Dialog from onClick, and focus returns to the trigger.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Compose Command.Root inside Dialog.Popup with a Dialog.Title, control the Dialog with open and onOpenChange, and close it from the command onClick.',
    applicability:
      'Controlled Dialog.Root with Dialog.Trigger and a Command list in jsdom.',
    residual:
      'Focus behavior in real browsers is covered by command.dialog-focus.',
    criteria: ['2.4.3', '3.2.2'],
  },
  {
    id: 'command.keyboard-execute',
    requirement:
      'In a real browser, Tab reaches the input, typing filters the commands, ArrowDown and ArrowUp move the highlight (aria-activedescendant) while DOM focus stays in the input, disabled commands are never run, and Enter runs the highlighted command once.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Preserve Base UI Autocomplete keyboard and virtual focus handling; do not add custom key handlers or move DOM focus into the list.',
    applicability:
      'Chromium light and dark with real Tab, typing, ArrowDown, ArrowUp and Enter on a standalone list.',
    residual:
      'Other browsers, physical keyboards and assistive-technology key handling are not covered.',
    criteria: ['2.1.1', '2.4.3', '4.1.2'],
  },
  {
    id: 'command.dialog-focus',
    requirement:
      'In a real browser, opening the palette from its trigger moves focus into the input and keeps the page behind it inert; Enter on a highlighted command runs it, closes the Dialog and returns focus to the trigger; Escape closes the Dialog without running a command and returns focus to the trigger.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Preserve Base UI Dialog focus management and dismissal; do not swallow Escape or move focus when a command runs, and close the Dialog from the command onClick.',
    applicability:
      'Chromium light and dark with a real trigger click or key press, typing, Enter and Escape.',
    residual:
      'Other browsers, touch dismissal and assistive-technology focus announcements are not covered.',
    criteria: ['2.1.1', '2.4.3', '3.2.2'],
  },
  {
    id: 'command.visual-forced',
    requirement:
      'In a real browser the focused input shows a focus ring and, in forced colors, a solid outline of at least 2px; the highlighted command keeps an outline of at least 2px; command and input text reach 4.5:1; group labels reach 4.5:1; and the list stays inside a 320 CSS px viewport without clipping.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the input focus indicator, the highlighted-item outline and the surface border; do not remove them with custom CSS.',
    applicability:
      'Chromium light and dark with the standard theme; forced colors by emulation; a 320 CSS px viewport (not browser zoom).',
    residual:
      'Real 200% zoom, OS high contrast, custom CSS and consumer backgrounds are checked manually (command.visual-state).',
    criteria: ['1.4.3', '1.4.10', '1.4.11', '2.4.7'],
  },
  {
    id: 'command.real-ime',
    requirement:
      'With a real IME (for example macOS Japanese input in Safari and Chrome, Microsoft IME on Windows, iOS keyboard), pressing Enter to confirm a conversion does not run a command, and typing after conversion filters correctly.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Record browser, OS, IME, commit and results; leave unverified until performed.',
  },
  {
    id: 'command.screen-reader',
    requirement:
      'Screen readers announce the input name and role, the highlighted command while arrowing, group names, the no-results message and the Dialog title when the palette opens.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Record browser, assistive technology, commit and results; leave unverified until performed.',
  },
  {
    id: 'command.visual-state',
    requirement:
      'Highlighted, disabled and focus states are distinguishable without color alone, long command labels and shortcuts wrap legibly, and the palette fits every supported theme, forced colors and 200% zoom.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check rendered contrast, long labels, the Dialog position on small screens and forced colors in a real browser.',
  },
] as const satisfies readonly QualityRule[];

export const commandManifest = {
  qualityRules: commandQualityRules,
  description:
    'A searchable, always-visible list of commands built on Base UI Autocomplete (inline list) that is typically hosted in a Dialog as a command palette.',
  parts: [
    'Root',
    'Panel',
    'Input',
    'List',
    'Empty',
    'Group',
    'GroupLabel',
    'Item',
    'Separator',
    'Shortcut',
    'Collection',
  ],
  partProps: {
    Root: 'Base UI AutocompleteRootProps without inline, open, defaultOpen, onOpenChange, name, form, required and readOnly (items, filter, value, defaultValue, onValueChange, autoHighlight, keepHighlight, highlightItemOnHover, disabled)',
    Panel:
      'div props; the visual surface around the input and list (border, radius, shadow)',
    Input:
      'Base UI AutocompleteInputProps (placeholder, aria-label, aria-labelledby); renders role="combobox" and needs a name from a label element or an ARIA attribute',
    List: 'Base UI AutocompleteListProps; renders role="listbox" and accepts a render function over the filtered items or groups',
    Empty:
      'Base UI AutocompleteEmptyProps; an always-mounted status region that shows its children only when no item matches',
    Group: 'Base UI AutocompleteGroupProps (items)',
    GroupLabel:
      'Base UI AutocompleteGroupLabelProps; names the Group for assistive technology',
    Item: 'Base UI AutocompleteItemProps (value, disabled, onClick); onClick runs the command on a pointer click and on Enter while the item is highlighted',
    Separator: 'Base UI AutocompleteSeparatorProps',
    Shortcut:
      'span props; a decorative hint such as a key combination that must not be the only way to run the command',
    Collection:
      'Base UI AutocompleteCollectionProps; renders the items of one Group from a render function',
  },
  defaults: {
    disabled: false,
    autoHighlight: false,
    keepHighlight: false,
    highlightItemOnHover: true,
  },
  composition:
    'Command.Root (pass items, or groups of { value, items }, so Base UI filters them) contains Command.Panel > Command.Input, Command.Empty and Command.List > Command.Group (GroupLabel + Collection > Item). The list is always rendered inline: there is no popup, Portal, Positioner, open state, form value or selection. Run a command from Command.Item onClick (pointer click and Enter on the highlighted item) and decide yourself whether to close the host. For a command palette put Command.Root inside Dialog.Popup next to a Dialog.Title and control Dialog.Root with open and onOpenChange so onClick can close it; the Dialog returns focus to its trigger. Opening the Dialog with a global shortcut such as Ctrl/Cmd+K is the consumer responsibility and the command list must stay reachable without it. Name the input with a label element, aria-label or aria-labelledby; Field.Label is not applicable because a command list is not a form field. Put a localized message in Command.Empty. Use Combobox to choose and submit one value from a list, Select for a fixed list without search, and DropdownMenu for a small action menu without search.',
  avoid: [
    'Do not use the placeholder as the only name of the input.',
    'Do not use Command to pick and submit a value; use Combobox, which owns a selected value, a popup and form submission.',
    'Do not add Enter, Escape or arrow-key handlers, or move DOM focus into the list; Base UI keeps focus in the input and tracks the highlighted command with aria-activedescendant.',
    'Do not hide Command.Empty with display:none, hidden or conditional rendering.',
    'Do not rely on a keyboard shortcut or Command.Shortcut text as the only way to open the palette or run a command.',
    'Do not run destructive commands without confirmation; compose an AlertDialog after the command.',
  ],
  example:
    '<Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger>Open palette</Dialog.Trigger><Dialog.Portal><Dialog.Backdrop /><Dialog.Popup><Dialog.Title>Command palette</Dialog.Title><Command.Root items={groups}><Command.Panel><Command.Input aria-label="Search commands" /><Command.Empty>No commands found</Command.Empty><Command.List>{(group) => <Command.Group key={group.value} items={group.items}><Command.GroupLabel>{group.value}</Command.GroupLabel><Command.Collection>{(item) => <Command.Item key={item.value} value={item} onClick={() => { run(item.value); setOpen(false); }}>{item.label}</Command.Item>}</Command.Collection></Command.Group>}</Command.List></Command.Panel></Command.Root></Dialog.Popup></Dialog.Portal></Dialog.Root>',
  accessibility:
    'Base UI exposes the input as role="combobox" with aria-expanded="true", aria-controls and aria-activedescendant, the list as role="listbox", groups as role="group" named by their GroupLabel, and items as role="option" with aria-disabled. Focus stays in the input; the highlighted command is conveyed by aria-activedescendant and a highlight style with an outline, not color alone. Enter while an IME composition is in progress does not run a command. The input name cannot be enforced by types because it may come from a label element; development diagnostics warn when it has no name source. Inside a Dialog, focus moves to the input on open and returns to the trigger on close. Consumers own the label text, the no-results message, the Dialog title, the shortcut that opens the palette, the result of each command and any announcement of that result.',
} as const;
