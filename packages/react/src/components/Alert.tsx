import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import type { AlertVariant } from '../metadata/components/Alert.js';
import { withClassName } from './classNames.js';

export type AlertRootProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'className' | 'role'
> & {
  className?: string;
  variant?: AlertVariant;
  /**
   * Unset for static messages. Use "alert" only for urgent messages inserted
   * dynamically and "status" for non-urgent updates.
   */
  role?: 'alert' | 'status';
};

export type AlertTitleProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'className'
> & {
  className?: string;
};

export type AlertDescriptionProps = AlertTitleProps;

const Root = forwardRef<HTMLDivElement, AlertRootProps>(function AlertRoot(
  { className, variant = 'default', ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={withClassName(`ui-alert ui-alert--${variant}`, className)}
    />
  );
});

const Title = forwardRef<HTMLDivElement, AlertTitleProps>(function AlertTitle(
  { className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={withClassName('ui-alert__title', className)}
    />
  );
});

const Description = forwardRef<HTMLDivElement, AlertDescriptionProps>(
  function AlertDescription({ className, ...props }, ref) {
    return (
      <div
        {...props}
        ref={ref}
        className={withClassName('ui-alert__description', className)}
      />
    );
  },
);

/** An in-page message. Variant changes appearance only, never role or focus. */
export const Alert = { Root, Title, Description };
