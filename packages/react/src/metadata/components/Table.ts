import type { QualityRule } from '../quality.js';

export const tableQualityRules = [
  {
    id: 'table.semantics',
    requirement:
      'Parts render native table, caption, thead, tbody, tfoot, tr, th and td elements so the table, its caption and row/column headers (scope) are exposed.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Compose Table.Root with Table.Caption and Table.Head scope="col" or scope="row"; do not replace parts with div grids.',
  },
  {
    id: 'table.scroll-region',
    requirement:
      'Table.Container is the only scroller: a named region that is keyboard focusable, while Table.Root keeps native table semantics.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Name Table.Container with aria-label or aria-labelledby (for example the Caption id); do not hide cells at narrow widths.',
  },
  {
    id: 'table.cell-controls',
    requirement:
      'Links and buttons inside cells keep their names and stay in normal Tab order; empty states span all columns with colSpan.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Use Button or native links inside Table.Cell with specific text; set colSpan to the column count for empty-state rows.',
  },
  {
    id: 'table.reflow-theme',
    requirement:
      'At 320 CSS px, 200% zoom and with long text, the table scrolls horizontally inside Container without clipping, and borders, headers and focus stay visible in every theme and forced colors.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check narrow viewports, browser zoom, keyboard scrolling of the focused region, dark theme and forced colors in a real browser. Two-dimensional tables are a reflow exception; record it.',
  },
  {
    id: 'table.screen-reader',
    requirement:
      'Screen readers announce the caption, dimensions and the matching row/column headers while navigating cells.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Record NVDA + Firefox and VoiceOver + Safari table navigation results.',
  },
] as const satisfies readonly QualityRule[];

export const tableManifest = {
  qualityRules: tableQualityRules,
  description:
    'A static, semantic data table with a named horizontal scroll container.',
  parts: [
    'Container',
    'Root',
    'Caption',
    'Header',
    'Body',
    'Footer',
    'Row',
    'Head',
    'Cell',
  ],
  partProps: {
    Container:
      'native section props; requires aria-label or aria-labelledby; renders a focusable region (tabIndex=0)',
    Root: 'native table props',
    Caption: 'native caption props',
    Header: 'native thead props',
    Body: 'native tbody props',
    Footer: 'native tfoot props',
    Row: 'native tr props',
    Head: 'native th props (scope="col" | "row" | "colgroup" | "rowgroup")',
    Cell: 'native td props (colSpan, rowSpan)',
  },
  composition:
    'Table.Container > Table.Root > Table.Caption, Table.Header/Body/Footer > Table.Row > Table.Head | Table.Cell. Only Container scrolls horizontally; it is always a named, focusable region so keyboard users can scroll an overflowing table. Sorting, selection, pagination and virtualization are composed by the consumer (Pagination is independent). Numeric columns use data-align="end" or className for alignment.',
  avoid: [
    'Do not use Table for layout.',
    'Do not hide columns or cells at narrow widths; let Container scroll.',
    'Do not omit Table.Caption or a Container name; reference the caption id from Container aria-labelledby.',
  ],
  example:
    '<Table.Container aria-labelledby="invoices"><Table.Root><Table.Caption id="invoices">請求一覧</Table.Caption><Table.Header><Table.Row><Table.Head scope="col">番号</Table.Head><Table.Head scope="col">金額</Table.Head></Table.Row></Table.Header><Table.Body><Table.Row><Table.Head scope="row">INV-001</Table.Head><Table.Cell data-align="end">1,000円</Table.Cell></Table.Row></Table.Body></Table.Root></Table.Container>',
  accessibility:
    'Native table semantics expose captions and header relationships. Container is a named region with tabIndex=0 so it can be scrolled with arrow keys in browsers that do not focus scroll containers. Consumers supply caption text, header scope and meaningful cell control labels.',
} as const;
