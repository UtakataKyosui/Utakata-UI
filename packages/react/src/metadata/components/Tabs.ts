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
    id: 'tabs.keyboard',
    requirement:
      'In a real browser Tab enters the selected tab, arrow keys move focus between tabs (disabled tabs stay focusable but cannot be selected), Home and End move to the first and last tab, Enter and Space select in manual mode while focus alone does not, and Tab then moves into the active panel.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Preserve Base UI Tabs keyboard handling; do not add custom key handlers or tabindex values.',
  },
  {
    id: 'tabs.indicator-layout',
    requirement:
      'In a real browser the selected tab differs from the others by weight and an underline rather than color alone, and the indicator stays aligned with the selected tab when the tab list wraps onto several rows and in the vertical orientation.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the indicator anchored with --active-tab-left/top/width/height and the selected tab weight and underline.',
  },
  {
    id: 'tabs.zoom-theme',
    requirement:
      'At real 200% browser zoom and in real high-contrast modes the tabs, indicator and focus ring stay distinguishable.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check browser zoom, dark theme and high-contrast modes in a real browser; leave unverified until performed.',
  },
  {
    id: 'tabs.screen-reader',
    requirement:
      'Screen readers announce the tab list name, each tab name, position and selected state, and the panel content after activation.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Record NVDA + Firefox and VoiceOver + Safari results; leave unverified until performed.',
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
