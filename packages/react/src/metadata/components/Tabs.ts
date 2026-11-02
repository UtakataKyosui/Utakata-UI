import type { QualityRule } from '../quality.js';

export const tabsQualityRules = [
  {
    id: 'tabs.roles-relationships',
    requirement:
      'Tabs expose tablist/tab/tabpanel roles, aria-selected on the active tab, aria-controls from each tab to its panel, and each panel is named by its tab.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Pair every Tabs.Tab with a Tabs.Panel of the same value inside Tabs.Root and give the tabs visible text.',
  },
  {
    id: 'tabs.keyboard-navigation',
    requirement:
      'Arrow keys follow the orientation, Home/End move to the first/last tab, disabled tabs stay focusable with aria-disabled but cannot be selected (Base UI behavior), and with manual activation focus alone does not select.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Keep Base UI Tabs.List keyboard handling; set orientation on Tabs.Root and activateOnFocus on Tabs.List only when panels render cheaply.',
  },
  {
    id: 'tabs.selection-hidden-panels',
    requirement:
      'The explicit initial value is selected, controlled value changes update the selection, and inactive panel content is absent from the accessibility tree and Tab order, including with keepMounted.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Pass value or defaultValue (required by the types), use onValueChange for controlled state and do not reveal inactive panels with custom CSS.',
  },
  {
    id: 'tabs.real-keyboard',
    requirement:
      'With real keyboard input, Tab enters the selected tab, arrow keys move between tabs, Enter/Space activate in manual mode and Tab then moves into the panel.',
    verification: 'manual',
    severity: 'error',
    remediation:
      'Verify in each supported browser and with a screen reader; record the results.',
  },
  {
    id: 'tabs.visual-states',
    requirement:
      'Selection is shown by an underline and weight rather than color alone and stays distinct from the focus ring in horizontal and vertical layouts, every theme, forced colors and 200% zoom.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check rendered contrast, overflow at narrow widths, forced colors and reduced motion in a real browser.',
  },
] as const satisfies readonly QualityRule[];

export const tabsManifest = {
  qualityRules: tabsQualityRules,
  description:
    'Switches between related panels with a tab list, built on Base UI Tabs.',
  parts: ['Root', 'List', 'Tab', 'Panel', 'Indicator'],
  partProps: {
    Root: 'Base UI TabsRootProps (value or defaultValue required, onValueChange, orientation)',
    List: 'Base UI TabsListProps (activateOnFocus, loopFocus); add aria-label or aria-labelledby',
    Tab: 'Base UI TabsTabProps (value, disabled); renders a button',
    Panel: 'Base UI TabsPanelProps (value, keepMounted)',
    Indicator: 'Base UI TabsIndicatorProps; optional animated marker',
  },
  props: {
    orientation: { type: 'horizontal | vertical', default: 'horizontal' },
    activateOnFocus: {
      type: 'boolean (List); false selects on Enter/Space or click',
      default: false,
    },
  },
  orientations: ['horizontal', 'vertical'],
  defaults: {
    orientation: 'horizontal',
    activateOnFocus: false,
    loopFocus: true,
    keepMounted: false,
  },
  composition:
    'Tabs.Root (with value or defaultValue) contains a Tabs.List of Tabs.Tab elements and one Tabs.Panel per tab value. Name the list with aria-label when the context is not obvious. Tabs.Indicator is optional decoration inside Tabs.List.',
  avoid: [
    'Do not use Tabs for page navigation; use links.',
    'Do not omit the initial value; the first tab is not selected implicitly by the public types.',
    'Do not put the only copy of essential content in an inactive panel without telling users it exists.',
  ],
  example:
    '<Tabs.Root defaultValue="profile"><Tabs.List aria-label="Settings"><Tabs.Tab value="profile">Profile</Tabs.Tab><Tabs.Tab value="security">Security</Tabs.Tab></Tabs.List><Tabs.Panel value="profile">Profile settings</Tabs.Panel><Tabs.Panel value="security">Authentication settings</Tabs.Panel></Tabs.Root>',
  accessibility:
    'Base UI provides tab roles, aria-selected, tab/panel references, roving focus with arrow/Home/End keys and manual activation by default. Types require an explicit initial value. Development diagnostics warn about unnamed tabs. Consumers name the tab list and write tab labels.',
} as const;
