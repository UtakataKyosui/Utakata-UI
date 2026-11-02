import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Progress, type ProgressRootProps } from '../components/Progress.js';
import { progressQualityRules } from '../metadata/components/Progress.js';
import { audit } from './audit.js';
import { progressChecks } from './quality/Progress.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Checked by pnpm typecheck: a progressbar without a name source is invalid.
const labelled: ProgressRootProps = { value: 10, label: 'Upload' };
const named: ProgressRootProps = { value: 10, 'aria-label': 'Upload' };
const referenced: ProgressRootProps = { value: null, 'aria-labelledby': 'x' };
// @ts-expect-error Progress.Root requires label, aria-label or aria-labelledby.
const unnamed: ProgressRootProps = { value: 10 };
// @ts-expect-error label and aria-label are alternative name sources.
const both: ProgressRootProps = { value: 1, label: 'A', 'aria-label': 'B' };
// @ts-expect-error value is required; use null for indeterminate.
const missingValue: ProgressRootProps = { label: 'Upload' };
void [labelled, named, referenced, unnamed, both, missingValue];

describe('Progress', () => {
  it('renders parts with defaults, classNames and refs', async () => {
    const root = createRef<HTMLDivElement>();
    const indicator = createRef<HTMLDivElement>();
    const { container } = render(
      <Progress.Root ref={root} value={30} label="Upload" className="custom">
        <Progress.Value className="value" />
        <Progress.Track className="track">
          <Progress.Indicator ref={indicator} className="fill" />
        </Progress.Track>
      </Progress.Root>,
    );
    const bar = screen.getByRole('progressbar', { name: 'Upload' });
    expect(root.current).toBe(bar);
    expect(bar).toHaveClass('ui-progress', 'custom');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(screen.getByText('Upload')).toHaveClass('ui-progress__label');
    expect(screen.getByText('30%')).toHaveClass('ui-progress__value', 'value');
    expect(indicator.current).toHaveClass('ui-progress__indicator', 'fill');
    expect(indicator.current?.parentElement).toHaveClass(
      'ui-progress__track',
      'track',
    );
    expect((await audit(container)).violations).toEqual([]);
  });

  it('clamps out-of-range values and updates when controlled', () => {
    const view = render(<Progress.Root value={150} aria-label="Sync" />);
    const bar = screen.getByRole('progressbar', { name: 'Sync' });
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(bar).toHaveAttribute('data-complete');
    view.rerender(<Progress.Root value={20} aria-label="Sync" />);
    expect(bar).toHaveAttribute('aria-valuenow', '20');
    expect(bar).toHaveAttribute('data-progressing');
  });

  it('uses an explicitly placed Label referenced by aria-labelledby', () => {
    render(
      <Progress.Root value={null} aria-labelledby="sync-label">
        <Progress.Label id="sync-label">Syncing</Progress.Label>
      </Progress.Root>,
    );
    const bar = screen.getByRole('progressbar', { name: 'Syncing' });
    expect(bar).toHaveAttribute('aria-valuetext', 'indeterminate progress');
  });

  it('passes all automated quality rules', async () => {
    const report = await expectAutomatedQuality(
      progressQualityRules,
      progressChecks,
    );
    expect(report.complete).toBe(false);
  });

  it('warns in development when the name is empty or dangling', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <>
        <Progress.Root value={1} aria-label="  " />
        <Progress.Root value={1} aria-labelledby="missing" />
      </>,
    );
    await waitFor(() => {
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] Progress.Root: No accessible name',
        ),
      );
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('aria-labelledby must reference existing'),
      );
    });
  });

  it('does not warn for valid name sources', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <>
        <Progress.Root value={1} label="Upload" />
        <Progress.Root value={null} aria-label="Sync" />
        <span id="external">Export</span>
        <Progress.Root value={2} aria-labelledby="external" />
      </>,
    );
    await settle();
    expect(warn).not.toHaveBeenCalled();
  });
});
