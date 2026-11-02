import type { QualityRule } from '../quality.js';

export const avatarQualityRules = [
  {
    id: 'avatar.text-alternative',
    requirement:
      'Avatar.Image always has an explicit alt: the person or organization name when it stands alone, or alt="" with an aria-hidden Fallback when an adjacent name is visible.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Pass alt with the name, or alt="" and aria-hidden="true" on Avatar.Fallback when the name is already shown next to the Avatar.',
  },
  {
    id: 'avatar.loading-fallback',
    requirement:
      'Fallback is shown until the image loads, after an error and after src changes until the new image loads, honoring Fallback delay.',
    verification: 'automated',
    severity: 'error',
    remediation:
      'Preserve Base UI Avatar loading status handling; always provide Avatar.Fallback content.',
  },
  {
    id: 'avatar.visual-theme',
    requirement:
      'The image keeps its aspect ratio inside the circle, and fallback text is legible in every supported theme, 200% text zoom and forced colors.',
    verification: 'manual',
    severity: 'warning',
    remediation:
      'Check rendered images, initials contrast and forced colors in a real browser.',
  },
] as const satisfies readonly QualityRule[];

export const avatarManifest = {
  qualityRules: avatarQualityRules,
  description:
    'Shows a person or organization image with a text fallback, built on Base UI Avatar.',
  parts: ['Root', 'Image', 'Fallback'],
  partProps: {
    Root: 'Base UI AvatarRootProps + size',
    Image: 'Base UI AvatarImageProps; alt is required',
    Fallback: 'Base UI AvatarFallbackProps (delay)',
  },
  props: {
    size: { type: 'sm | md | lg (Avatar.Root)', default: 'md' },
    alt: { type: 'string (Avatar.Image, required; "" when decorative)' },
    delay: { type: 'number in ms (Avatar.Fallback)', default: 0 },
  },
  defaults: { size: 'md', delay: 0 },
  sizes: ['sm', 'md', 'lg'],
  composition:
    'Avatar.Root contains Avatar.Image and Avatar.Fallback. Initials are passed as Fallback children; names are never split or generated. When a visible name is adjacent, use alt="" and aria-hidden="true" on Fallback to avoid reading the name twice. Image fits with object-fit: cover; size uses --ui-avatar-size.',
  avoid: [
    'Do not omit alt or describe the photo instead of naming the person.',
    'Do not use Avatar as a button; wrap it in Button or a link that has its own name.',
  ],
  example:
    '<Avatar.Root size="md"><Avatar.Image src="/users/aya.jpg" alt="綾" /><Avatar.Fallback>綾</Avatar.Fallback></Avatar.Root>',
  accessibility:
    'Base UI renders the img only after it loads, so assistive technology gets either the image alt or the Fallback text. alt is required by type; alt="" marks a decorative image. Consumers ensure Fallback text identifies the same person.',
} as const;

export type AvatarSize = (typeof avatarManifest.sizes)[number];
