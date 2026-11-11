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
  HoverCard,
  type HoverCardRootProps,
  type HoverCardTriggerProps,
} from '../components/HoverCard.js';
import {
  hoverCardManifest,
  hoverCardQualityRules,
} from '../metadata/components/HoverCard.js';
import {
  hoverCardChecks,
  keyboardFocus,
  renderHoverCard,
} from './quality/HoverCard.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

// Type contract fixtures, checked by pnpm typecheck without rendering.
const link: HoverCardTriggerProps = { href: '/docs', children: 'Docs' };
// @ts-expect-error The trigger is a link and needs a destination.
const noHref: HoverCardTriggerProps = { children: 'Docs' };
// @ts-expect-error className is a string, not a Base UI state function.
const stateClass: HoverCardTriggerProps = { href: '/', className: () => 'x' };
const root: HoverCardRootProps = { defaultOpen: false };
void [link, noHref, stateClass, root];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('HoverCard', () => {
  it('forwards refs and merges classNames on every DOM part', async () => {
    const triggerRef = createRef<HTMLElement>();
    const popupRef = createRef<HTMLDivElement>();
    const positionerRef = createRef<HTMLElement>();
    render(
      <HoverCard.Root defaultOpen>
        <HoverCard.Trigger ref={triggerRef} href="/a" className="t">
          Docs
        </HoverCard.Trigger>
        <HoverCard.Portal>
          <HoverCard.Positioner ref={positionerRef} className="p">
            <HoverCard.Popup ref={popupRef} className="c">
              Preview
            </HoverCard.Popup>
            <HoverCard.Arrow className="a" />
          </HoverCard.Positioner>
        </HoverCard.Portal>
      </HoverCard.Root>,
    );
    await settle(0);
    const trigger = screen.getByRole('link', { name: 'Docs' });
    expect(trigger).toHaveClass('ui-hover-card__trigger', 't');
    expect(triggerRef.current).toBe(trigger);
    expect(popupRef.current).toHaveClass('ui-hover-card__popup', 'c');
    expect(positionerRef.current).toHaveClass('ui-hover-card__positioner', 'p');
    expect(
      positionerRef.current?.querySelector('.ui-hover-card__arrow.a'),
    ).not.toBeNull();
    expect(hoverCardManifest.defaults.closeDelay).toBe(300);
  });

  it('opens on keyboard focus and closes on Escape', async () => {
    const trigger = renderHoverCard();
    expect(screen.queryByText(/component library/)).toBeNull();
    await keyboardFocus(trigger);
    await waitFor(() =>
      expect(screen.getByText(/component library/)).toBeInTheDocument(),
    );
    fireEvent.keyDown(trigger, { key: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByText(/component library/)).toBeNull(),
    );
    expect(trigger).toHaveFocus();
  });

  it('warns when the trigger has no name source', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <HoverCard.Root>
        <HoverCard.Trigger href="/x" />
      </HoverCard.Root>,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] HoverCard.Trigger: No accessible name',
        ),
      ),
    );
  });

  it('passes its automated quality rules without diagnostics', async () => {
    await expectAutomatedQuality(hoverCardQualityRules, hoverCardChecks);
  });
});
