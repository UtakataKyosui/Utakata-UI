import type { QualityRule } from '../quality.js';

export const sidebarQualityRules = [
  {
    id: 'sidebar.landmark',
    requirement:
      'Sidebar.Root is a nav landmark named by aria-label or aria-labelledby; menu items are list items, the current link exposes aria-current="page" (only links marked current), and a Group with a GroupLabel is a group named by that label.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Name the sidebar (for example "Main"), mark only the link to the current page with current, and put the visible group name in Sidebar.GroupLabel; resolve development diagnostics.',
  },
  {
    id: 'sidebar.trigger-state',
    requirement:
      'Sidebar.Trigger is a named button whose name does not change with state; it exposes aria-expanded and, while the sidebar exists, aria-controls referencing it, and toggling hides the collapsed sidebar from the accessibility tree and Tab order. open, defaultOpen and onOpenChange are honored.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Give an icon-only trigger aria-label or aria-labelledby, keep the label constant and let the sidebar own the collapsed state through Sidebar.Provider.',
  },
  {
    id: 'sidebar.narrow-sheet',
    requirement:
      'Below the breakpoint the sidebar is a closed modal Sheet on the left: the trigger opens a named dialog containing the navigation and a visible close control; Escape and the close control close it and return focus to the trigger; opening and closing does not change the wide-viewport state.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Keep Sidebar.Root on Sheet and Sidebar.Trigger inside Sidebar.Provider; do not re-implement dialog focus or dismissal.',
  },
  {
    id: 'sidebar.keyboard',
    requirement:
      'In a real browser at a wide viewport Tab reaches each sidebar link and the trigger in document order, Enter and Space on the trigger collapse and expand the sidebar, collapsed links leave the Tab order and are not focusable, and links activate with Enter.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep hidden on the collapsed navigation; do not add tabindex or key handlers to links or the trigger.',
    applicability:
      'Wide viewport, expanded and collapsed, with Group labels, a current link and a labelled trigger.',
    residual:
      'Screen reader output, consumer routing and persisted state are separate evidence.',
    criteria: ['2.1.1', '2.4.3', '2.4.7', '4.1.2'],
  },
  {
    id: 'sidebar.responsive-focus',
    requirement:
      'In a real browser crossing the breakpoint keeps a usable layout and focus: the narrow trigger opens the sheet with focus inside, Escape, the close control and a backdrop press close it and return focus to the trigger, and resizing while focus is in the sidebar moves focus to the trigger instead of the page body.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the Provider breakpoint handling and the Sheet dismissal; do not unmount the trigger when the layout changes.',
    applicability:
      'Chromium viewport resize across the default 768px breakpoint with a focused sidebar link and an open sheet.',
    residual:
      'Real orientation change, browser zoom reflow and physical touch devices stay manual.',
    criteria: ['1.3.4', '1.4.10', '2.1.1', '2.4.3', '3.2.1'],
  },
  {
    id: 'sidebar.reflow-forced',
    requirement:
      'In a real browser the wide sidebar and the narrow sheet add no horizontal page overflow at 320 CSS px with 200% root text size and long English and Japanese labels, the current link is distinguishable without color (bold with an inline-start bar), and in forced colors the focused link keeps a system-color outline of at least 2px and the current marker stays visible.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep overflow-wrap on menu items, the current marker border and the forced-colors outline fallback; do not set fixed heights on sidebar content.',
    applicability:
      'Chromium with root font scaling and forced-colors emulation; text size scaling is not browser zoom.',
    residual:
      'Real browser zoom, real high-contrast modes and rendered contrast in custom themes stay manual.',
    criteria: ['1.4.1', '1.4.4', '1.4.10', '1.4.11', '2.4.7', '2.4.11'],
  },
  {
    id: 'sidebar.platform-manual',
    requirement:
      'Landmark, current-page and expanded-state announcements, the sheet entry and return announcements, real 200% browser zoom, real high-contrast modes and touch operation on physical devices are verified in real browsers with screen readers.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Record browser, assistive technology, theme and findings before release; leave unverified until performed.',
  },
] as const satisfies readonly QualityRule[];

