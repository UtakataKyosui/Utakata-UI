import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect } from 'vitest';
import { HoverCard } from '../../components/HoverCard.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';
import { settle } from '../quality-helpers.js';

export function renderHoverCard(
  props: { defaultOpen?: boolean; delay?: number } = {},
) {
  render(
    <HoverCard.Root defaultOpen={props.defaultOpen}>
      <HoverCard.Trigger href="/utakata" delay={props.delay ?? 0}>
        Utakata-UI
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Positioner sideOffset={8}>
          <HoverCard.Popup>
            An accessible React component library.
          </HoverCard.Popup>
          <HoverCard.Arrow />
        </HoverCard.Positioner>
      </HoverCard.Portal>
    </HoverCard.Root>,
  );
  return screen.getByRole('link', { name: 'Utakata-UI' });
}

/** Focus via keyboard modality so Base UI treats it as focus-visible. */
export async function keyboardFocus(element: HTMLElement) {
  fireEvent.keyDown(document.body, { key: 'Tab' });
  act(() => element.focus());
  await settle(0);
}

export const hoverCardChecks: Record<string, QualityCheck> = {
  'hover-card.trigger-link': async () => {
    const trigger = renderHoverCard({ defaultOpen: true });
    await settle(0);
    expect(trigger).toHaveAttribute('href', '/utakata');
    expect(trigger).toHaveAccessibleName('Utakata-UI');
    expect(
      screen.getByText(/accessible React component library/),
    ).toBeInTheDocument();
    const tabStops = Array.from(
      document.querySelectorAll<HTMLElement>('a[href], [tabindex="0"], button'),
    ).filter((element) => !element.hasAttribute('data-base-ui-focus-guard'));
    expect(tabStops).toEqual([trigger]);
    expect((await audit(trigger)).violations).toEqual([]);
  },
};
