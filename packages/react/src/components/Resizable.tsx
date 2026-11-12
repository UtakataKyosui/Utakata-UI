'use client';

import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  createContext,
  forwardRef,
  type KeyboardEvent,
  type PointerEvent,
  type Ref,
  type RefObject,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ResizableOrientation } from '../metadata/components/Resizable.js';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';
import { type WithLismProps, withLism } from './lism.js';
import {
  type DragState,
  dragTarget,
  hasModifier,
  keyboardTarget,
  type Layout,
  movePair,
  type PanelConstraint,
  pairRange,
  resolveLayout,
  startDrag,
} from './resizableLayout.js';

// Replaced by consumer bundlers, as with React; no Node typings at runtime.
declare const process: { env: { NODE_ENV?: string } };

const panelAttribute = 'data-ui-resizable-panel';

interface PanelEntry extends PanelConstraint {
  element: HTMLElement;
}

interface GroupContext {
  orientation: ResizableOrientation;
  layout: Layout;
  /** Changes when panels register or change constraints. */
  version: number;
  keyboardStep: number;
  registerPanel: (entry: PanelEntry) => () => void;
  getPanel: (id: string) => PanelEntry | undefined;
  /** Sets the size of `before` (percent); `after` absorbs the difference. */
  resize: (before: string, after: string, target: number) => void;
}

const GroupContext = createContext<GroupContext | null>(null);

function useGroup(part: string) {
  const group = useContext(GroupContext);
  if (!group)
    throw new Error(
      `Resizable.${part} must be rendered inside Resizable.Group.`,
    );
  return group;
}

type ResizableDivProps = Omit<ComponentPropsWithoutRef<'div'>, 'className'> & {
  className?: string;
};

/**
 * Lays out Panels in a row or column. Sizes are percentages of the group and
 * are uncontrolled: use `defaultSize` and observe `onLayoutChange`.
 */
export type ResizableGroupProps = WithLismProps<
  ResizableDivProps & {
    /** `horizontal` places panels side by side; `vertical` stacks them. */
    orientation?: ResizableOrientation;
    /** Percent moved by one arrow key press. */
    keyboardStep?: number;
    /** Called with the size in percent of every panel after a user resize. */
    onLayoutChange?: (layout: Record<string, number>) => void;
  }
>;

/**
 * A resizable region. `panelId` is required: it is the stable key of the
 * panel in layouts (`onLayoutChange`) and in persisted sizes. The native `id`
 * is optional; a unique one is generated when it is omitted.
 */
export type ResizablePanelProps = WithLismProps<
  ResizableDivProps & {
    panelId: string;
    /** Initial size in percent. Panels without it share the remainder. */
    defaultSize?: number;
    /** Smallest size in percent. */
    minSize?: number;
    /** Largest size in percent. */
    maxSize?: number;
  }
>;

/**
 * A focusable splitter between two neighbouring Panels. It must be named by
 * aria-label or aria-labelledby, for example "Resize navigation".
 */
export type ResizableHandleProps = WithLismProps<
  Omit<
    ComponentPropsWithoutRef<'div'>,
    | 'className'
    | 'children'
    | 'role'
    | 'tabIndex'
    | 'aria-label'
    | 'aria-labelledby'
    | 'aria-orientation'
    | 'aria-valuenow'
    | 'aria-valuemin'
    | 'aria-valuemax'
    | 'aria-controls'
  > & {
    className?: string;
    // Optional `never` members also reject these when props arrive through a spread.
    role?: never;
    tabIndex?: never;
    'aria-orientation'?: never;
    'aria-valuenow'?: never;
    'aria-valuemin'?: never;
    'aria-valuemax'?: never;
    'aria-controls'?: never;
  } & (
      | { 'aria-label': string; 'aria-labelledby'?: never }
      | { 'aria-label'?: never; 'aria-labelledby': string }
    )
>;

const handleTarget = {
  name: 'Resizable.Handle',
  fix: 'Pass aria-label or a valid aria-labelledby that says which panel is resized.',
};

function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (value: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(value);
      else if (ref) (ref as { current: T | null }).current = value;
    }
  };
}

