import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import type { SeparatorOrientation } from '../metadata/manifest.js';
import { withClassName } from './classNames.js';

export type SeparatorProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'className' | 'role' | 'aria-orientation' | 'children'
> & {
  className?: string;
  orientation?: SeparatorOrientation;
  /** Decorative separators are hidden from assistive technology. */
  decorative?: boolean;
};

/**
 * A static separator. Base UI Separator always exposes role="separator", so
 * this renders HTML directly to support decorative separators.
 */
export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  function Separator(
    { className, orientation = 'horizontal', decorative = true, ...props },
    ref,
  ) {
    const semantics = decorative
      ? { 'aria-hidden': true as const }
      : {
          role: 'separator',
          // A separator is horizontal by default; only expose the override.
          'aria-orientation':
            orientation === 'vertical' ? ('vertical' as const) : undefined,
        };
    return (
      <div
        {...props}
        {...semantics}
        ref={ref}
        data-orientation={orientation}
        className={withClassName(
          `ui-separator ui-separator--${orientation}`,
          className,
        )}
      />
    );
  },
);
