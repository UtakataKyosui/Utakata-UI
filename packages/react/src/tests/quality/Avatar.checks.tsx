import { act, render, screen } from '@testing-library/react';
import { expect, vi } from 'vitest';
import { Avatar } from '../../components/Avatar.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';
import { settle, withMockImage } from '../quality-helpers.js';

export const avatarChecks: Record<string, QualityCheck> = {
  'avatar.text-alternative': () =>
    withMockImage(async () => {
      const { container } = render(
        <>
          <Avatar.Root>
            <Avatar.Image src="/aya.png" alt="Aya" />
            <Avatar.Fallback>A</Avatar.Fallback>
          </Avatar.Root>
          <p>
            <Avatar.Root size="sm">
              <Avatar.Image src="/ken.png" alt="" />
              <Avatar.Fallback aria-hidden="true">K</Avatar.Fallback>
            </Avatar.Root>
            Ken
          </p>
        </>,
      );
      await settle(10);
      expect(screen.getByRole('img', { name: 'Aya' })).toHaveClass(
        'ui-avatar__image',
      );
      expect(container.querySelector('img[alt=""]')).toBeInTheDocument();
      expect(screen.getAllByRole('img')).toHaveLength(1);
      expect((await audit(container)).violations).toEqual([]);
    }),
  'avatar.loading-fallback': () =>
    withMockImage(async () => {
      const view = (src: string) => (
        <Avatar.Root>
          <Avatar.Image src={src} alt="Aya" />
          <Avatar.Fallback>A</Avatar.Fallback>
        </Avatar.Root>
      );
      const { rerender } = render(view('/aya.png'));
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      await settle(10);
      expect(screen.getByRole('img', { name: 'Aya' })).toBeInTheDocument();
      expect(screen.queryByText('A')).not.toBeInTheDocument();
      rerender(view('/broken.png'));
      await settle(10);
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
      rerender(view('/new.png'));
      await settle(10);
      expect(screen.getByRole('img', { name: 'Aya' })).toBeInTheDocument();

      vi.useFakeTimers();
      try {
        render(
          <Avatar.Root>
            <Avatar.Fallback delay={500}>D</Avatar.Fallback>
          </Avatar.Root>,
        );
        expect(screen.queryByText('D')).not.toBeInTheDocument();
        act(() => vi.advanceTimersByTime(500));
        expect(screen.getByText('D')).toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    }),
};
