'use client';

import { Toggle as BaseToggle } from '@base-ui/react/toggle';
import { forwardRef } from 'react';
import type {
  ToggleSize,
  ToggleVariant,
} from '../metadata/components/Toggle.js';
import { useAccessibilityRef } from './accessibility.js';
import type { ButtonAccessibilityProps } from './Button.js';
import { withClassName } from './classNames.js';
import { type WithLismProps, withLism } from './lism.js';

export type ToggleProps = WithLismProps<
  Omit<BaseToggle.Props, 'className' | 'ref'> & {
    className?: string;
    size?: ToggleSize;
    variant?: ToggleVariant;
  } & ButtonAccessibilityProps
>;

const toggleTarget = {
  name: 'Toggle',
  fix: 'Provide visible text, or iconOnly with aria-label or a valid aria-labelledby.',
  nameFromContent: true,
};

/** A pressed/unpressed button. Keep the label constant; aria-pressed conveys state. */
export const Toggle = withLism(
  forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
    {
      className,
      size = 'md',
      variant = 'ghost',
      iconOnly: _iconOnly,
      ...props
    },
    ref,
  ) {
    const accessibilityRef = useAccessibilityRef(toggleTarget, ref);
    return (
      <BaseToggle
        {...props}
        ref={accessibilityRef}
        className={withClassName(
          `ui-toggle ui-toggle--${variant} ui-toggle--${size}`,
          className,
        )}
      />
    );
  }),
);
