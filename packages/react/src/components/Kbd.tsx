import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import type { KbdSize } from '../metadata/manifest.js';
import { withClassName } from './classNames.js';
import { type WithLismProps, withLism } from './lism.js';

type DisplayOnlyProps = {
  tabIndex?: never;
  contentEditable?: never;
  onKeyDown?: never;
  onKeyDownCapture?: never;
  onKeyUp?: never;
  onKeyUpCapture?: never;
  onKeyPress?: never;
  onKeyPressCapture?: never;
};

export type KbdProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<'kbd'>, 'className'> &
    DisplayOnlyProps & {
      className?: string;
      size?: KbdSize;
    }
>;

export type KbdGroupProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<'span'>, 'className' | 'role'> &
    DisplayOnlyProps & {
      className?: string;
    }
>;

/** Displays one key. Consumers supply the platform-specific key label. */
export const Kbd = withLism(
  forwardRef<HTMLElement, KbdProps>(function Kbd(
    { className, size = 'md', ...props },
    ref,
  ) {
    return (
      <kbd
        {...props}
        ref={ref}
        className={withClassName(`ui-kbd ui-kbd--${size}`, className)}
      />
    );
  }),
);

/**
 * Groups keys pressed together. When symbols read poorly, give the group an
 * aria-label and hide the visual key list with aria-hidden.
 */
export const KbdGroup = withLism(
  forwardRef<HTMLSpanElement, KbdGroupProps>(function KbdGroup(
    { className, ...props },
    ref,
  ) {
    return (
      // biome-ignore lint/a11y/useSemanticElements: fieldset is for form controls and is not phrasing content.
      <span
        {...props}
        ref={ref}
        role="group"
        className={withClassName('ui-kbd-group', className)}
      />
    );
  }),
);
