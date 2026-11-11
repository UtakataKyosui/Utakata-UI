import {
  type ComponentPropsWithoutRef,
  forwardRef,
  type ReactNode,
} from 'react';
import type { EmptyTitleLevel } from '../metadata/components/Empty.js';
import { withClassName } from './classNames.js';
import { type WithLismProps, withLism } from './lism.js';

export type EmptyRootProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<'div'>, 'aria-live' | 'role'> & {
    'aria-live'?: never;
    role?: never;
  }
>;

export type EmptyTitleProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<'h3'>, 'children'> & {
    /** Choose the heading level from the page outline. */
    level?: EmptyTitleLevel;
    children: ReactNode;
  }
>;

export type EmptyDescriptionProps = WithLismProps<
  ComponentPropsWithoutRef<'p'>
>;
export type EmptyActionsProps = WithLismProps<ComponentPropsWithoutRef<'div'>>;

const Root = withLism(
  forwardRef<HTMLDivElement, EmptyRootProps>(function EmptyRoot(
    { className, 'aria-live': _live, role: _role, ...props },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        className={withClassName('ui-empty', className)}
      />
    );
  }),
);

const Title = withLism(
  forwardRef<HTMLHeadingElement, EmptyTitleProps>(function EmptyTitle(
    { className, level = '3', ...props },
    ref,
  ) {
    const Heading = `h${level}` as const;
    return (
      <Heading
        {...props}
        ref={ref}
        className={withClassName('ui-empty__title', className)}
      />
    );
  }),
);

const Description = withLism(
  forwardRef<HTMLParagraphElement, EmptyDescriptionProps>(
    function EmptyDescription({ className, ...props }, ref) {
      return (
        <p
          {...props}
          ref={ref}
          className={withClassName('ui-empty__description', className)}
        />
      );
    },
  ),
);

const Actions = withLism(
  forwardRef<HTMLDivElement, EmptyActionsProps>(function EmptyActions(
    { className, ...props },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        className={withClassName('ui-empty__actions', className)}
      />
    );
  }),
);

/** A static empty state with a heading, an explanation and optional actions. */
export const Empty = { Root, Title, Description, Actions };
