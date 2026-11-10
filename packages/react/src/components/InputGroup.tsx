import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import type { InputGroupAddonAlign } from '../metadata/components/InputGroup.js';
import { Button, type ButtonProps } from './Button.js';
import { withClassName } from './classNames.js';
import { type WithLismProps, withLism } from './lism.js';

export type InputGroupRootProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<'div'>, 'className'> & {
    className?: string;
  }
>;

export type InputGroupAddonProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<'div'>, 'className'> & {
    className?: string;
    /**
     * Spacing and placement around the input. It does not reorder content:
     * put inline-start/block-start addons before the input in the DOM and
     * inline-end/block-end addons after it so reading and Tab order match.
     */
    align?: InputGroupAddonAlign;
  }
>;

export type InputGroupTextProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<'span'>, 'className'> & {
    className?: string;
  }
>;

/** Button props; defaults to variant="ghost" and size="sm". */
export type InputGroupButtonProps = WithLismProps<ButtonProps>;

/**
 * Visual frame around one Input or Textarea and its addons. It adds no role
 * or input state; the label, value and validation stay on the control.
 */
const Root = withLism(
  forwardRef<HTMLDivElement, InputGroupRootProps>(function InputGroupRoot(
    { className, ...props },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        className={withClassName('ui-input-group', className)}
      />
    );
  }),
);

const Addon = withLism(
  forwardRef<HTMLDivElement, InputGroupAddonProps>(function InputGroupAddon(
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
  }),
);

/** Static prefix/suffix text. Link meaningful units to the input with aria-describedby. */
const Text = withLism(
  forwardRef<HTMLSpanElement, InputGroupTextProps>(function InputGroupText(
    { className, ...props },
    ref,
  ) {
    return (
      <span
        {...props}
        ref={ref}
        className={withClassName('ui-input-group__text', className)}
      />
    );
  }),
);

/** An existing Button sized for the group; Base UI renders type="button". */
const InputGroupButton = withLism(
  forwardRef<HTMLElement, InputGroupButtonProps>(
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
  ),
);

export const InputGroup = { Root, Addon, Text, Button: InputGroupButton };
