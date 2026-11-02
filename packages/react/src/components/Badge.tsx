import {
  type ComponentPropsWithoutRef,
  forwardRef,
  type ReactNode,
} from 'react';
import type { BadgeVariant } from '../metadata/components/Badge.js';
import { withClassName } from './classNames.js';

export type BadgeProps = Omit<
  ComponentPropsWithoutRef<'span'>,
  'className' | 'children'
> & {
  className?: string;
  variant?: BadgeVariant;
  /** Visible text that states the status or category without relying on color. */
  children: ReactNode;
};

/** A static status or category label. It adds no role, focus or action. */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
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
});
