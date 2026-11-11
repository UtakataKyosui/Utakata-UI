import {
  type ComponentPropsWithoutRef,
  forwardRef,
  type ReactNode,
} from 'react';
import type { BadgeVariant } from '../metadata/components/Badge.js';
import { withClassName } from './classNames.js';
import { type WithLismProps, withLism } from './lism.js';

export type BadgeProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<'span'>, 'className' | 'children'> & {
    className?: string;
    variant?: BadgeVariant;
    /** Visible text that states the status or category without relying on color. */
    children: ReactNode;
  }
>;

/** A static status or category label. It adds no role, focus or action. */
export const Badge = withLism(
  forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
    { className, variant = 'subtle', ...props },
    ref,
  ) {
    return (
      <span
        {...props}
        ref={ref}
        className={withClassName(`ui-badge ui-badge--${variant}`, className)}
      />
    );
  }),
);
