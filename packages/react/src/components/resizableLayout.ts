/** Size constraints of one panel, in percent of the group. */
export interface PanelConstraint {
  id: string;
  defaultSize: number | undefined;
  minSize: number;
  maxSize: number;
}

export type Layout = Record<string, number>;

const precision = 1e4;
const round = (value: number) => Math.round(value * precision) / precision;
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

/**
 * Resolves panel sizes (percent, summing to 100) from the previous layout or
 * default sizes. Panels without a size share the remaining space equally.
 * Sizes are clamped to each panel's range; the remainder is spread
 * proportionally to the current sizes of panels that still have room.
 */
export function resolveLayout(
  panels: readonly PanelConstraint[],
  previous: Layout = {},
): Layout {
  if (!panels.length) return {};
  const wanted = panels.map((panel) => previous[panel.id] ?? panel.defaultSize);
  const known = wanted.reduce<number>((sum, size) => sum + (size ?? 0), 0);
  const unknown = wanted.filter((size) => size === undefined).length;
  const share = unknown ? Math.max(0, 100 - known) / unknown : 0;
  const equal = 100 / panels.length;
  const sizes = panels.map((panel, index) =>
    clamp(
      wanted[index] ?? (share > 0 ? share : equal),
      panel.minSize,
      panel.maxSize,
    ),
  );
  for (let pass = 0; pass <= panels.length; pass++) {
    const difference = 100 - sizes.reduce((sum, size) => sum + size, 0);
    if (Math.abs(difference) < 1e-9) break;
    const room = panels.map((panel, index) =>
      Math.max(
        0,
        difference > 0
          ? panel.maxSize - (sizes[index] as number)
          : (sizes[index] as number) - panel.minSize,
      ),
    );
    const weights = sizes.map((size, index) =>
      (room[index] as number) > 0 ? size : 0,
    );
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    const eligible = room.filter((value) => value > 0).length;
    if (!eligible) break;
    for (let index = 0; index < sizes.length; index++) {
      if (!(room[index] as number)) continue;
      const share =
        total > 0 ? (weights[index] as number) / total : 1 / eligible;
      sizes[index] =
        (sizes[index] as number) +
        Math.sign(difference) *
          Math.min(room[index] as number, Math.abs(difference) * share);
    }
  }
  return Object.fromEntries(
    panels.map((panel, index) => [panel.id, round(sizes[index] as number)]),
  );
}

/** Range the "before" panel may take while its neighbour absorbs the change. */
export function pairRange(
  layout: Layout,
  before: PanelConstraint,
  after: PanelConstraint,
) {
  const value = layout[before.id] ?? 0;
  const total = value + (layout[after.id] ?? 0);
  const min = Math.max(before.minSize, total - after.maxSize);
  const max = Math.min(before.maxSize, total - after.minSize);
  return min <= max
    ? { value, total, min: round(min), max: round(max) }
    : { value, total, min: value, max: value };
}

/** Moves the boundary between two neighbours; other panels are untouched. */
export function movePair(
  layout: Layout,
  before: PanelConstraint,
  after: PanelConstraint,
  target: number,
): Layout {
  const range = pairRange(layout, before, after);
  const next = round(clamp(target, range.min, range.max));
  if (next === range.value) return layout;
  return {
    ...layout,
    [before.id]: next,
    [after.id]: round(range.total - next),
  };
}

/** Range of the panel before a Handle, as reported by pairRange. */
interface Range {
  value: number;
  total: number;
  min: number;
  max: number;
}

/** Target size of the panel before a Handle for a key, if the key resizes. */
export function keyboardTarget(
  key: string,
  range: Range,
  step: number,
  horizontal: boolean,
  rtl: boolean,
): number | undefined {
  if (key === 'Home') return range.min;
  if (key === 'End') return range.max;
  const along: Record<string, number> = horizontal
    ? { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }
    : { ArrowDown: 1, ArrowUp: -1 };
  const direction = along[key];
  return direction === undefined ? undefined : range.value + direction * step;
}

export const hasModifier = (event: {
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}) => event.altKey || event.ctrlKey || event.metaKey;

/** A pointer drag in progress: where it began and what it measures against. */
export interface DragState {
  pointerId: number;
  start: number;
  value: number;
  total: number;
  pixels: number;
  sign: number;
}

interface PointerPosition {
  pointerId: number;
  clientX: number;
  clientY: number;
}

/** Captures the drag origin; undefined when the panels cannot be measured. */
export function startDrag(options: {
  event: PointerPosition;
  range: Range;
  horizontal: boolean;
  rtl: boolean;
  before: HTMLElement | undefined;
  after: HTMLElement | undefined;
}): DragState | undefined {
  const { event, range, horizontal, rtl, before, after } = options;
  if (!before || !after) return undefined;
  const a = before.getBoundingClientRect();
  const b = after.getBoundingClientRect();
  return {
    pointerId: event.pointerId,
    start: horizontal ? event.clientX : event.clientY,
    value: range.value,
    total: range.total,
    pixels: horizontal ? a.width + b.width : a.height + b.height,
    sign: horizontal && rtl ? -1 : 1,
  };
}

/** Size of the panel before the Handle for the pointer position of a drag. */
export function dragTarget(
  drag: DragState,
  event: PointerPosition,
  horizontal: boolean,
): number | undefined {
  if (drag.pointerId !== event.pointerId || drag.pixels <= 0) return undefined;
  const moved =
    ((horizontal ? event.clientX : event.clientY) - drag.start) * drag.sign;
  return drag.value + (moved / drag.pixels) * drag.total;
}
