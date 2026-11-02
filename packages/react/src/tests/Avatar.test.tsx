import { act, cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { Avatar, type AvatarImageProps } from '../components/Avatar.js';
import {
  avatarManifest,
  avatarQualityRules,
} from '../metadata/components/Avatar.js';
import { avatarChecks } from './quality/Avatar.checks.js';
import { expectAutomatedQuality, withMockImage } from './quality-helpers.js';

afterEach(cleanup);

// Type fixtures checked by pnpm typecheck without rendering invalid JSX.
const named: AvatarImageProps = { src: '/aya.png', alt: 'Aya' };
const decorative: AvatarImageProps = { src: '/aya.png', alt: '' };
// @ts-expect-error Avatar images require an explicit alt decision.
const missingAlt: AvatarImageProps = { src: '/aya.png' };
void [named, decorative, missingAlt];

describe('Avatar', () => {
  it('uses the md default and forwards className and ref on every part', () =>
    withMockImage(async () => {
      const root = createRef<HTMLSpanElement>();
      const image = createRef<HTMLImageElement>();
      const fallback = createRef<HTMLSpanElement>();
      render(
        <>
          <Avatar.Root ref={root} className="root">
            <Avatar.Image
              ref={image}
              className="image"
              src="/aya.png"
              alt="Aya"
            />
          </Avatar.Root>
          <Avatar.Root size="lg">
            <Avatar.Fallback ref={fallback} className="fallback">
              A
            </Avatar.Fallback>
          </Avatar.Root>
        </>,
      );
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      expect(root.current).toHaveClass('ui-avatar', 'ui-avatar--md', 'root');
      expect(image.current).toHaveClass('ui-avatar__image', 'image');
      expect(image.current).toBe(screen.getByRole('img', { name: 'Aya' }));
      expect(fallback.current).toHaveClass('ui-avatar__fallback', 'fallback');
      expect(fallback.current?.parentElement).toHaveClass('ui-avatar--lg');
      expect(avatarManifest.defaults.size).toBe('md');
    }));

  it('passes every automated quality rule', async () => {
    await expectAutomatedQuality(avatarQualityRules, avatarChecks);
  });
});