export const sidebarManifest = {
  qualityRules: sidebarQualityRules,
  description:
    'A named navigation sidebar that collapses on wide viewports and becomes a modal Sheet on narrow viewports, composed from Sheet and native navigation elements.',
  parts: [
    'Provider',
    'Root',
    'Trigger',
    'Header',
    'Content',
    'Footer',
    'Group',
    'GroupLabel',
    'Menu',
    'MenuItem',
    'MenuButton',
  ],
  partProps: {
    Provider:
      'native div props plus open, defaultOpen, onOpenChange (wide viewport) and mobileBreakpoint',
    Root: 'native nav props plus closeLabel; requires aria-label or aria-labelledby',
    Trigger:
      'Utakata-UI ButtonProps (iconOnly requires aria-label or aria-labelledby); aria-expanded and aria-controls are set by the component',
    Header: 'native div props',
    Content: 'native div props; scrolls when the content is long',
    Footer: 'native div props',
    Group: 'native div props; named by GroupLabel',
    GroupLabel: 'native div props',
    Menu: 'native ul props',
    MenuItem: 'native li props',
    MenuButton:
      'native a props + Base UI render plus current; requires href or render',
  },
  props: {
    open: {
      type: 'boolean (wide viewport expansion, controlled)',
      default: 'uncontrolled',
    },
    defaultOpen: { type: 'boolean', default: true },
    mobileBreakpoint: { type: 'number (CSS px)', default: 768 },
    closeLabel: {
      type: 'ReactNode (narrow close control text)',
      default: '閉じる',
    },
    current: { type: 'boolean (Sidebar.MenuButton)', default: false },
  },
  defaults: { open: true, mobileOpen: false, mobileBreakpoint: 768 },
  composition:
    'Wrap the page layout in Sidebar.Provider. Place Sidebar.Trigger (in the page header, outside the collapsible sidebar) and Sidebar.Root, named for example "Main", beside your main content. Inside Root use Header, Content with Groups (GroupLabel then Menu > MenuItem > MenuButton) and Footer. Mark the link to the current page with current. Use the --ui-sidebar-width custom property for the wide width. useSidebar() returns open, setOpen, isMobile and expanded for custom controls. Provide your own main landmark and skip link; collapsible groups compose with Collapsible. The sidebar is not an icon rail, has no resize handle and no keyboard shortcut.',
  avoid: [
    'Do not use the sidebar for menus of actions; use DropdownMenu or Menubar.',
    'Do not omit the sidebar name or the trigger name, and do not change the trigger label with its state; aria-expanded exposes it.',
    'Do not mark more than the current location with current, and do not rely on color to show the current page.',
    'Do not re-implement dialog focus, dismissal or the breakpoint behavior; Sidebar.Root reuses Sheet.',
    'Do not restore a persisted expanded state after first paint; persistence is the consumer responsibility.',
  ],
  example:
    '<Sidebar.Provider><Sidebar.Root aria-label="Main"><Sidebar.Content><Sidebar.Group><Sidebar.GroupLabel>Project</Sidebar.GroupLabel><Sidebar.Menu><Sidebar.MenuItem><Sidebar.MenuButton href="/" current>Overview</Sidebar.MenuButton></Sidebar.MenuItem></Sidebar.Menu></Sidebar.Group></Sidebar.Content></Sidebar.Root><main><Sidebar.Trigger aria-label="Main menu" iconOnly>Menu</Sidebar.Trigger></main></Sidebar.Provider>',
  accessibility:
    'Sidebar.Root is a named nav landmark; when collapsed on wide viewports it is hidden from assistive technology and the Tab order. Sidebar.Trigger is a named button exposing aria-expanded and aria-controls. Narrow viewports use the modal Sheet, so Base UI Dialog keeps focus trapping, Escape, backdrop dismissal and focus return; the close control has visible text. The current link exposes aria-current="page" and a non-color marker. Names are required by types for Root and an icon-only Trigger; development diagnostics and axe checks cover dynamic names. Consumers own link destinations, routing, the main landmark, skip links and persisted state.',
} as const;
