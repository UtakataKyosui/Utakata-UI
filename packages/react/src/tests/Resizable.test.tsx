import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { type ComponentProps, createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Resizable } from '../components/Resizable.js';
import {
  movePair,
  type PanelConstraint,
  pairRange,
  resolveLayout,
} from '../components/resizableLayout.js';
import {
  resizableManifest,
  resizableQualityRules,
} from '../metadata/components/Resizable.js';
import {
  drag,
  handles,
  key,
  Layout,
  mockPanelSizes,
  resizableChecks,
  value,
} from './quality/Resizable.checks.js';
import { expectAutomatedQuality, settle } from './quality-helpers.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Checked by pnpm typecheck without rendering invalid JSX.
type HandleProps = ComponentProps<typeof Resizable.Handle>;
const named: HandleProps = { 'aria-label': 'Resize' };
const referenced: HandleProps = { 'aria-labelledby': 'label' };
// @ts-expect-error A Handle needs aria-label or aria-labelledby.
const unnamed: HandleProps = {};
// @ts-expect-error Pass one name source, not both.
const bothNames: HandleProps = { 'aria-label': 'x', 'aria-labelledby': 'y' };
// @ts-expect-error The separator role is fixed.
const role: HandleProps = { 'aria-label': 'x', role: 'presentation' };
// @ts-expect-error The value is derived from the panels, not set directly.
const valueNow: HandleProps = { 'aria-label': 'x', 'aria-valuenow': 10 };
// @ts-expect-error Panels need a panelId, the key of their size in layouts.
const noId: ComponentProps<typeof Resizable.Panel> = {};
// @ts-expect-error Orientation is horizontal or vertical.
const diagonal: ComponentProps<typeof Resizable.Group> = { orientation: 'd' };
void [named, referenced, unnamed, bothNames, role, valueNow, noId, diagonal];

const constraint = (
  id: string,
  defaultSize?: number,
  minSize = 0,
  maxSize = 100,
): PanelConstraint => ({ id, defaultSize, minSize, maxSize });

describe('resizable layout math', () => {
  it('shares the remainder and fits sizes into 100 within limits', () => {
    expect(resolveLayout([constraint('a'), constraint('b')])).toEqual({
      a: 50,
      b: 50,
    });
    expect(
      resolveLayout([constraint('a', 70), constraint('b'), constraint('c')]),
    ).toEqual({ a: 70, b: 15, c: 15 });
    // Defaults that overflow are scaled back by the room each panel has.
    expect(resolveLayout([constraint('a', 80), constraint('b', 80)])).toEqual({
      a: 50,
      b: 50,
    });
    // Limits win over defaults, and the remainder moves to the other panel.
    expect(
      resolveLayout([constraint('a', 90, 0, 60), constraint('b', 10)]),
    ).toEqual({ a: 60, b: 40 });
    expect(resolveLayout([])).toEqual({});
  });

  it('moves a boundary within both neighbours limits only', () => {
    const a = constraint('a', 40, 20, 60);
    const b = constraint('b', 60, 30, 100);
    const layout = { a: 40, b: 60 };
    expect(pairRange(layout, a, b)).toEqual({
      value: 40,
      total: 100,
      min: 20,
      max: 60,
    });
    expect(movePair(layout, a, b, 90)).toEqual({ a: 60, b: 40 });
    expect(movePair(layout, a, b, 0)).toEqual({ a: 20, b: 80 });
    expect(movePair(layout, a, b, 40)).toBe(layout);
    // Panels outside the pair keep their size.
    expect(movePair({ ...layout, c: 10 }, a, b, 50).c).toBe(10);
    // Constraints that cannot be satisfied leave the pair unchanged.
    const stuck = constraint('a', 50, 60, 70);
    expect(
      pairRange({ a: 50, b: 50 }, stuck, constraint('b', 50, 60, 70)),
    ).toMatchObject({
      min: 50,
      max: 50,
    });
  });
});

