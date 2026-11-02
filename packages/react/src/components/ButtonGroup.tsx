import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import type { ButtonGroupOrientation } from '../metadata/components/ButtonGroup.js';
import { withClassName } from './classNames.js';

/** A group of related buttons must be named by aria-label or aria-labelledby. */
export type ButtonGroupProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'className' | 'role' | 'aria-label' | 'aria-labelledby'
> & {
  className?: string;
  orientation?: ButtonGroupOrientation;
  // Optional `never` members also reject the name when props arrive through a spread.
  role?: never;
} & (
    | { 'aria-label': string; 'aria-labelledby'?: never }
    | { 'aria-label'?: never; 'aria-labelledby': string }
  );

/**
 * Joins related Buttons visually. Each Button keeps its own Tab stop,
 * variant, size, disabled state and type; there is no roving focus.
 */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  function ButtonGroup(
    { className, orientation = 'horizontal', ...props },
    ref,
  ) {
    return (
      // biome-ignore lint/a11y/useSemanticElements: fieldset is for form controls; this groups action buttons.
      <div
        {...props}
        ref={ref}
        role="group"
        data-orientation={orientation}
        className={withClassName(
          `ui-button-group ui-button-group--${orientation}`,
          className,
        )}
      />
    );
  },
);
