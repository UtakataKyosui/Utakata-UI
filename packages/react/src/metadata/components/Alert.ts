import type { QualityRule } from '../quality.js';

export const alertQualityRules = [
  {
    id: 'alert.role',
    requirement:
      'Alert adds no live-region role by default, keeps a consumer-specified role="alert" or role="status", and variant never changes role or focus.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Leave role unset for static messages; set role="alert" only for urgent dynamic messages and role="status" for non-urgent updates.',
  },
  {
    id: 'alert.text-meaning',
    requirement:
      'Each variant conveys its meaning in Title or Description text; icons are decorative and hidden.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Write the outcome, such as an error, in Alert.Title and add aria-hidden="true" to decorative icons.',
  },
  {
    id: 'alert.visual-theme',
    requirement:
      'In a real browser both variants keep at least 4.5:1 text contrast against the alert background in every supported theme and in forced colors, long content wraps without clipping or overflow at 320 CSS px and 200% text size, and the alert keeps a visible border in forced colors.',
    verification: 'browser',
    severity: 'error',
    remediation:
      'Keep overflow-wrap on Alert.Root; check --ui-alert-background and --ui-alert-border overrides and the destructive color against the surface.',
  },
  {
    id: 'alert.announcement',
    requirement:
      'Dynamic role="alert" messages are announced once by screen readers, role="status" messages politely, and static alerts are read in document order.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Record screen reader, browser and observed announcement; leave unverified until performed.',
  },
] as const satisfies readonly QualityRule[];

export const alertManifest = {
  qualityRules: alertQualityRules,
  description:
    'An in-page message with a title, description and optional decorative icon.',
  parts: ['Root', 'Title', 'Description'],
  partProps: {
    Root: 'native div props + variant; role limited to "alert" | "status"',
    Title: 'native div props',
    Description: 'native div props',
  },
  props: {
    variant: { type: 'default | destructive', default: 'default' },
    role: { type: '"alert" | "status" (optional)', default: 'none' },
  },
  defaults: { variant: 'default' },
  variants: ['default', 'destructive'],
  composition:
    'Alert.Root contains an optional leading svg icon with aria-hidden="true", Alert.Title and Alert.Description; both text parts are optional. Alert.Title is a div so it fits any heading outline; place a Heading inside it when the message needs a heading. Alert is for content within the page; use Toast for transient notifications. No dismissal or auto-hide.',
  avoid: [
    'Do not add role="alert" to static content present on page load.',
    'Do not signal an error with the destructive color or icon alone; state it in the Title.',
  ],
  example:
    '<Alert.Root variant="destructive" role="alert"><Alert.Title>保存できませんでした</Alert.Title><Alert.Description>時間をおいて再試行してください。</Alert.Description></Alert.Root>',
  accessibility:
    'No role by default, so static messages are read in document order without live announcement. Consumers opt into role="alert" (assertive) or role="status" (polite) for messages inserted dynamically. Variant only changes appearance; focus is never moved.',
} as const;

export type AlertVariant = (typeof alertManifest.variants)[number];
