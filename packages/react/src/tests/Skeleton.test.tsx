import { cleanup, render } from '@testing-library/react';
import { type CSSProperties, createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { Skeleton, type SkeletonProps } from '../components/Skeleton.js';
import {
  skeletonManifest,
  skeletonQualityRules,
} from '../metadata/components/Skeleton.js';
import { skeletonChecks } from './quality/Skeleton.checks.js';
import { expectAutomatedQuality } from './quality-helpers.js';

afterEach(cleanup);

// Type fixtures checked by pnpm typecheck without rendering invalid JSX.
const circle: SkeletonProps = { shape: 'circle', style: { width: 40 } };
// @ts-expect-error Skeleton never exposes status semantics.
const withRole: SkeletonProps = { role: 'status' };
// @ts-expect-error Skeleton is always hidden from assistive technology.
const exposed: SkeletonProps = { 'aria-hidden': false };
// @ts-expect-error Shapes are limited to the manifest.
const unsupported: SkeletonProps = { shape: 'pill' };
const interactiveProps = { tabIndex: 0, role: 'button' };
// @ts-expect-error Spreads cannot bypass the decorative-only contract.
const spreadFocusable = <Skeleton {...interactiveProps} />;
const textProps = { children: 'Loading' };
// @ts-expect-error Skeleton holds no content, even through spreads.
const spreadContent = <Skeleton {...textProps} />;
void [circle, withRole, exposed, unsupported, spreadFocusable, spreadContent];

describe('Skeleton', () => {
  it('defaults to a hidden rect and forwards className, ref and style', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Skeleton
        ref={ref}
        className="custom"
        style={{ width: 160, '--ui-skeleton-height': '1rem' } as CSSProperties}
      />,
    );
    expect(ref.current).toHaveClass(
      'ui-skeleton',
      'ui-skeleton--rect',
      'custom',
    );
    expect(ref.current).toHaveAttribute('aria-hidden', 'true');
    expect(ref.current?.style.width).toBe('160px');
    expect(ref.current?.style.getPropertyValue('--ui-skeleton-height')).toBe(
      '1rem',
    );
    expect(skeletonManifest.props.shape.default).toBe('rect');
  });

  it('renders the circle shape', () => {
    const { container } = render(<Skeleton shape="circle" />);
    expect(container.firstElementChild).toHaveClass('ui-skeleton--circle');
  });

  it('passes every automated quality rule', async () => {
    await expectAutomatedQuality(skeletonQualityRules, skeletonChecks);
  });
});
