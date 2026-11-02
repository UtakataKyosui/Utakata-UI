import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { expect } from 'vitest';
import { Button } from '../../components/Button.js';
import { Tooltip } from '../../components/Tooltip.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';
import { settle } from '../quality-helpers.js';

export function renderTooltip(
  props: {
    delay?: number;
    defaultOpen?: boolean;
    rootProps?: object | undefined;
  } = {},
) {
  render(
    <Tooltip.Provider delay={props.delay ?? 0}>
      <Tooltip.Root defaultOpen={props.defaultOpen} {...props.rootProps}>
        <Tooltip.Trigger render={<Button iconOnly aria-label="Copy" />}>
          <span aria-hidden="true">⧉</span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={6}>
            <Tooltip.Popup>Copy to clipboard</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>,
  );
  return screen.getByRole('button', { name: 'Copy' });
}

function hover(element: HTMLElement) {
  fireEvent.pointerEnter(element);
  fireEvent.mouseEnter(element);
  fireEvent.mouseMove(element);
}

/** Focus via keyboard modality so Base UI treats it as focus-visible. */
export async function keyboardFocus(element: HTMLElement) {
  fireEvent.keyDown(document.body, { key: 'Tab' });
  act(() => element.focus());
  await settle(0);
}

export const tooltipChecks: Record<string, QualityCheck> = {
  'tooltip.description': async () => {
    const trigger = renderTooltip({ defaultOpen: true });
    await settle(0);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('Copy to clipboard');
    expect(trigger).toHaveAccessibleName('Copy');
    expect(trigger).toHaveAccessibleDescription('Copy to clipboard');
    // Portalled popup and trigger are audited separately: landmarks are page-level.
    expect((await audit(tooltip)).violations).toEqual([]);
    expect((await audit(trigger)).violations).toEqual([]);
  },
  'tooltip.focus-hover-escape': async () => {
    const trigger = renderTooltip({ delay: 30 });
    hover(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    await settle(60);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.mouseLeave(trigger);
    await settle(30);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    await keyboardFocus(trigger);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: 'Escape' });
    await settle(0);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  },
  'tooltip.hoverable': async () => {
    const moveOntoPopup = async (rootProps?: object) => {
      const trigger = renderTooltip({ rootProps });
      hover(trigger);
      await settle(20);
      const tooltip = screen.getByRole('tooltip');
      fireEvent.mouseLeave(trigger, { relatedTarget: tooltip });
      hover(tooltip);
      await settle(50);
      const open = screen.queryByRole('tooltip') !== null;
      cleanup();
      return open;
    };
    expect(await moveOntoPopup()).toBe(true);
    // Known-invalid control: the omitted Base UI prop closes on the same input.
    expect(await moveOntoPopup({ disableHoverablePopup: true })).toBe(false);
  },
  'tooltip.no-tab-stop': async () => {
    renderTooltip({ defaultOpen: true });
    await settle(0);
    const tooltip = screen.getByRole('tooltip');
    expect(
      tooltip.querySelectorAll('a, button, input, select, textarea'),
    ).toHaveLength(0);
    expect(tooltip.tabIndex).toBeLessThan(0);
    const tabStops = Array.from(
      document.querySelectorAll<HTMLElement>('[tabindex="0"], button'),
    ).filter((element) => !element.hasAttribute('data-base-ui-focus-guard'));
    expect(tabStops).toHaveLength(1);
  },
};
