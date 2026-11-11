'use client';

import { Button as BaseButton } from '@base-ui/react/button';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import type { ButtonSize, ButtonVariant } from '../metadata/manifest.js';
import { useAccessibilityRef } from './accessibility.js';
import { type WithLismProps, withLism } from './lism.js';

export type ButtonAccessibilityProps =
  | {
      iconOnly?: false;
      /** Square targets are available only with `iconOnly` (which requires a name). */
      square?: never;
    }
  | ({
      iconOnly: true;
      /** Render an equal-width square target sized by `size` (sm 32px, md 40px, lg 48px). */
      square?: boolean;
    } & ({ 'aria-label': string } | { 'aria-labelledby': string }));

export type ButtonProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<typeof BaseButton>, 'className'> & {
    className?: string;
    size?: ButtonSize;
    variant?: ButtonVariant;
  } & ButtonAccessibilityProps
>;

export const Button = withLism(
  forwardRef<HTMLElement, ButtonProps>(function Button(
    {
      className,
      size = 'md',
      variant = 'solid',
      iconOnly: _iconOnly,
      square,
      ...props
    },
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
          square && 'ui-button--square',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      />
    );
  }),
);
