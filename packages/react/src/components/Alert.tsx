import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import type { AlertVariant } from '../metadata/components/Alert.js';
import { withClassName } from './classNames.js';
import { type WithLismProps, withLism } from './lism.js';

export type AlertRootProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'role'> & {
    className?: string;
    variant?: AlertVariant;
    /**
     * Unset for static messages. Use "alert" only for urgent messages inserted
     * dynamically and "status" for non-urgent updates.
     */
    role?: 'alert' | 'status';
  }
>;

export type AlertTitleProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<'div'>, 'className'> & {
    className?: string;
  }
>;

export type AlertDescriptionProps = WithLismProps<AlertTitleProps>;

const Root = withLism(
  forwardRef<HTMLDivElement, AlertRootProps>(function AlertRoot(
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
  }),
);

const Title = withLism(
  forwardRef<HTMLDivElement, AlertTitleProps>(function AlertTitle(
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
  }),
);

const Description = withLism(
  forwardRef<HTMLDivElement, AlertDescriptionProps>(function AlertDescription(
    { className, ...props },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        className={withClassName('ui-alert__description', className)}
      />
    );
  }),
);

/** An in-page message. Variant changes appearance only, never role or focus. */
export const Alert = { Root, Title, Description };
