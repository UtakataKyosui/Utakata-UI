import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import type { InputGroupAddonAlign } from '../metadata/components/InputGroup.js';
import { Button, type ButtonProps } from './Button.js';
import { withClassName } from './classNames.js';

export type InputGroupRootProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'className'
> & {
  className?: string;
};

export type InputGroupAddonProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'className'
> & {
  className?: string;
  /**
   * Spacing and placement around the input. It does not reorder content:
   * put inline-start/block-start addons before the input in the DOM and
   * inline-end/block-end addons after it so reading and Tab order match.
   */
  align?: InputGroupAddonAlign;
};

export type InputGroupTextProps = Omit<
  ComponentPropsWithoutRef<'span'>,
  'className'
> & {
  className?: string;
};

/** Button props; defaults to variant="ghost" and size="sm". */
export type InputGroupButtonProps = ButtonProps;

/**
 * Visual frame around one Input or Textarea and its addons. It adds no role
 * or input state; the label, value and validation stay on the control.
 */
const Root = forwardRef<HTMLDivElement, InputGroupRootProps>(
  function InputGroupRoot({ className, ...props }, ref) {
    return (
      <div
        {...props}
        ref={ref}
        className={withClassName('ui-input-group', className)}
      />
    );
  },
);

const Addon = forwardRef<HTMLDivElement, InputGroupAddonProps>(
  function InputGroupAddon(
    { className, align = 'inline-start', ...props },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        className={withClassName(
          `ui-input-group__addon ui-input-group__addon--${align}`,
          className,
        )}
      />
    );
  },
);

/** Static prefix/suffix text. Link meaningful units to the input with aria-describedby. */
const Text = forwardRef<HTMLSpanElement, InputGroupTextProps>(
  function InputGroupText({ className, ...props }, ref) {
    return (
      <span
        {...props}
        ref={ref}
        className={withClassName('ui-input-group__text', className)}
      />
    );
  },
);

/** An existing Button sized for the group; Base UI renders type="button". */
const InputGroupButton = forwardRef<HTMLElement, InputGroupButtonProps>(
  function InputGroupButton(props, ref) {
    return (
      <Button
        variant="ghost"
        size="sm"
        {...props}
        ref={ref}
        className={withClassName('ui-input-group__button', props.className)}
      />
    );
  },
);

export const InputGroup = { Root, Addon, Text, Button: InputGroupButton };
