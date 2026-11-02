'use client';

import { Switch as BaseSwitch } from '@base-ui/react/switch';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';
import { useFormResetKey } from './formReset.js';

export type SwitchRootProps = Omit<
  ComponentPropsWithoutRef<typeof BaseSwitch.Root>,
  'className'
> & {
  className?: string;
};

export type SwitchThumbProps = Omit<
  ComponentPropsWithoutRef<typeof BaseSwitch.Thumb>,
  'className'
> & {
  className?: string;
};

const switchTarget = {
  name: 'Switch.Root',
  fix: 'Place it in Field.Root with a Field.Label, wrap it in a label element, or provide aria-label or aria-labelledby.',
};

const Root = forwardRef<HTMLElement, SwitchRootProps>(function SwitchRoot(
  { className, inputRef, ...props },
  ref,
) {
  const accessibilityRef = useAccessibilityRef(switchTarget, ref);
  // Form reset restores defaultChecked; see useFormResetKey.
  const [resetKey, resetRef] = useFormResetKey(inputRef);
  return (
    <BaseSwitch.Root
      {...props}
      key={resetKey}
      inputRef={resetRef}
      ref={accessibilityRef}
      className={withClassName('ui-switch', className)}
    />
  );
});

const Thumb = forwardRef<HTMLSpanElement, SwitchThumbProps>(
  function SwitchThumb({ className, ...props }, ref) {
    return (
      <BaseSwitch.Thumb
        {...props}
        ref={ref}
        className={withClassName('ui-switch__thumb', className)}
      />
    );
  },
);

export const Switch = { Root, Thumb };
