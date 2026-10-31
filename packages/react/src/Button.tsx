import { Button as BaseButton } from '@base-ui/react/button';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import type { ButtonSize, ButtonVariant } from './manifest.js';

export type ButtonProps = Omit<
  ComponentPropsWithoutRef<typeof BaseButton>,
  'className'
> & {
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

export const Button = forwardRef<HTMLElement, ButtonProps>(function Button(
  { className, size = 'md', variant = 'solid', ...props },
  ref,
) {
  return (
    <BaseButton
      {...props}
      ref={ref}
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
