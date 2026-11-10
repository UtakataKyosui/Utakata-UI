'use client';

import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import type { RadioGroupOrientation } from '../metadata/components/RadioGroup.js';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';
import { useFormResetKey } from './formReset.js';
import { type WithLismProps, withLism } from './lism.js';

export type RadioGroupRootProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<typeof BaseRadioGroup>, 'className'> & {
    className?: string;
    /** Layout only; Base UI arrow keys work in both directions. */
    orientation?: RadioGroupOrientation;
  }
>;

export type RadioGroupItemProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<typeof BaseRadio.Root>, 'className'> & {
    className?: string;
  }
>;

export type RadioGroupIndicatorProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<typeof BaseRadio.Indicator>, 'className'> & {
    className?: string;
  }
>;

const groupTarget = {
  name: 'RadioGroup.Root',
  fix: 'Provide aria-label or an aria-labelledby that references visible text.',
};

const itemTarget = {
  name: 'RadioGroup.Item',
  fix: 'Provide visible text content, aria-label or a valid aria-labelledby.',
  nameFromContent: true,
};

const Root = withLism(
  forwardRef<HTMLDivElement, RadioGroupRootProps>(function RadioGroupRoot(
    { className, orientation = 'vertical', inputRef, ...props },
    ref,
  ) {
    const accessibilityRef = useAccessibilityRef(groupTarget, ref);
    // Form reset restores defaultValue; see useFormResetKey.
    const [resetKey, resetRef] = useFormResetKey(inputRef);
    return (
      <BaseRadioGroup
        {...props}
        key={resetKey}
        inputRef={resetRef}
        ref={accessibilityRef}
        data-orientation={orientation}
        className={withClassName(
          `ui-radio-group ui-radio-group--${orientation}`,
          className,
        )}
      />
    );
  }),
);

const Item = withLism(
  forwardRef<HTMLElement, RadioGroupItemProps>(function RadioGroupItem(
    { className, ...props },
    ref,
  ) {
    const accessibilityRef = useAccessibilityRef(itemTarget, ref);
    return (
      <BaseRadio.Root
        {...props}
        ref={accessibilityRef}
        className={withClassName('ui-radio-group__item', className)}
      />
    );
  }),
);

const Indicator = withLism(
  forwardRef<HTMLSpanElement, RadioGroupIndicatorProps>(
    function RadioGroupIndicator(
      { className, keepMounted = true, ...props },
      ref,
    ) {
      return (
        <BaseRadio.Indicator
          {...props}
          keepMounted={keepMounted}
          ref={ref}
          className={withClassName('ui-radio-group__indicator', className)}
        />
      );
    },
  ),
);

export const RadioGroup = { Root, Item, Indicator };
