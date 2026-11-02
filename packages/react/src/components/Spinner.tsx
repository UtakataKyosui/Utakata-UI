import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import type { SpinnerSize } from '../metadata/components/Spinner.js';
import { withClassName } from './classNames.js';

export type SpinnerAccessibilityProps =
  | {
      decorative?: false;
      /** Visually hidden status text. Must not be empty. */
      label?: string;
    }
  | {
      /** Hides the Spinner; visible text nearby must state the progress. */
      decorative: true;
      label?: never;
    };

export type SpinnerProps = Omit<
  ComponentPropsWithoutRef<'span'>,
  | 'className'
  | 'children'
  | 'role'
  | 'aria-hidden'
  | 'aria-label'
  | 'aria-labelledby'
> & {
  className?: string;
  size?: SpinnerSize;
  // Declared as never (not only omitted): TypeScript skips excess-property
  // checks for hyphenated JSX attributes, so omission alone would allow them.
  /** The name comes from label; use decorative to hide the Spinner. */
  'aria-hidden'?: never;
  /** The name comes from label. */
  'aria-label'?: never;
  /** The name comes from label. */
  'aria-labelledby'?: never;
} & SpinnerAccessibilityProps;

/** An indeterminate loading indicator with a visually hidden status label. */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(
  function Spinner(
    {
      className,
      size = 'md',
      decorative = false,
      label = '読み込み中',
      ...props
    },
    ref,
  ) {
    const classes = withClassName(`ui-spinner ui-spinner--${size}`, className);
    const ring = <span className="ui-spinner__ring" aria-hidden="true" />;
    if (decorative)
      return (
        <span {...props} ref={ref} aria-hidden="true" className={classes}>
          {ring}
        </span>
      );
    return (
      <span {...props} ref={ref} role="status" className={classes}>
        {ring}
        <span className="ui-spinner__label">{label}</span>
      </span>
    );
  },
);
