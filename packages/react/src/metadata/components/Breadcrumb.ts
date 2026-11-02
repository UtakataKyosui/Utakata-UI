import type { QualityRule } from '../quality.js';

export const breadcrumbQualityRules = [
  {
    id: 'breadcrumb.structure',
    requirement:
      'Root is a named nav landmark (default "パンくずリスト", overridable) containing an ol whose children are all li; exactly one item has aria-current="page" and links keep their href.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Compose Root > List > Item and Separator; use Page for the current location only once and Link with href (or a router link via render).',
  },
  {
    id: 'breadcrumb.decorations-hidden',
    requirement:
      'Separator and Ellipsis are hidden from assistive technology, are not focusable, and links stay in normal Tab order.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Use Breadcrumb.Separator and Breadcrumb.Ellipsis instead of text separators inside links; do not add tabindex or expand handlers.',
  },
  {
    id: 'breadcrumb.reflow-focus',
    requirement:
      'In a real browser a long hierarchy wraps without clipping or overflow at 320 CSS px and 200% text size, link and current-page text keep at least 4.5:1 contrast, links are underlined while the current page is not so they differ without color, real Tab visits each link once in order and skips separators, the focused link shows a visible indicator, and in forced colors that indicator is a system-color outline of at least 2px.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep link underlines, overflow-wrap on items and the forced-colors outline; do not add tabindex to separators or the ellipsis.',
  },
  {
    id: 'breadcrumb.zoom-theme',
    requirement:
      'At real 200% browser zoom and in real high-contrast modes the hierarchy stays readable and the current page stays distinguishable.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check browser zoom, dark theme and high-contrast modes in a real browser; leave unverified until performed.',
  },
  {
    id: 'breadcrumb.screen-reader',
    requirement:
      'Screen readers announce the landmark name, list size and current page; separators are not read.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Record NVDA + Firefox and VoiceOver + Safari results. Collapsed levels hidden by Ellipsis are not announced; provide another route to them if needed.',
  },
] as const satisfies readonly QualityRule[];

export const breadcrumbManifest = {
  qualityRules: breadcrumbQualityRules,
  description:
    'Shows the current location within a hierarchy as a named navigation landmark.',
  parts: ['Root', 'List', 'Item', 'Link', 'Page', 'Separator', 'Ellipsis'],
  partProps: {
    Root: 'native nav props; aria-label defaults to "パンくずリスト" unless aria-labelledby is set',
    List: 'native ol props',
    Item: 'native li props',
    Link: 'native a props + Base UI render; requires href or render',
    Page: 'native span props; always aria-current="page"',
    Separator: 'native li props; aria-hidden, children default "/"',
    Ellipsis: 'native span props; aria-hidden, children default "…"',
  },
  defaults: { 'aria-label': 'パンくずリスト' },
  composition:
    'Breadcrumb.Root > Breadcrumb.List > Breadcrumb.Item (Link or Page) with Breadcrumb.Separator between items as a sibling li. Use exactly one Page for the current location. Router links compose through render={<RouterLink href="/" />}. Ellipsis is decorative and does not expand collapsed levels.',
  avoid: [
    'Do not put the current page in a Link; use Page.',
    'Do not place separators inside links or as text in Items.',
    'Do not use more than one Breadcrumb landmark with the same name on a page.',
  ],
  example:
    '<Breadcrumb.Root><Breadcrumb.List><Breadcrumb.Item><Breadcrumb.Link href="/">ホーム</Breadcrumb.Link></Breadcrumb.Item><Breadcrumb.Separator /><Breadcrumb.Item><Breadcrumb.Page>設定</Breadcrumb.Page></Breadcrumb.Item></Breadcrumb.List></Breadcrumb.Root>',
  accessibility:
    'Native nav, ol, li and a semantics; the current page uses aria-current="page". Separators are aria-hidden li elements so the list stays valid. Consumers provide link text and a unique landmark label when several navigations exist.',
} as const;
