import { render, screen } from '@testing-library/react';
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

export { keyboardFocus } from '../quality-helpers.js';

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
