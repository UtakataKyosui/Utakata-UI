'use client';

import { Button as BaseButton } from '@base-ui/react/button';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import type { ButtonSize, ButtonVariant } from '../metadata/manifest.js';
import { useAccessibilityRef } from './accessibility.js';

export type ButtonAccessibilityProps =
  | { iconOnly?: false }
  | ({ iconOnly: true } & (
      | { 'aria-label': string }
      | { 'aria-labelledby': string }
    ));

export type ButtonProps = Omit<
  ComponentPropsWithoutRef<typeof BaseButton>,
  'className'
> & {
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
} & ButtonAccessibilityProps;

export const Button = forwardRef<HTMLElement, ButtonProps>(function Button(
  { className, size = 'md', variant = 'solid', iconOnly: _iconOnly, ...props },
  ref,
) {
  const accessibilityRef = useAccessibilityRef('Button', ref);
  return (
    <BaseButton
      {...props}
      ref={accessibilityRef}
      className={[
        'ui-button',
        `ui-button--${variant}`,
        `ui-button--${size}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
});
