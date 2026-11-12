import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { expect } from 'vitest';
import { Resizable } from '../../components/Resizable.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

type GroupProps = ComponentProps<typeof Resizable.Group>;

/** Three panels split by two named handles. */
export function Layout(props: Partial<GroupProps>) {
  return (
    <Resizable.Group {...props}>
      <Resizable.Panel panelId="nav" defaultSize={30} minSize={20} maxSize={50}>
        Navigation
      </Resizable.Panel>
      <Resizable.Handle aria-label="Resize navigation" />
      <Resizable.Panel panelId="main" defaultSize={50} minSize={20}>
        Main
      </Resizable.Panel>
      <Resizable.Handle aria-label="Resize details" />
      <Resizable.Panel
        panelId="details"
        defaultSize={20}
        minSize={10}
        maxSize={30}
      >
        Details
      </Resizable.Panel>
    </Resizable.Group>
  );
}

export const handles = () => screen.getAllByRole('separator');
export const value = (handle: HTMLElement) =>
  Number(handle.getAttribute('aria-valuenow'));
export const key = (handle: HTMLElement, name: string) =>
  fireEvent.keyDown(handle, { key: name });

/** Gives jsdom, which has no layout, panel sizes for pointer calculations. */
export function mockPanelSizes(pixels: number, axis: 'width' | 'height') {
  for (const panel of document.querySelectorAll('[data-ui-resizable-panel]')) {
    const percent = Number(
      (panel as HTMLElement).style.getPropertyValue(
        '--ui-resizable-panel-size',
      ),
    );
    (panel as HTMLElement).getBoundingClientRect = () =>
      ({
        width: axis === 'width' ? (pixels * percent) / 100 : 0,
        height: axis === 'height' ? (pixels * percent) / 100 : 0,
      }) as DOMRect;
  }
}

export function drag(
  handle: HTMLElement,
  from: number,
  to: number,
  axis: 'clientX' | 'clientY' = 'clientX',
) {
  fireEvent.pointerDown(handle, { pointerId: 1, button: 0, [axis]: from });
  fireEvent.pointerMove(handle, { pointerId: 1, [axis]: to });
  fireEvent.pointerUp(handle, { pointerId: 1, [axis]: to });
}