describe('Resizable', () => {
  it('forwards refs, classes and native props to every part', () => {
    const group = createRef<HTMLDivElement>();
    const panel = createRef<HTMLDivElement>();
    const handle = createRef<HTMLDivElement>();
    render(
      <Resizable.Group
        ref={group}
        className="custom-group"
        data-testid="group"
        orientation="vertical"
      >
        <Resizable.Panel ref={panel} panelId="a" className="custom-panel">
          A
        </Resizable.Panel>
        <Resizable.Handle
          ref={handle}
          aria-label="Resize A"
          className="custom-handle"
          data-testid="handle"
        />
        <Resizable.Panel panelId="b">B</Resizable.Panel>
      </Resizable.Group>,
    );
    expect(group.current).toHaveClass(
      'ui-resizable',
      'ui-resizable--vertical',
      'custom-group',
    );
    expect(group.current).toHaveAttribute('data-orientation', 'vertical');
    expect(panel.current).toHaveClass('ui-resizable__panel', 'custom-panel');
    // A native id is generated for aria-controls unless one is given.
    expect(panel.current?.id).not.toBe('');
    expect(screen.getByTestId('handle')).toHaveAttribute(
      'aria-controls',
      panel.current?.id,
    );
    expect(handle.current).toHaveClass('ui-resizable__handle', 'custom-handle');
    expect(screen.getByTestId('handle')).toBe(handle.current);
  });

  it('uses the documented defaults', async () => {
    render(
      <Resizable.Group>
        <Resizable.Panel panelId="a">A</Resizable.Panel>
        <Resizable.Handle aria-label="Resize A" />
        <Resizable.Panel panelId="b">B</Resizable.Panel>
      </Resizable.Group>,
    );
    const [handle] = handles() as [HTMLElement];
    await waitFor(() => expect(value(handle)).toBe(50));
    // minSize 10, maxSize 100 and keyboardStep 5 by default.
    expect(handle).toHaveAttribute(
      'aria-valuemin',
      String(resizableManifest.props.minSize.default),
    );
    expect(handle).toHaveAttribute('aria-valuemax', '90');
    key(handle, 'ArrowRight');
    expect(value(handle)).toBe(
      50 + resizableManifest.props.keyboardStep.default,
    );
    key(handle, 'Home');
    expect(value(handle)).toBe(10);
  });

  it('applies keyboardStep and ignores other keys and modified keys', async () => {
    const changes = vi.fn();
    render(<Layout keyboardStep={2} onLayoutChange={changes} />);
    const [handle] = handles() as [HTMLElement];
    await waitFor(() => expect(value(handle)).toBe(30));
    key(handle, 'ArrowRight');
    expect(value(handle)).toBe(32);
    // Vertical arrows do not resize a horizontal group.
    key(handle, 'ArrowDown');
    key(handle, 'a');
    fireEvent.keyDown(handle, { key: 'ArrowRight', ctrlKey: true });
    fireEvent.keyDown(handle, { key: 'ArrowRight', altKey: true });
    fireEvent.keyDown(handle, { key: 'ArrowRight', metaKey: true });
    expect(value(handle)).toBe(32);
    expect(changes).toHaveBeenCalledTimes(1);
  });

  it('resizes a vertical group with the vertical arrows and drag', async () => {
    render(<Layout orientation="vertical" style={{ blockSize: 800 }} />);
    const [handle] = handles() as [HTMLElement];
    await waitFor(() => expect(value(handle)).toBe(30));
    key(handle, 'ArrowRight');
    expect(value(handle)).toBe(30);
    key(handle, 'ArrowDown');
    expect(value(handle)).toBe(35);
    key(handle, 'ArrowUp');
    key(handle, 'ArrowUp');
    expect(value(handle)).toBe(25);
    mockPanelSizes(1000, 'height');
    drag(handle, 100, 200, 'clientY');
    // 100px of the 800px held by both panels is 10% of the group.
    expect(value(handle)).toBe(35);
  });

  it('reverses the horizontal keys and drag for right-to-left layouts', async () => {
    render(<Layout dir="rtl" style={{ direction: 'rtl', inlineSize: 1000 }} />);
    const [handle] = handles() as [HTMLElement];
    await waitFor(() => expect(value(handle)).toBe(30));
    // The first panel is on the right, so ArrowLeft grows it.
    key(handle, 'ArrowRight');
    expect(value(handle)).toBe(25);
    key(handle, 'ArrowLeft');
    key(handle, 'ArrowLeft');
    expect(value(handle)).toBe(35);
    mockPanelSizes(1000, 'width');
    drag(handle, 500, 400);
    expect(value(handle)).toBe(45);
    // Handles stay a vertical separator in a horizontal group.
    expect(handle).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('keeps a stable layout when panels change and reports user changes only', async () => {
    const changes = vi.fn();
    const view = render(
      <Resizable.Group onLayoutChange={changes}>
        <Resizable.Panel panelId="a" defaultSize={50}>
          A
        </Resizable.Panel>
        <Resizable.Handle aria-label="Resize A" />
        <Resizable.Panel panelId="b" defaultSize={50}>
          B
        </Resizable.Panel>
      </Resizable.Group>,
    );
    const [handle] = handles() as [HTMLElement];
    await waitFor(() => expect(value(handle)).toBe(50));
    expect(changes).not.toHaveBeenCalled();
    key(handle, 'ArrowRight');
    expect(changes).toHaveBeenCalledWith({ a: 55, b: 45 });
    // A new panel keeps the user's size for the existing ones when possible.
    view.rerender(
      <Resizable.Group onLayoutChange={changes}>
        <Resizable.Panel panelId="a" defaultSize={50}>
          A
        </Resizable.Panel>
        <Resizable.Handle aria-label="Resize A" />
        <Resizable.Panel panelId="b" defaultSize={50}>
          B
        </Resizable.Panel>
        <Resizable.Handle aria-label="Resize B" />
        <Resizable.Panel panelId="c" defaultSize={20}>
          C
        </Resizable.Panel>
      </Resizable.Group>,
    );
    await waitFor(() => expect(handles()).toHaveLength(2));
    const sum = ['a', 'b', 'c']
      .map((id) =>
        Number(
          document
            .querySelector<HTMLElement>(`[data-ui-resizable-panel="${id}"]`)
            ?.style.getPropertyValue('--ui-resizable-panel-size'),
        ),
      )
      .reduce((total, size) => total + size, 0);
    expect(sum).toBeCloseTo(100, 3);
  });

  it('merges custom styles and calls consumer handlers', async () => {
    const onKeyDown = vi.fn();
    const onPointerDown = vi.fn();
    render(
      <Resizable.Group>
        <Resizable.Panel panelId="a" style={{ color: 'red' }}>
          A
        </Resizable.Panel>
        <Resizable.Handle
          aria-label="Resize A"
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
        />
        <Resizable.Panel panelId="b">B</Resizable.Panel>
      </Resizable.Group>,
    );
    const [handle] = handles() as [HTMLElement];
    await waitFor(() => expect(value(handle)).toBe(50));
    expect(document.querySelector('[data-ui-resizable-panel="a"]')).toHaveStyle(
      {
        color: 'rgb(255, 0, 0)',
      },
    );
    key(handle, 'ArrowRight');
    fireEvent.pointerDown(handle, { pointerId: 1, button: 0 });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onPointerDown).toHaveBeenCalledTimes(1);
  });

  it('prevents default only for handled keys', async () => {
    render(<Layout />);
    const [handle] = handles() as [HTMLElement];
    await waitFor(() => expect(value(handle)).toBe(30));
    expect(fireEvent.keyDown(handle, { key: 'ArrowRight' })).toBe(false);
    expect(fireEvent.keyDown(handle, { key: 'Tab' })).toBe(true);
  });

  it('requires the group and warns about a handle without panels', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Resizable.Handle aria-label="Orphan" />)).toThrow(
      /inside Resizable.Group/,
    );
    error.mockRestore();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Resizable.Group>
        <Resizable.Handle aria-label="Lonely" />
      </Resizable.Group>,
    );
    await settle();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Resizable.Handle: place the Handle directly'),
    );
    expect(screen.getByRole('separator')).not.toHaveAttribute('aria-valuenow');
  });

  it('warns when a handle has no accessible name source', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Resizable.Group>
        <Resizable.Panel panelId="a">A</Resizable.Panel>
        {/* @ts-expect-error The name is required by the types. */}
        <Resizable.Handle />
        <Resizable.Panel panelId="b">B</Resizable.Panel>
      </Resizable.Group>,
    );
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          '[Utakata-UI a11y] Resizable.Handle: No accessible name source',
        ),
      ),
    );
  });

  it('does not warn for named handles', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <>
        <span id="title">Resize sidebar</span>
        <Resizable.Group>
          <Resizable.Panel panelId="a">A</Resizable.Panel>
          <Resizable.Handle aria-labelledby="title" />
          <Resizable.Panel panelId="b">B</Resizable.Panel>
        </Resizable.Group>
      </>,
    );
    await settle();
    expect(warn).not.toHaveBeenCalled();
    expect(
      screen.getByRole('separator', { name: 'Resize sidebar' }),
    ).toBeInTheDocument();
  });

  it('passes its automated quality rules', async () => {
    await expectAutomatedQuality(resizableQualityRules, resizableChecks);
  });
});
