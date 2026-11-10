'use client';

import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';
import { useFormResetKey } from './formReset.js';
import { type WithLismProps, withLism } from './lism.js';

export type CheckboxRootProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<typeof BaseCheckbox.Root>, 'className'> & {
    className?: string;
  }
>;

export type CheckboxIndicatorProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<typeof BaseCheckbox.Indicator>, 'className'> & {
    className?: string;
  }
>;

const checkboxTarget = {
  name: 'Checkbox.Root',
  fix: 'Place it in Field.Root with a Field.Label, wrap it in a label element, or provide aria-label or aria-labelledby.',
};

const Root = withLism(
  forwardRef<HTMLElement, CheckboxRootProps>(function CheckboxRoot(
    { className, inputRef, ...props },
    ref,
  ) {
    const accessibilityRef = useAccessibilityRef(checkboxTarget, ref);
    const [resetKey, resetRef] = useFormResetKey(inputRef);
    return (
      <BaseCheckbox.Root
        {...props}
        key={resetKey}
        inputRef={resetRef}
        ref={accessibilityRef}
        className={withClassName('ui-checkbox', className)}
      />
    );
  }),
);

/**
 * Shown while checked or indeterminate. Without children it draws a check
 * mark or a dash, so the mixed state is not conveyed by color alone.
 */
const Indicator = withLism(
  forwardRef<HTMLSpanElement, CheckboxIndicatorProps>(
    function CheckboxIndicator({ className, ...props }, ref) {
      return (
        <BaseCheckbox.Indicator
          {...props}
          ref={ref}
          className={withClassName('ui-checkbox__indicator', className)}
        />
      );
    },
  ),
);

export const Checkbox = { Root, Indicator };
