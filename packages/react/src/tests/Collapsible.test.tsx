import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Collapsible,
  type CollapsibleRootProps,
} from '../components/Collapsible.js';
import { collapsibleQualityRules } from '../metadata/components/Collapsible.js';
import { collapsibleChecks } from './quality/Collapsible.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Type fixtures checked by pnpm typecheck without rendering invalid JSX.
const validRoot: CollapsibleRootProps = { defaultOpen: true, disabled: false };
// @ts-expect-error className is a string; state functions are not public API.
const functionClass: CollapsibleRootProps = { className: () => 'x' };
void [validRoot, functionClass];

describe('Collapsible', () => {
  it('forwards className and refs to every part', () => {
    const root = createRef<HTMLDivElement>();
    const trigger = createRef<HTMLButtonElement>();
    const panel = createRef<HTMLDivElement>();
    render(
      <Collapsible.Root ref={root} className="r" defaultOpen>
        <Collapsible.Trigger ref={trigger} className="t">
          Details
        </Collapsible.Trigger>
        <Collapsible.Panel ref={panel} className="p">
          Body
        </Collapsible.Panel>
      </Collapsible.Root>,
    );
    expect(root.current).toHaveClass('ui-collapsible', 'r');
    expect(trigger.current).toBe(
      screen.getByRole('button', { name: 'Details' }),
    );
    expect(trigger.current).toHaveClass('ui-collapsible__trigger', 't');
    expect(panel.current).toHaveClass('ui-collapsible__panel', 'p');
    expect(panel.current).toHaveTextContent('Body');
  });

  it('is closed by default and toggles on click', () => {
    const onOpenChange = vi.fn();
    render(
      <Collapsible.Root onOpenChange={onOpenChange}>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Panel>Body</Collapsible.Panel>
      </Collapsible.Root>,
    );
    const trigger = screen.getByRole('button', { name: 'Details' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Body')).toBeNull();
    fireEvent.click(trigger);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(true);
    expect(screen.getByText('Body')).toBeVisible();
    expect(trigger).toHaveAttribute('type', 'button');
  });

  it('passes the automated quality rules', async () => {
    const report = await expectAutomatedQuality(
      collapsibleQualityRules,
      collapsibleChecks,
    );
    expect(report.complete).toBe(false);
  });

  it('warns in development for unnamed triggers only', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const view = render(
      <Collapsible.Root>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Panel>Body</Collapsible.Panel>
      </Collapsible.Root>,
    );
    await settle();
    expect(warn).not.toHaveBeenCalled();
    view.rerender(
      <Collapsible.Root>
        <Collapsible.Trigger>
          <span aria-hidden="true">▾</span>
        </Collapsible.Trigger>
      </Collapsible.Root>,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] Collapsible.Trigger: No accessible name source',
        ),
      ),
    );
  });
});