const Group = withLism(
  forwardRef<HTMLDivElement, ResizableGroupProps>(function ResizableGroup(
    {
      className,
      orientation = 'horizontal',
      keyboardStep = 5,
      onLayoutChange,
      ...props
    },
    ref,
  ) {
    const panels = useRef(new Map<string, PanelEntry>());
    const layoutRef = useRef<Layout>({});
    const [layout, setLayout] = useState<Layout>({});
    const [version, setVersion] = useState(0);
    const onChange = useRef(onLayoutChange);
    onChange.current = onLayoutChange;

    const registerPanel = useCallback((entry: PanelEntry) => {
      panels.current.set(entry.id, entry);
      setVersion((value) => value + 1);
      return () => {
        if (panels.current.get(entry.id) === entry)
          panels.current.delete(entry.id);
        setVersion((value) => value + 1);
      };
    }, []);

    // Resolve sizes before paint whenever panels or their constraints change.
    // biome-ignore lint/correctness/useExhaustiveDependencies: `version` signals registry changes held in a ref.
    useLayoutEffect(() => {
      const ordered = [...panels.current.values()].sort((a, b) =>
        a.element.compareDocumentPosition(b.element) &
        Node.DOCUMENT_POSITION_FOLLOWING
          ? -1
          : 1,
      );
      const next = resolveLayout(ordered, layoutRef.current);
      const same =
        Object.keys(next).length === Object.keys(layoutRef.current).length &&
        Object.entries(next).every(
          ([id, size]) => layoutRef.current[id] === size,
        );
      if (same) return;
      layoutRef.current = next;
      setLayout(next);
    }, [version]);

    const getPanel = useCallback((id: string) => panels.current.get(id), []);
    const resize = useCallback(
      (before: string, after: string, target: number) => {
        const a = panels.current.get(before);
        const b = panels.current.get(after);
        if (!a || !b) return;
        const next = movePair(layoutRef.current, a, b, target);
        if (next === layoutRef.current) return;
        layoutRef.current = next;
        setLayout(next);
        onChange.current?.(next);
      },
      [],
    );

    const context = useMemo(
      () => ({
        orientation,
        layout,
        version,
        keyboardStep,
        registerPanel,
        getPanel,
        resize,
      }),
      [
        orientation,
        layout,
        version,
        keyboardStep,
        registerPanel,
        getPanel,
        resize,
      ],
    );

    return (
      <GroupContext.Provider value={context}>
        <div
          {...props}
          ref={ref}
          data-orientation={orientation}
          className={withClassName(
            `ui-resizable ui-resizable--${orientation}`,
            className,
          )}
        />
      </GroupContext.Provider>
    );
  }),
);

const Panel = withLism(
  forwardRef<HTMLDivElement, ResizablePanelProps>(function ResizablePanel(
    {
      className,
      panelId,
      id,
      defaultSize,
      minSize = 10,
      maxSize = 100,
      style,
      ...props
    },
    ref,
  ) {
    const group = useGroup('Panel');
    const generatedId = useId();
    const element = useRef<HTMLDivElement | null>(null);
    const { registerPanel } = group;
    useLayoutEffect(() => {
      if (!element.current) return;
      return registerPanel({
        id: panelId,
        defaultSize,
        minSize,
        maxSize,
        element: element.current,
      });
    }, [registerPanel, panelId, defaultSize, minSize, maxSize]);
    const size = group.layout[panelId] ?? defaultSize ?? 1;
    return (
      <div
        {...props}
        {...{ [panelAttribute]: panelId }}
        id={id ?? generatedId}
        ref={mergeRefs(element, ref)}
        style={
          {
            '--ui-resizable-panel-size': size,
            ...style,
          } as CSSProperties
        }
        className={withClassName('ui-resizable__panel', className)}
      />
    );
  }),
);

function neighbourId(element: Element | null) {
  return element instanceof HTMLElement
    ? (element.getAttribute(panelAttribute) ?? undefined)
    : undefined;
}

type Pair = { before: string; after: string };
type Callbacks = Pick<
  ComponentPropsWithoutRef<'div'>,
  | 'onKeyDown'
  | 'onPointerDown'
  | 'onPointerMove'
  | 'onPointerUp'
  | 'onPointerCancel'
>;

