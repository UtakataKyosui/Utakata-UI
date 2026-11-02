import { cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { Badge, type BadgeProps } from '../components/Badge.js';
import {
  badgeManifest,
  badgeQualityRules,
} from '../metadata/components/Badge.js';
import { badgeChecks } from './quality/Badge.checks.js';
import { expectAutomatedQuality } from './quality-helpers.js';

afterEach(cleanup);

// Type fixtures checked by pnpm typecheck without rendering invalid JSX.
const valid: BadgeProps = { variant: 'destructive', children: 'Failed' };
// @ts-expect-error Badge requires visible text.
const empty: BadgeProps = { variant: 'solid' };
// @ts-expect-error Variants are limited to the manifest.
const unsupported: BadgeProps = { variant: 'ghost', children: 'Draft' };
void [valid, empty, unsupported];

describe('Badge', () => {
  it('uses the subtle default and forwards className, ref and attributes', () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Badge ref={ref} className="custom" data-state="draft" title="Draft">
        Draft
      </Badge>,
    );
    const badge = screen.getByText('Draft');
    expect(badge).toHaveClass('ui-badge', 'ui-badge--subtle', 'custom');
    expect(badge).toHaveAttribute('title', 'Draft');
    expect(ref.current).toBe(badge);
    expect(badgeManifest.props.variant.default).toBe('subtle');
  });

  it('keeps long text and icons in the content', () => {
    const text = 'Waiting for review by the accessibility team';
    render(
      <Badge variant="outline">
        <svg aria-hidden="true" width="8" height="8" />
        {text}
      </Badge>,
    );
    expect(screen.getByText(text)).toContainElement(
      document.querySelector('svg'),
    );
  });

  it('passes every automated quality rule', async () => {
    await expectAutomatedQuality(badgeQualityRules, badgeChecks);
  });
});
