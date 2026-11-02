'use client';

import { Input as BaseInput } from '@base-ui/react/input';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import type { InputSize } from '../metadata/components/Input.js';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';

/**
 * Base UI Input props. The visual `size` replaces the native `size`
 * attribute; set the width with CSS instead.
 */
export type InputProps = Omit<
  ComponentPropsWithoutRef<typeof BaseInput>,
  'className' | 'size'
> & {
  className?: string;
  size?: InputSize;
};

const inputTarget = {
  name: 'Input',
  fix: 'Place it in Field.Root with a Field.Label, or provide a label element, aria-label or aria-labelledby.',
};

/**
 * A single-line text input. Inside Field.Root it replaces Field.Control, so
 * the label, description and error attach to this one input.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, size = 'md', type = 'text', ...props },
  ref,
) {
  const accessibilityRef = useAccessibilityRef(inputTarget, ref);
  return (
    <BaseInput
      {...props}
      type={type}
      ref={accessibilityRef}
      className={withClassName(`ui-input ui-input--${size}`, className)}
    />
  );
});
