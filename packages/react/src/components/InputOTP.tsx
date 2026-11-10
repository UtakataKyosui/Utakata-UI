'use client';

import { OTPField as BaseOTPField } from '@base-ui/react/otp-field';
import {
  type ComponentPropsWithoutRef,
  createContext,
  forwardRef,
  useContext,
  useMemo,
} from 'react';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';

type SlotLabeller = (position: number, length: number) => string;

type SlotNaming = {
  getSlotLabel: SlotLabeller;
  labelledBy: string | undefined;
};

const SlotNamingContext = createContext<SlotNaming | null>(null);

type BaseRootProps = ComponentPropsWithoutRef<typeof BaseOTPField.Root>;

/**
 * Base UI OTPField.Root props. `autoSubmit` is not provided: submitting when
 * the last character is typed changes context without warning (WCAG 3.2.2).
 * Submit explicitly or from `onValueComplete` instead. The code is labelled by
 * Field.Label or `aria-labelledby`, which name the first slot.
 */
export type InputOTPRootProps = Omit<
  BaseRootProps,
  'className' | 'autoSubmit' | 'aria-label'
> & {
  className?: string;
  /** Not supported: Base UI names only the first slot from a visible label. */
  'aria-label'?: never;
  /**
   * Returns the accessible name of a slot after the first, for example
   * "Digit 2 of 6". The first slot is named by the field label. Required so
   * that slots are not announced as duplicates of the same field.
   */
  getSlotLabel: SlotLabeller;
};

/** Base UI OTPField.Input props; `getSlotLabel` on Root names each slot. */
export type InputOTPSlotProps = Omit<
  ComponentPropsWithoutRef<typeof BaseOTPField.Input>,
  'className' | 'render' | 'aria-label' | 'aria-labelledby'
> & {
  className?: string;
};

export type InputOTPSeparatorProps = Omit<
  ComponentPropsWithoutRef<typeof BaseOTPField.Separator>,
  'className'
> & {
  className?: string;
};

const slotTarget = {
  name: 'InputOTP.Slot',
  fix: 'Place InputOTP.Root in Field.Root with a Field.Label, or pass aria-labelledby to Root.',
};

const Root = forwardRef<HTMLDivElement, InputOTPRootProps>(
  function InputOTPRoot({ className, getSlotLabel, ...props }, ref) {
    const labelledBy = props['aria-labelledby'];
    const naming = useMemo(
      () => ({ getSlotLabel, labelledBy }),
      [getSlotLabel, labelledBy],
    );
    return (
      <SlotNamingContext.Provider value={naming}>
        <BaseOTPField.Root
          {...props}
          ref={ref}
          className={withClassName('ui-input-otp', className)}
        />
      </SlotNamingContext.Provider>
    );
  },
);

const Slot = forwardRef<HTMLInputElement, InputOTPSlotProps>(
  function InputOTPSlot({ className, ...props }, ref) {
    const naming = useContext(SlotNamingContext);
    const accessibilityRef = useAccessibilityRef(slotTarget, ref);
    return (
      <BaseOTPField.Input
        {...props}
        ref={accessibilityRef}
        className={withClassName('ui-input-otp__slot', className)}
        render={(slotProps, state) => (
          // The first slot keeps the group label (Base UI does not pass a Root
          // aria-labelledby to it); later slots get a position name so they are
          // not announced as duplicates of the same field.
          <input
            {...slotProps}
            aria-label={
              state.index > 0 && naming
                ? naming.getSlotLabel(state.index + 1, state.length)
                : undefined
            }
            aria-labelledby={
              state.index > 0
                ? undefined
                : (slotProps['aria-labelledby'] ?? naming?.labelledBy)
            }
          />
        )}
      />
    );
  },
);

const Separator = forwardRef<HTMLDivElement, InputOTPSeparatorProps>(
  function InputOTPSeparator({ className, ...props }, ref) {
    return (
      <BaseOTPField.Separator
        aria-hidden="true"
        {...props}
        ref={ref}
        className={withClassName('ui-input-otp__separator', className)}
      />
    );
  },
);

export const InputOTP = { Root, Slot, Separator };
