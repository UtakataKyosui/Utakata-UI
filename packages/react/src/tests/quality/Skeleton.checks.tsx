import { render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { Skeleton } from '../../components/Skeleton.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

function Profile({ loading }: { loading: boolean }) {
  return (
    <section aria-labelledby="profile-heading">
      <h2 id="profile-heading">Profile</h2>
      <p role="status">{loading ? 'Loading profile' : 'Profile loaded'}</p>
      <div aria-busy={loading}>
        {loading ? (
          <>
            <Skeleton shape="circle" style={{ width: 40, height: 40 }} />
            <Skeleton style={{ width: 160, height: 16 }} />
          </>
        ) : (
          <p>Aya</p>
        )}
      </div>
    </section>
  );
}

export const skeletonChecks: Record<string, QualityCheck> = {
  'skeleton.hidden': () => {
    const { container } = render(
      <>
        <Skeleton />
        <Skeleton shape="circle" />
        <Skeleton />
      </>,
    );
    const skeletons = container.querySelectorAll<HTMLElement>('.ui-skeleton');
    expect(skeletons).toHaveLength(3);
    for (const skeleton of skeletons) {
      expect(skeleton).toHaveAttribute('aria-hidden', 'true');
      expect(skeleton).not.toHaveAttribute('role');
      expect(skeleton).not.toHaveAttribute('aria-live');
      expect(skeleton).not.toHaveAttribute('tabindex');
    }
    expect(screen.queryAllByRole('status')).toEqual([]);
  },
  'skeleton.busy-region': async () => {
    const { container, rerender } = render(<Profile loading />);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Loading profile');
    const region = container.querySelector('[aria-busy]');
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect((await audit(container)).violations).toEqual([]);
    rerender(<Profile loading={false} />);
    expect(region).toHaveAttribute('aria-busy', 'false');
    expect(container.querySelector('.ui-skeleton')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Profile loaded');
  },
};
