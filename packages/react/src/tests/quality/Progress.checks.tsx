import { render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { Progress } from '../../components/Progress.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

function renderProgress(value: number | null, min?: number, max?: number) {
  return render(
    <Progress.Root value={value} min={min} max={max} label="Upload">
      <Progress.Value data-testid="value" />
      <Progress.Track>
        <Progress.Indicator data-testid="indicator" />
      </Progress.Track>
    </Progress.Root>,
  );
}

export const progressChecks: Record<string, QualityCheck> = {
  'progress.name-value': async () => {
    for (const value of [0, 50, 100]) {
      const { container, unmount } = renderProgress(value);
      const bar = screen.getByRole('progressbar', { name: 'Upload' });
      expect(bar).toHaveAttribute('aria-valuenow', String(value));
      expect(bar).toHaveAttribute('aria-valuemin', '0');
      expect(bar).toHaveAttribute('aria-valuemax', '100');
      expect(screen.getByTestId('indicator').style.width).toBe(`${value}%`);
      expect((await audit(container)).violations).toEqual([]);
      unmount();
    }
    renderProgress(15, 10, 20);
    const bar = screen.getByRole('progressbar', { name: 'Upload' });
    expect(bar).toHaveAttribute('aria-valuenow', '15');
    expect(bar).toHaveAttribute('aria-valuemin', '10');
    expect(bar).toHaveAttribute('aria-valuemax', '20');
    expect(screen.getByTestId('indicator').style.width).toBe('50%');
  },
  'progress.indeterminate': async () => {
    for (const value of [null, Number.NaN]) {
      const { container, unmount } = renderProgress(value);
      const bar = screen.getByRole('progressbar', { name: 'Upload' });
      expect(bar).not.toHaveAttribute('aria-valuenow');
      expect(bar).toHaveAttribute('data-indeterminate');
      expect(screen.getByTestId('indicator').style.width).toBe('');
      expect((await audit(container)).violations).toEqual([]);
      unmount();
    }
    renderProgress(0);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute(
      'data-indeterminate',
    );
  },
  'progress.no-duplicate-announcement': () => {
    const { container } = renderProgress(45);
    expect(screen.getByTestId('value')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('value')).toHaveTextContent('45%');
    expect(
      container.querySelector('[aria-live], [role="status"], [role="alert"]'),
    ).toBeNull();
  },
};
