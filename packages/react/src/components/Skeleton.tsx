import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import type { SkeletonShape } from '../metadata/components/Skeleton.js';
import { withClassName } from './classNames.js';
import { type WithLismProps, withLism } from './lism.js';

export type SkeletonProps = WithLismProps<
  Omit<
    ComponentPropsWithoutRef<'div'>,
    'className' | 'children' | 'role' | 'aria-hidden' | 'tabIndex'
  > & {
    className?: string;
    shape?: SkeletonShape;
    // Optional `never` members also reject these names when props arrive through a spread.
    children?: never;
    role?: never;
    'aria-hidden'?: never;
    tabIndex?: never;
  }
>;

/**
 * A decorative loading placeholder, always hidden from assistive technology.
 * Announce loading from the parent with aria-busy and a status text.
 */
export const Skeleton = withLism(
  forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
    { className, shape = 'rect', ...props },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        aria-hidden="true"
        className={withClassName(
          `ui-skeleton ui-skeleton--${shape}`,
          className,
        )}
      />
    );
  }),
);
