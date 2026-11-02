'use client';

import { Progress as BaseProgress } from '@base-ui/react/progress';
import {
  type ComponentPropsWithoutRef,
  type ElementType,
  forwardRef,
  type ReactElement,
} from 'react';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';

type ProgressPartProps<T extends ElementType> = Omit<
  ComponentPropsWithoutRef<T>,
  'className'
> & {
  className?: string;
};

/**
 * A progress bar must have a name. Use `label` for the visible label rendered
 * through Progress.Label, or name it with aria-label / aria-labelledby.
 */
export type ProgressAccessibilityProps =
  | {
      label: string | ReactElement;
      'aria-label'?: never;
      'aria-labelledby'?: never;
    }
  | { label?: never; 'aria-label': string; 'aria-labelledby'?: never }
  | { label?: never; 'aria-label'?: never; 'aria-labelledby': string };

/**
 * `value: null` is indeterminate. Base UI also treats NaN and other non-finite
 * numbers as indeterminate and clamps finite values to `min`..`max`.
 */
export type ProgressRootProps = Omit<
  ProgressPartProps<typeof BaseProgress.Root>,
  'aria-label' | 'aria-labelledby'
> &
  ProgressAccessibilityProps;

export type ProgressTrackProps = ProgressPartProps<typeof BaseProgress.Track>;
export type ProgressIndicatorProps = ProgressPartProps<
  typeof BaseProgress.Indicator
>;
export type ProgressLabelProps = ProgressPartProps<typeof BaseProgress.Label>;
export type ProgressValueProps = ProgressPartProps<typeof BaseProgress.Value>;

const progressTarget = {
  name: 'Progress.Root',
  fix: 'Provide label, aria-label, or a valid aria-labelledby.',
};

const Label = forwardRef<HTMLSpanElement, ProgressLabelProps>(
  function ProgressLabel({ className, ...props }, ref) {
    return (
      <BaseProgress.Label
        {...props}
        ref={ref}
        className={withClassName('ui-progress__label', className)}
      />
    );
  },
);

const Root = forwardRef<HTMLDivElement, ProgressRootProps>(
  function ProgressRoot({ className, label, children, ...props }, ref) {
    const accessibilityRef = useAccessibilityRef(progressTarget, ref);
    return (
      <BaseProgress.Root
        {...props}
        ref={accessibilityRef}
        className={withClassName('ui-progress', className)}
      >
        {label === undefined ? null : <Label>{label}</Label>}
        {children}
      </BaseProgress.Root>
    );
  },
);

const Track = forwardRef<HTMLDivElement, ProgressTrackProps>(
  function ProgressTrack({ className, ...props }, ref) {
    return (
      <BaseProgress.Track
        {...props}
        ref={ref}
        className={withClassName('ui-progress__track', className)}
      />
    );
  },
);

const Indicator = forwardRef<HTMLDivElement, ProgressIndicatorProps>(
  function ProgressIndicator({ className, ...props }, ref) {
    return (
      <BaseProgress.Indicator
        {...props}
        ref={ref}
        className={withClassName('ui-progress__indicator', className)}
      />
    );
  },
);

/** Visual value text. It is aria-hidden; the progressbar exposes the value. */
const Value = forwardRef<HTMLSpanElement, ProgressValueProps>(
  function ProgressValue({ className, ...props }, ref) {
    return (
      <BaseProgress.Value
        {...props}
        ref={ref}
        className={withClassName('ui-progress__value', className)}
      />
    );
  },
);

export const Progress = { Root, Track, Indicator, Label, Value };
