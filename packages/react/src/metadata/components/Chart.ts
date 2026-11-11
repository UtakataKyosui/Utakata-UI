import type { QualityRule } from '../quality.js';

export const chartQualityRules = [
  {
    id: 'chart.structure',
    requirement:
      'Chart.Root renders a figure named by its Chart.Caption (figcaption, referenced with aria-labelledby) and described by Chart.Description when present; Chart.Plot is a named image (role="img") that is not focusable; Chart.Legend and Chart.LegendItem render a list whose items show a series marker and visible text; Chart.Data is a native details disclosure whose summary is keyboard operable and whose content can hold a data table.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Compose Chart.Root with Chart.Caption, Chart.Plot with aria-label or aria-labelledby, Chart.Legend and Chart.Data; do not add role or tabIndex to Chart.Plot or Chart.Root.',
  },
  {
    id: 'chart.series-identification',
    requirement:
      'Each series is identified by a distinct marker shape plus visible text, never by color alone, and legend markers are hidden from assistive technology so the series name is announced once.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Give every series its own series number, draw data points with the same shape as the series marker, and vary line dash patterns with --ui-chart-dash-N; do not rely on --ui-chart-series-N alone.',
  },
  {
    id: 'chart.data-alternative',
    requirement:
      'Every chart value is available as text in a data table inside Chart.Data that is reachable and operable with the keyboard, with a caption, column headers and row headers.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Place a Table.Container with Table.Caption and scoped Table.Head cells inside Chart.Data; do not leave values only in hover tooltips or the graphic.',
  },
  {
    id: 'chart.keyboard-theme-motion',
    requirement:
      'In a real browser Tab reaches the Chart.Data summary, Enter and Space open and close it and reveal the table, a visible focus indicator remains in forced colors, legend marker shapes differ in every supported theme, series colors keep at least 3:1 contrast against the chart background in light and dark themes, forced colors keep every marker visible, content reflows at 320 CSS px without page overflow, and reduced motion sets --ui-chart-duration to 0s.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep the native summary, the --ui-chart-series-N tokens, the forced-colors rules and the --ui-chart-duration override; make custom renderers read the duration token.',
  },
  {
    id: 'chart.zoom-assistive',
    requirement:
      'At real 200% browser zoom the chart, legend and data table reflow without loss of information, and screen readers announce the figure name, description, legend items and data table headers; description quality and whether the data table equals the plotted values stay a consumer responsibility.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check browser zoom, NVDA + Firefox and VoiceOver + Safari reading order in a real browser; leave unverified until performed.',
  },
] as const satisfies readonly QualityRule[];

export const chartManifest = {
  qualityRules: chartQualityRules,
  description:
    'A dependency-free accessible shell for charts: figure, caption, text description, series legend with shape markers and a data table alternative. Any renderer can be placed inside.',
  parts: [
    'Root',
    'Caption',
    'Description',
    'Plot',
    'Legend',
    'LegendItem',
    'Marker',
    'Data',
  ],
  partProps: {
    Root: 'native figure props; role is not accepted',
    Caption: 'native figcaption props; visible chart title',
    Description: 'native p props; referenced by Root as its description',
    Plot: 'native div props; requires aria-label or aria-labelledby; renders role="img"; role and tabIndex are not accepted',
    Legend: 'native ul props',
    LegendItem:
      'native li props + series (required); children (visible series name) required',
    Marker:
      'SVG props + series (required); decorative; renders the shape of the series for legends and HTML overlays',
    Data: 'native details props + summary (required visible text); children are the data table',
  },
  props: {
    series: {
      type: '1 | 2 | 3 | 4 | 5 | 6 (Chart.LegendItem, Chart.Marker)',
    },
  },
  series: ['1', '2', '3', '4', '5', '6'],
  seriesMarkers: {
    '1': 'circle',
    '2': 'square',
    '3': 'triangle',
    '4': 'diamond',
    '5': 'cross',
    '6': 'ring',
  },
  composition:
    'Chart.Root > Chart.Caption, Chart.Description, Chart.Plot (your SVG, canvas or library output), Chart.Legend > Chart.LegendItem, Chart.Data > Table.Container. No charting library is bundled: draw with inline SVG or any renderer inside Chart.Plot. Series colors come from --ui-chart-series-1..6 and line dash patterns from --ui-chart-dash-1..6 (dark theme and reduced motion are handled by the tokens); animations should use --ui-chart-duration, which is 0s under prefers-reduced-motion. Draw data points with the shape listed in seriesMarkers (1 circle, 2 square, 3 triangle, 4 diamond, 5 cross, 6 ring) so they match the legend; Chart.Marker renders that shape for legends and HTML overlays. Keep interactive controls outside Chart.Plot.',
  avoid: [
    'Do not identify series by color alone; use the series number so the shape and dash pattern differ.',
    'Do not put values only in hover tooltips; every value belongs in the Chart.Data table.',
    'Do not put focusable controls inside Chart.Plot; it is exposed as a single image.',
    'Do not omit Chart.Description for charts that show trends; state the main finding as text.',
  ],
  example:
    '<Chart.Root><Chart.Caption>月別の訪問数</Chart.Caption><Chart.Description>4月から6月にかけて訪問数は増加しました。</Chart.Description><Chart.Plot aria-label="月別の訪問数の折れ線グラフ"><svg viewBox="0 0 100 40"><polyline points="0,30 50,20 100,5" fill="none" stroke="var(--ui-chart-series-1)" strokeWidth="2" /></svg></Chart.Plot><Chart.Legend><Chart.LegendItem series="1">訪問数</Chart.LegendItem></Chart.Legend><Chart.Data summary="データ表を表示"><Table.Container aria-label="月別の訪問数"><Table.Root>…</Table.Root></Table.Container></Chart.Data></Chart.Root>',
  accessibility:
    'A figure named by its figcaption (aria-labelledby) and described by a text summary; the plot is one named image so renderer internals are not read; series are identified by marker shape and visible legend text; all values are available in a native details disclosure with a data table. Consumers supply the caption, description, plot name, table contents and the check that the table equals the plotted data.',
} as const;

export type ChartSeries = (typeof chartManifest.series)[number];
