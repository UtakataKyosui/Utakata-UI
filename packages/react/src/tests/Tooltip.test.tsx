import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Tooltip,
  type TooltipPopupProps,
  type TooltipRootProps,
} from '../components/Tooltip.js';
import {
  tooltipManifest,
  tooltipQualityRules,
} from '../metadata/components/Tooltip.js';
import {
  keyboardFocus,
  renderTooltip,
  tooltipChecks,
} from './quality/Tooltip.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

// Type contract fixtures, checked by pnpm typecheck without rendering.
const textPopup: TooltipPopupProps = { children: 'Copy to clipboard' };
// @ts-expect-error Tooltips hold plain text; interactive content belongs in Popover.
const elementPopup: TooltipPopupProps = { children: <a href="/">Help</a> };
// @ts-expect-error The popup must stay hoverable (WCAG 1.4.13).
const nonHoverable: TooltipRootProps = { disableHoverablePopup: true };
// @ts-expect-error className is a string, not a Base UI state function.
const stateClass: TooltipPopupProps = { children: 'x', className: () => 'x' };
void [textPopup, elementPopup, nonHoverable, stateClass];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Tooltip', () => {
  it('forwards refs and merges classNames on every DOM part', async () => {
    const triggerRef = createRef<HTMLElement>();
    const popupRef = createRef<HTMLDivElement>();
    const positionerRef = createRef<HTMLElement>();
    render(
      <Tooltip.Root defaultOpen>
        <Tooltip.Trigger ref={triggerRef} className="t">
          Save
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner ref={positionerRef} className="p">
            <Tooltip.Popup ref={popupRef} className="c">
              Save the draft
            </Tooltip.Popup>
            <Tooltip.Arrow className="a" />
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );
    await settle(0);
    const trigger = screen.getByRole('button', { name: 'Save' });
    expect(trigger).toHaveClass('ui-tooltip__trigger', 't');
    expect(triggerRef.current).toBe(trigger);
    const popup = screen.getByRole('tooltip');
    expect(popup).toHaveClass('ui-tooltip__popup', 'c');
    expect(popupRef.current).toBe(popup);
    expect(positionerRef.current).toHaveClass('ui-tooltip__positioner', 'p');
    expect(
      positionerRef.current?.querySelector('.ui-tooltip__arrow.a'),
    ).not.toBeNull();
    expect(tooltipManifest.defaults.delay).toBe(600);
  });

  it('keeps consumer descriptions and removes its reference when closed', async () => {
    render(
      <>
        <span id="extra">Shortcut Control C</span>
        <Tooltip.Root>
          <Tooltip.Trigger aria-describedby="extra">Copy</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup id="copy-tip">Copy to clipboard</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </>,
    );
    const trigger = screen.getByRole('button', { name: 'Copy' });
    expect(trigger).toHaveAttribute('aria-describedby', 'extra');
    await keyboardFocus(trigger);
    expect(trigger).toHaveAttribute('aria-describedby', 'extra copy-tip');
  });

  it('opens on focus of a focusable disabled Button', async () => {
    const trigger = renderTooltip();
    expect(trigger).toBeInTheDocument();
    cleanup();
    const { Button } = await import('../components/Button.js');
    render(
      <Tooltip.Root>
        <Tooltip.Trigger render={<Button disabled focusableWhenDisabled />}>
          Publish
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup>Complete the required fields first</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );
    const disabled = screen.getByRole('button', { name: 'Publish' });
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await keyboardFocus(disabled);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('warns when the trigger has no name source', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Tooltip.Root>
        <Tooltip.Trigger />
      </Tooltip.Root>,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] Tooltip.Trigger: No accessible name',
        ),
      ),
    );
  });

  it('passes its automated quality rules without diagnostics', async () => {
    await expectAutomatedQuality(tooltipQualityRules, tooltipChecks);
  });
});
