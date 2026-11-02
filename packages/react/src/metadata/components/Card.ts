import type { QualityRule } from '../quality.js';

export const cardQualityRules = [
  {
    id: 'card.structure',
    requirement:
      'Every part is optional; Card.Title renders a heading at the consumer-selected level (h3 by default) and parts forward class, ref and HTML attributes.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Choose Card.Title level to match the page heading outline; compose only the parts you need.',
  },
  {
    id: 'card.not-interactive',
    requirement:
      'Card parts are not focusable and add no click behavior; controls inside the card keep their normal keyboard operation.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Put actions in Button or link elements inside the card instead of making Card.Root clickable.',
  },
  {
    id: 'card.layout-theme',
    requirement:
      'In a real browser the card padding is identical for every part combination, long content wraps without clipping or overflow at 320 CSS px and 200% text size, text keeps at least 4.5:1 contrast against the card background in every supported theme and in forced colors, and the card keeps a visible border in forced colors.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep overflow-wrap and the shared padding on Card.Root; check --ui-card-background, --ui-card-border and text color overrides.',
  },
  {
    id: 'card.zoom-assistive',
    requirement:
      'At real 200% browser zoom the card layout reflows without loss, and assistive technology reads the heading level and card content in order.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check browser zoom and screen reader output in a real browser; leave unverified until performed.',
  },
] as const satisfies readonly QualityRule[];

export const cardManifest = {
  qualityRules: cardQualityRules,
  description:
    'A container that groups related content with optional header, body and footer parts.',
  parts: ['Root', 'Header', 'Title', 'Description', 'Content', 'Footer'],
  partProps: {
    Root: 'native div props',
    Header: 'native div props',
    Title: 'native h1-h6 props + level; children required',
    Description: 'native p props',
    Content: 'native div props',
    Footer: 'native div props',
  },
  props: {
    level: { type: '1 | 2 | 3 | 4 | 5 | 6 (Card.Title)', default: '3' },
  },
  defaults: { level: '3' },
  headingLevels: ['1', '2', '3', '4', '5', '6'],
  composition:
    'Card.Root contains any of Header (Title, Description), Content and Footer. Set Card.Title level like Lism Heading to fit the page outline. Spacing, border and background use --ui-card-padding, --ui-card-gap, --ui-card-border and --ui-card-background; arrange content with Lism primitives.',
  avoid: [
    'Do not make the whole Card clickable or focusable; place a Button or link inside.',
    'Do not pick a heading level for its size; style with className instead.',
  ],
  example:
    '<Card.Root><Card.Header><Card.Title>プロフィール</Card.Title><Card.Description>公開情報を編集</Card.Description></Card.Header><Card.Content>内容</Card.Content><Card.Footer><Button>保存</Button></Card.Footer></Card.Root>',
  accessibility:
    'Static div, heading and paragraph elements without roles or focus. Consumers choose the Card.Title heading level and supply interactive controls inside.',
} as const;

export type CardTitleLevel = (typeof cardManifest.headingLevels)[number];
