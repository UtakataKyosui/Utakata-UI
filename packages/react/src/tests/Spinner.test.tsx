import { cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { Spinner, type SpinnerProps } from '../components/Spinner.js';
import {
  spinnerManifest,
  spinnerQualityRules,
} from '../metadata/components/Spinner.js';
import { spinnerChecks } from './quality/Spinner.checks.js';
import { expectAutomatedQuality } from './quality-helpers.js';

afterEach(cleanup);

// Type fixtures checked by pnpm typecheck without rendering invalid JSX.
const labelled: SpinnerProps = { label: 'Uploading' };
const decorative: SpinnerProps = { decorative: true, size: 'sm' };
// @ts-expect-error Decorative spinners announce nothing, so a label is invalid.
const labelledDecorative: SpinnerProps = { decorative: true, label: 'Saving' };
// @ts-expect-error The status role is managed by Spinner.
const withRole: SpinnerProps = { role: 'progressbar' };
// @ts-expect-error The name comes from label, not aria-label.
const ariaLabel: SpinnerProps = { 'aria-label': 'Loading' };
// @ts-expect-error JSX attributes must hit the same contract (hyphenated names skip excess checks).
const ariaLabelJsx = <Spinner aria-label="Loading" />;
// @ts-expect-error Sizes are limited to the manifest.
const unsupported: SpinnerProps = { size: 'xl' };
void [
  labelled,
  decorative,
  labelledDecorative,
  withRole,
  ariaLabel,
  ariaLabelJsx,
  unsupported,
];

describe('Spinner', () => {
  it('uses defaults and forwards className and ref', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Spinner ref={ref} className="custom" data-testid="spinner" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('読み込み中');
    expect(status).toBe(ref.current);
    expect(status).toHaveClass('ui-spinner', 'ui-spinner--md', 'custom');
    expect(spinnerManifest.props.size.default).toBe('md');
    expect(spinnerManifest.props.label.default).toBe('読み込み中');
    expect(spinnerManifest.props.decorative.default).toBe(false);
  });

  it('hides decorative spinners entirely', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Spinner ref={ref} decorative size="lg" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(ref.current).toHaveAttribute('aria-hidden', 'true');
    expect(ref.current).toHaveClass('ui-spinner--lg');
    expect(ref.current).toHaveTextContent('');
  });

  it('passes every automated quality rule', async () => {
    await expectAutomatedQuality(spinnerQualityRules, spinnerChecks);
  });
});