export const resizableChecks: Record<string, QualityCheck> = {
  'resizable.separator-semantics': async () => {
    for (const orientation of ['horizontal', 'vertical'] as const) {
      const { container, unmount } = render(
        <Layout orientation={orientation} />,
      );
      const [first, second] = handles() as [HTMLElement, HTMLElement];
      for (const handle of [first, second]) {
        expect(handle).toHaveAttribute('tabindex', '0');
        // The separator line is perpendicular to the panel layout.
        expect(handle).toHaveAttribute(
          'aria-orientation',
          orientation === 'horizontal' ? 'vertical' : 'horizontal',
        );
      }
      expect(first).toHaveAccessibleName('Resize navigation');
      expect(second).toHaveAccessibleName('Resize details');
      await waitFor(() => expect(value(first)).toBe(30));
      expect(first).toHaveAttribute('aria-valuemin', '20');
      expect(first).toHaveAttribute('aria-valuemax', '50');
      expect(first).toHaveAttribute(
        'aria-controls',
        document.querySelector('[data-ui-resizable-panel="nav"]')?.id,
      );
      expect(value(second)).toBe(50);
      expect(second).toHaveAttribute('aria-valuemin', '40');
      expect(second).toHaveAttribute('aria-valuemax', '60');
      expect(second).toHaveAttribute(
        'aria-controls',
        document.querySelector('[data-ui-resizable-panel="main"]')?.id,
      );
      expect((await audit(container)).violations).toEqual([]);
      unmount();
    }
  },
  'resizable.keyboard-constraints': async () => {
    const layouts: Record<string, number>[] = [];
    render(<Layout onLayoutChange={(layout) => layouts.push(layout)} />);
    const [first, second] = handles() as [HTMLElement, HTMLElement];
    await waitFor(() => expect(value(first)).toBe(30));
    first.focus();
    key(first, 'ArrowRight');
    expect(value(first)).toBe(35);
    expect(layouts.at(-1)).toEqual({ nav: 35, main: 45, details: 20 });
    key(first, 'ArrowLeft');
    key(first, 'ArrowLeft');
    expect(value(first)).toBe(25);
    // Home and End stop at the limits of the panel and its neighbour.
    key(first, 'End');
    expect(value(first)).toBe(50);
    key(first, 'ArrowRight');
    expect(value(first)).toBe(50);
    key(first, 'Home');
    expect(value(first)).toBe(20);
    // The neighbour's limit also applies: details cannot exceed 30.
    key(second, 'ArrowLeft');
    key(second, 'ArrowLeft');
    key(second, 'ArrowLeft');
    expect(value(second)).toBe(50);
    expect(layouts.at(-1)).toEqual({ nav: 20, main: 50, details: 30 });
    expect(first).toHaveFocus();
  },
  'resizable.pointer': async () => {
    const layouts: Record<string, number>[] = [];
    render(
      <Layout
        onLayoutChange={(layout) => layouts.push(layout)}
        style={{ inlineSize: 1000 }}
      />,
    );
    const [first] = handles() as [HTMLElement];
    await waitFor(() => expect(value(first)).toBe(30));
    // Two panels hold 80% of 1000px: 100px is 10% of the group.
    mockPanelSizes(1000, 'width');
    drag(first, 300, 400);
    expect(value(first)).toBe(40);
    expect(first).toHaveFocus();
    expect(first).not.toHaveAttribute('data-dragging');
    // The limit is honored when dragging past it.
    drag(first, 400, 900);
    expect(value(first)).toBe(50);
    // Moves after release are ignored.
    fireEvent.pointerMove(first, { pointerId: 1, clientX: 0 });
    expect(value(first)).toBe(50);
    // Pointer cancel ends a drag.
    fireEvent.pointerDown(first, { pointerId: 2, button: 0, clientX: 500 });
    expect(first).toHaveAttribute('data-dragging');
    fireEvent.pointerCancel(first, { pointerId: 2 });
    expect(first).not.toHaveAttribute('data-dragging');
    // Only the primary button starts a drag.
    fireEvent.pointerDown(first, { pointerId: 3, button: 2, clientX: 500 });
    expect(first).not.toHaveAttribute('data-dragging');
    expect(layouts.length).toBeGreaterThan(0);
  },
  'resizable.layout': async () => {
    const view = render(
      <Resizable.Group>
        <Resizable.Panel panelId="a">A</Resizable.Panel>
        <Resizable.Handle aria-label="Resize A" />
        <Resizable.Panel panelId="b" defaultSize={50}>
          B
        </Resizable.Panel>
        <Resizable.Handle aria-label="Resize B" />
        <Resizable.Panel panelId="c">C</Resizable.Panel>
      </Resizable.Group>,
    );
    const sizes = () =>
      ['a', 'b', 'c'].map((id) =>
        Number(
          document
            .querySelector<HTMLElement>(`[data-ui-resizable-panel="${id}"]`)
            ?.style.getPropertyValue('--ui-resizable-panel-size'),
        ),
      );
    // Panels without defaultSize share what remains of 100%.
    await waitFor(() => expect(sizes()).toEqual([25, 50, 25]));
    // Removing a panel re-resolves the layout to 100%, keeping proportions.
    view.rerender(
      <Resizable.Group>
        <Resizable.Panel panelId="a">A</Resizable.Panel>
        <Resizable.Handle aria-label="Resize A" />
        <Resizable.Panel panelId="b" defaultSize={50}>
          B
        </Resizable.Panel>
      </Resizable.Group>,
    );
    await waitFor(() => expect(handles()).toHaveLength(1));
    await waitFor(() => {
      const [a, b] = [sizes()[0] as number, sizes()[1] as number];
      expect(a + b).toBeCloseTo(100, 3);
      expect(b).toBeGreaterThan(a);
    });
  },
};
