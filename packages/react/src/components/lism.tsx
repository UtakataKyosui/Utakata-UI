import getLismProps, { type LismProps } from 'lism-css/lib/getLismProps';
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  createElement,
  type ElementType,
  forwardRef,
} from 'react';

/** Lism styling without an alternative ref or internal primitive classes. */
export type LismStyleProps = Omit<
  LismProps,
  | 'forwardedRef'
  | 'primitiveClass'
  | 'class'
  | `aria-${string}`
  | `data-${string}`
>;

/** Existing component constraints take precedence over overlapping Lism keys. */
export type WithLismProps<Props> = Props extends unknown
  ? Props & Omit<LismStyleProps, keyof Props>
  : never;

/** Translate Lism props on the existing element; introduce no wrapper DOM. */
export function withLism<Component extends ElementType>(
  Component: Component,
  nativeKeys: readonly string[] = [],
) {
  const Styled = forwardRef<
    ComponentRef<Component>,
    WithLismProps<ComponentPropsWithoutRef<Component>>
  >((props, ref) => {
    // Native attributes such as textarea rows/cols also exist as Lism grid
    // props. Keep the component's established meaning at runtime as in types.
    const styling = { ...props } as Record<string, unknown>;
    const native: Record<string, unknown> = {};
    for (const key of nativeKeys) {
      if (key in styling) native[key] = styling[key];
      delete styling[key];
    }
    // Unwrapped Base UI parts also accept state callbacks. Evaluate those at
    // Base UI's render time, after translating the independent Lism props.
    const className = styling.className;
    const style = styling.style;
    if (typeof className === 'function') delete styling.className;
    if (typeof style === 'function') delete styling.style;
    const translated = getLismProps(styling as LismProps);
    if (typeof className === 'function') {
      const lismClass = translated.className;
      translated.className = ((state: unknown) =>
        [className(state), lismClass]
          .filter(Boolean)
          .join(' ')) as unknown as string;
    }
    if (typeof style === 'function') {
      const lismStyle = translated.style;
      translated.style = ((state: unknown) => ({
        ...style(state),
        ...lismStyle,
      })) as unknown as NonNullable<typeof translated.style>;
    }
    return createElement(Component, {
      ...translated,
      ...native,
      ref,
    });
  });
  Styled.displayName = `WithLism(${typeof Component === 'string' ? Component : ((Component as { displayName?: string }).displayName ?? 'Component')})`;
  return Styled;
}
