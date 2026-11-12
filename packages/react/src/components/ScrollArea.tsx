import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import { withClassName } from './classNames.js';
import { type WithLismProps, withLism } from './lism.js';

type ScrollAreaNativeProps = Omit<
  ComponentPropsWithoutRef<'section'>,
  'role' | 'tabIndex' | 'aria-label' | 'aria-labelledby'
> & {
  /** Hide the native scrollbar while keeping the area scrollable. */
  scrollbar?: 'auto' | 'hidden';
  role?: never;
  tabIndex?: never;
} & (
    | { 'aria-label': string; 'aria-labelledby'?: never }
    | { 'aria-label'?: never; 'aria-labelledby': string }
  );

export type ScrollAreaProps = WithLismProps<ScrollAreaNativeProps>;

/** A named, keyboard-focusable region that uses native browser scrolling. */
export const ScrollArea = withLism(
  forwardRef<HTMLElement, ScrollAreaNativeProps>(function ScrollArea(
    { className, scrollbar = 'auto', ...props },
    ref,
  ) {
    return (
      <section
        {...props}
        ref={ref}
        data-scrollbar={scrollbar}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be keyboard focusable to scroll it.
        tabIndex={0}
        className={withClassName('ui-scroll-area', className)}
      />
    );
  }),
);
