'use client';

import { Avatar as BaseAvatar } from '@base-ui/react/avatar';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import type { AvatarSize } from '../metadata/components/Avatar.js';
import { withClassName } from './classNames.js';
import { type WithLismProps, withLism } from './lism.js';

export type AvatarRootProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<typeof BaseAvatar.Root>, 'className'> & {
    className?: string;
    size?: AvatarSize;
  }
>;

export type AvatarImageProps = WithLismProps<
  Omit<
    ComponentPropsWithoutRef<typeof BaseAvatar.Image>,
    'className' | 'alt'
  > & {
    className?: string;
    /** The name of the person or organization, or "" when a visible name is adjacent. */
    alt: string;
  }
>;

export type AvatarFallbackProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<typeof BaseAvatar.Fallback>, 'className'> & {
    className?: string;
  }
>;

const Root = withLism(
  forwardRef<HTMLSpanElement, AvatarRootProps>(function AvatarRoot(
    { className, size = 'md', ...props },
    ref,
  ) {
    return (
      <BaseAvatar.Root
        {...props}
        ref={ref}
        className={withClassName(`ui-avatar ui-avatar--${size}`, className)}
      />
    );
  }),
);

const Image = withLism(
  forwardRef<HTMLImageElement, AvatarImageProps>(function AvatarImage(
    { className, ...props },
    ref,
  ) {
    return (
      <BaseAvatar.Image
        {...props}
        ref={ref}
        className={withClassName('ui-avatar__image', className)}
      />
    );
  }),
);

const Fallback = withLism(
  forwardRef<HTMLSpanElement, AvatarFallbackProps>(function AvatarFallback(
    { className, ...props },
    ref,
  ) {
    return (
      <BaseAvatar.Fallback
        {...props}
        ref={ref}
        className={withClassName('ui-avatar__fallback', className)}
      />
    );
  }),
);

/** Base UI Avatar with a required image text alternative. */
export const Avatar = { Root, Image, Fallback };
