import { cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { Empty } from '../components/Empty.js';
import {
  emptyManifest,
  emptyQualityRules,
} from '../metadata/components/Empty.js';
import { emptyChecks } from './quality/Empty.checks.js';
import { expectAutomatedQuality } from './quality-helpers.js';

afterEach(cleanup);

describe('Empty', () => {
  it('renders a static heading and description without actions', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <Empty.Root ref={ref} className="example" data-testid="empty">
        <Empty.Title>Nothing to display</Empty.Title>
        <Empty.Description>New results will appear here.</Empty.Description>
      </Empty.Root>,
    );
    expect(ref.current).toBe(screen.getByTestId('empty'));
    expect(ref.current).toHaveClass('ui-empty', 'example');
    expect(
      screen.getByRole('heading', {
        level: Number(emptyManifest.defaults.level),
        name: 'Nothing to display',
      }),
    ).toBeVisible();
    expect(container.querySelector('.ui-empty__actions')).toBeNull();
  });

  it('drops live-region props supplied by untyped consumers', () => {
    const untyped = {
      role: 'status',
      'aria-live': 'polite',
    } as unknown as object;
    render(<Empty.Root data-testid="empty" {...untyped} />);
    expect(screen.getByTestId('empty')).not.toHaveAttribute('role');
    expect(screen.getByTestId('empty')).not.toHaveAttribute('aria-live');
  });

  it('passes every automated quality rule', async () => {
    await expectAutomatedQuality(emptyQualityRules, emptyChecks);
  });
});
