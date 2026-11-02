import type { QualityRule } from '../quality.js';

export const skeletonQualityRules = [
  {
    id: 'skeleton.hidden',
    requirement:
      'Every Skeleton is hidden from assistive technology and adds no status role, live region or tabindex, so multiple placeholders cause no repeated announcements.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Keep Skeleton decorative; announce loading once from the parent with aria-busy and a separate status text.',
  },
  {
    id: 'skeleton.busy-region',
    requirement:
      'The documented composition marks the loading region with aria-busy and a single status text, and clears aria-busy when content is shown.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Set aria-busy="true" on the parent while loading, provide one role="status" text, and set aria-busy="false" after the content renders.',
  },
  {
    id: 'skeleton.reduced-motion',
    requirement:
      'The pulse animation stops under prefers-reduced-motion and the placeholder stays visible in every supported theme and forced colors.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check the rendered animation with the OS reduced-motion setting, dark theme and forced colors in a real browser.',
  },
] as const satisfies readonly QualityRule[];

export const skeletonManifest = {
  qualityRules: skeletonQualityRules,
  description:
    'A decorative placeholder that previews the shape of content while it loads.',
  props: {
    shape: { type: 'rect | circle', default: 'rect' },
  },
  shapes: ['rect', 'circle'],
  composition:
    'Size it with style, className or --ui-skeleton-width / --ui-skeleton-height. Always aria-hidden. Put aria-busy on the loading region and one role="status" text nearby; Skeleton does not fetch data or swap in content. Use Spinner for an indeterminate process without a known layout.',
  avoid: [
    'Do not give Skeleton a role, name or tabindex.',
    'Do not use Skeleton as the only loading information; provide a status text.',
  ],
  example:
    '<Stack style={{ gap: "0.5rem" }}><Text role="status">プロフィールを読み込み中</Text><Flex aria-busy="true" style={{ gap: "0.75rem", alignItems: "center" }}><Skeleton shape="circle" style={{ width: 40, height: 40 }} /><Skeleton style={{ width: 160, height: 16 }} /></Flex></Stack>',
  accessibility:
    'Renders aria-hidden="true" without status semantics. The consumer announces loading once with a status text and toggles aria-busy on the region. The animation is CSS-only and stops under prefers-reduced-motion.',
} as const;

export type SkeletonShape = (typeof skeletonManifest.shapes)[number];
