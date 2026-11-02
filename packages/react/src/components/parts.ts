import {
  type ComponentPropsWithoutRef,
  createElement,
  type ElementType,
  type ForwardRefExoticComponent,
  forwardRef,
  type RefAttributes,
} from 'react';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';

/** Base UI part props with the Utakata-UI string-only className convention. */
export type FloatingPartProps<T extends ElementType> = Omit<
  ComponentPropsWithoutRef<T>,
  'className'
> & {
  className?: string;
};

type FloatingPart<T extends ElementType> = ForwardRefExoticComponent<
  FloatingPartProps<T> & RefAttributes<HTMLElement>
>;

type ClassNameProps = { className?: string };

type DiagnosticTarget = Parameters<typeof useAccessibilityRef>[0];

/** Wraps a Base UI part, forwarding its ref and merging the ui-* class. */
export function classedPart<T extends ElementType>(
  Part: T,
  baseClassName: string,
  displayName: string,
) {
  const Component = forwardRef<HTMLElement, ClassNameProps>(
    ({ className, ...props }, ref) =>
      createElement(Part, {
        ...props,
        ref,
        className: withClassName(baseClassName, className),
      }),
  );
  Component.displayName = displayName;
  return Component as FloatingPart<T>;
}

/** Like classedPart, and also runs development accessible-name diagnostics. */
export function namedPart<T extends ElementType>(
  Part: T,
  baseClassName: string,
  target: Exclude<DiagnosticTarget, string>,
) {
  const Component = forwardRef<HTMLElement, ClassNameProps>(
    ({ className, ...props }, ref) =>
      createElement(Part, {
        ...props,
        ref: useAccessibilityRef(target, ref),
        className: withClassName(baseClassName, className),
      }),
  );
  Component.displayName = target.name;
  return Component as FloatingPart<T>;
}
