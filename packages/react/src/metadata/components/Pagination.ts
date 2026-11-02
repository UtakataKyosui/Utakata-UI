import type { QualityRule } from '../quality.js';

export const paginationQualityRules = [
  {
    id: 'pagination.structure',
    requirement:
      'Root is a named nav landmark containing a list; page links keep their href and exactly one active link exposes aria-current="page".',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Compose Root > List > Item > Link with href; set active on the current page only and give Root a specific aria-label when several paginations exist.',
  },
  {
    id: 'pagination.disabled-direction',
    requirement:
      'In a real browser a disabled Previous/Next has no href, is skipped by Tab, exposes aria-disabled and does not navigate or run click handlers on click; enabled links are visited by Tab in order and navigate on Enter.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Use disabled on the first/last page instead of removing the control or keeping href; keep the default or a specific visible name.',
  },
  {
    id: 'pagination.ellipsis',
    requirement:
      'Ellipsis is not interactive and exposes a text equivalent for skipped pages while hiding the visual "…".',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Use Pagination.Ellipsis inside an Item; adjust label to match the context.',
  },
  {
    id: 'pagination.target-reflow',
    requirement:
      'In a real browser links and the ellipsis are at least 24x24 CSS px, the list wraps without clipping or overflow at 320 CSS px and 200% text size, the current page differs from other links by a thicker border and heavier weight and the disabled direction by a dashed border so neither relies on color, link text keeps at least 4.5:1 contrast, and in forced colors the focused link shows a system-color outline of at least 2px.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep min-size, wrapping, the current-page border and the disabled dashed border; keep the forced-colors outline for focused links.',
  },
  {
    id: 'pagination.zoom-theme',
    requirement:
      'At real 200% browser zoom and in real high-contrast modes the current page, disabled state and focus stay distinguishable.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check browser zoom, dark theme and high-contrast modes in a real browser; leave unverified until performed.',
  },
  {
    id: 'pagination.screen-reader',
    requirement:
      'Screen readers announce the landmark name, the current page and the disabled Previous/Next state.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Record NVDA + Firefox and VoiceOver + Safari results. Page numbers alone may be ambiguous; add aria-label such as "3ページ" when context is unclear.',
  },
] as const satisfies readonly QualityRule[];

export const paginationManifest = {
  qualityRules: paginationQualityRules,
  description:
    'Navigation between pages using native links; page state is owned by the consumer.',
  parts: ['Root', 'List', 'Item', 'Link', 'Previous', 'Next', 'Ellipsis'],
  partProps: {
    Root: 'native nav props; aria-label defaults to "ページ送り" unless aria-labelledby is set',
    List: 'native ul props',
    Item: 'native li props',
    Link: 'native a props; href required, active=false',
    Previous:
      'native a props; disabled=false; enabled requires href, disabled forbids it; children default "前のページ"',
    Next: 'native a props; disabled=false; enabled requires href, disabled forbids it; children default "次のページ"',
    Ellipsis:
      'native span props + label (default "省略されたページ"); visual "…" is aria-hidden',
  },
  props: {
    active: {
      type: 'boolean; Link only, renders aria-current="page"',
      default: false,
    },
    disabled: {
      type: 'boolean; Previous/Next only, removes href and click handling',
      default: false,
    },
  },
  composition:
    'Pagination.Root > Pagination.List > Pagination.Item > Link | Previous | Next | Ellipsis. The consumer computes pages and URLs; links are plain anchors and work without JavaScript. Use independently of Table. Buttons are not nested inside links.',
  avoid: [
    'Do not mark more than one Link active.',
    'Do not place Button inside a link or use buttons for URL-based pagination.',
    'Do not keep href on a disabled Previous/Next.',
  ],
  example:
    '<Pagination.Root aria-label="検索結果のページ"><Pagination.List><Pagination.Item><Pagination.Previous disabled /></Pagination.Item><Pagination.Item><Pagination.Link href="?page=1" active>1</Pagination.Link></Pagination.Item><Pagination.Item><Pagination.Link href="?page=2">2</Pagination.Link></Pagination.Item><Pagination.Item><Pagination.Ellipsis /></Pagination.Item><Pagination.Item><Pagination.Next href="?page=2" /></Pagination.Item></Pagination.List></Pagination.Root>',
  accessibility:
    'Native nav, list and link semantics. The active link uses aria-current="page" and a non-color visual cue. Disabled Previous/Next render role="link" with aria-disabled and no href, so they leave the Tab order. Consumers provide the landmark label, page URLs and clearer link names when numbers are ambiguous.',
} as const;