/** The neighbouring Panels define what a Handle resizes. */
function useNeighbours(element: RefObject<HTMLDivElement | null>) {
  const { version } = useGroup('Handle');
  const [pair, setPair] = useState<Pair | null>(null);
  const warned = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: `version` signals that the panels changed.
  useLayoutEffect(() => {
    const node = element.current;
    const before = neighbourId(node?.previousElementSibling ?? null);
    const after = neighbourId(node?.nextElementSibling ?? null);
    if (before && after) {
      setPair((current) =>
        current?.before === before && current.after === after
          ? current
          : { before, after },
      );
      return;
    }
    setPair(null);
    if (process.env.NODE_ENV !== 'production' && !warned.current) {
      warned.current = true;
      console.warn(
        '[Utakata-UI a11y] Resizable.Handle: place the Handle directly between two Resizable.Panel elements.',
      );
    }
  }, [element, version]);
  return pair;
}

const isRtl = (element: HTMLElement | null) =>
  element ? getComputedStyle(element).direction === 'rtl' : false;

/** Keyboard, pointer drag and consumer callbacks of a Handle. */
function useSplitterEvents(
  element: RefObject<HTMLDivElement | null>,
  pair: Pair | null,
  range: ReturnType<typeof pairRange> | undefined,
  callbacks: Callbacks,
) {
  const group = useGroup('Handle');
  const [dragging, setDragging] = useState(false);
  const drag = useRef<DragState | null>(null);
  const horizontal = group.orientation === 'horizontal';

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    callbacks.onKeyDown?.(event);
    if (event.defaultPrevented || hasModifier(event) || !pair || !range) return;
    const target = keyboardTarget(
      event.key,
      range,
      group.keyboardStep,
      horizontal,
      isRtl(element.current),
    );
    if (target === undefined) return;
    event.preventDefault();
    group.resize(pair.before, pair.after, target);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    callbacks.onPointerDown?.(event);
    if (event.defaultPrevented || event.button !== 0 || !pair || !range) return;
    const state = startDrag({
      event,
      range,
      horizontal,
      rtl: isRtl(element.current),
      before: group.getPanel(pair.before)?.element,
      after: group.getPanel(pair.after)?.element,
    });
    if (!state) return;
    drag.current = state;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.currentTarget.focus();
    setDragging(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    callbacks.onPointerMove?.(event);
    const target = drag.current && dragTarget(drag.current, event, horizontal);
    if (pair && target !== undefined && target !== null)
      group.resize(pair.before, pair.after, target);
  };

  const endDrag =
    (callback?: (event: PointerEvent<HTMLDivElement>) => void) =>
    (event: PointerEvent<HTMLDivElement>) => {
      callback?.(event);
      if (drag.current?.pointerId !== event.pointerId) return;
      drag.current = null;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      setDragging(false);
    };

  return {
    dragging,
    // Markuplint's React spec does not know these event attributes, so they
    // are spread; React and the DOM support them.
    handlers: {
      onKeyDown,
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag(callbacks.onPointerUp),
      onPointerCancel: endDrag(callbacks.onPointerCancel),
    },
  };
}

const Handle = withLism(
  forwardRef<HTMLDivElement, ResizableHandleProps>(function ResizableHandle(
    {
      className,
      onKeyDown,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      ...props
    },
    ref,
  ) {
    const group = useGroup('Handle');
    const element = useRef<HTMLDivElement | null>(null);
    const accessibilityRef = useAccessibilityRef(handleTarget, ref);
    const setRef = useMemo(
      () => mergeRefs(element, accessibilityRef),
      [accessibilityRef],
    );
    const pair = useNeighbours(element);
    const before = pair && group.getPanel(pair.before);
    const after = pair && group.getPanel(pair.after);
    const range =
      before && after ? pairRange(group.layout, before, after) : undefined;
    const { dragging, handlers } = useSplitterEvents(element, pair, range, {
      onKeyDown,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    });
    const horizontal = group.orientation === 'horizontal';

    return (
      // biome-ignore lint/a11y/useSemanticElements: <hr> cannot be a focusable, value-bearing splitter.
      <div
        {...props}
        ref={setRef}
        role="separator"
        tabIndex={0}
        aria-orientation={horizontal ? 'vertical' : 'horizontal'}
        aria-controls={before?.element.id}
        aria-valuenow={range?.value}
        aria-valuemin={range?.min}
        aria-valuemax={range?.max}
        data-orientation={group.orientation}
        data-dragging={dragging ? '' : undefined}
        {...handlers}
        className={withClassName('ui-resizable__handle', className)}
      />
    );
  }),
);

export const Resizable = { Group, Panel, Handle };
