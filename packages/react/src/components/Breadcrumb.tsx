'use client';

import { useRender } from '@base-ui/react/use-render';
import { type ComponentPropsWithoutRef, forwardRef, type JSX } from 'react';
import { withClassName } from './classNames.js';
import { type WithLismProps, withLism } from './lism.js';

type BreadcrumbPartProps<Tag extends keyof JSX.IntrinsicElements> =
  WithLismProps<
    Omit<ComponentPropsWithoutRef<Tag>, 'className'> & {
      className?: string;
    }
  >;

/** Defaults to aria-label="パンくずリスト"; aria-labelledby replaces it. */
export type BreadcrumbRootProps = WithLismProps<BreadcrumbPartProps<'nav'>>;

/**
 * A link needs a destination: pass href, or a `render` element such as a
 * router link that provides it.
 */
export type BreadcrumbLinkProps = WithLismProps<
  BreadcrumbPartProps<'a'> &
    (
      | { href: string; render?: useRender.RenderProp }
      | { href?: string; render: useRender.RenderProp }
    )
>;

// Optional `never` members also reject these names when props arrive through a spread.
export type BreadcrumbPageProps = WithLismProps<
  Omit<BreadcrumbPartProps<'span'>, 'aria-current'> & { 'aria-current'?: never }
>;

export type BreadcrumbDecorationProps = WithLismProps<
  Omit<BreadcrumbPartProps<'li'>, 'aria-hidden' | 'role'> & {
    'aria-hidden'?: never;
    role?: never;
  }
>;

const Root = withLism(
  forwardRef<HTMLElement, BreadcrumbRootProps>(function BreadcrumbRoot(
    { className, ...props },
    ref,
  ) {
    return (
      <nav
        aria-label={props['aria-labelledby'] ? undefined : 'パンくずリスト'}
        {...props}
        ref={ref}
        className={withClassName('ui-breadcrumb', className)}
      />
    );
  }),
);

const List = withLism(
  forwardRef<HTMLOListElement, BreadcrumbPartProps<'ol'>>(
    function BreadcrumbList({ className, children, ...props }, ref) {
      return (
        <ol
          {...props}
          ref={ref}
          className={withClassName('ui-breadcrumb__list', className)}
        >
          {children}
        </ol>
      );
    },
  ),
);

const Item = withLism(
  forwardRef<HTMLLIElement, BreadcrumbPartProps<'li'>>(function BreadcrumbItem(
    { className, ...props },
    ref,
  ) {
    return (
      <li
        {...props}
        ref={ref}
        className={withClassName('ui-breadcrumb__item', className)}
      />
    );
  }),
);

/** Composes with router links through Base UI's `render` prop. */
const Link = withLism(
  forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(function BreadcrumbLink(
    { className, render, ...props },
    ref,
  ) {
    return useRender({
      defaultTagName: 'a',
      render,
      ref,
      props: {
        ...props,
        className: withClassName('ui-breadcrumb__link', className),
      },
    });
  }),
);

/** The current page; exposes aria-current="page" and is not a link. */
const Page = withLism(
  forwardRef<HTMLSpanElement, BreadcrumbPageProps>(function BreadcrumbPage(
    { className, ...props },
    ref,
  ) {
    return (
      <span
        {...props}
        ref={ref}
        aria-current="page"
        className={withClassName('ui-breadcrumb__page', className)}
      />
    );
  }),
);

/** A decorative list item between items; hidden from assistive technology. */
const Separator = withLism(
  forwardRef<HTMLLIElement, BreadcrumbDecorationProps>(
    function BreadcrumbSeparator({ className, children = '/', ...props }, ref) {
      return (
        <li
          {...props}
          ref={ref}
          aria-hidden="true"
          className={withClassName('ui-breadcrumb__separator', className)}
        >
          {children}
        </li>
      );
    },
  ),
);

/** A decorative mark for collapsed levels inside an Item; not interactive. */
const Ellipsis = withLism(
  forwardRef<
    HTMLSpanElement,
    Omit<BreadcrumbPartProps<'span'>, 'aria-hidden' | 'role'>
  >(function BreadcrumbEllipsis({ className, children = '…', ...props }, ref) {
    return (
      <span
        {...props}
        ref={ref}
        aria-hidden="true"
        className={withClassName('ui-breadcrumb__ellipsis', className)}
      >
        {children}
      </span>
    );
  }),
);

export const Breadcrumb = { Root, List, Item, Link, Page, Separator, Ellipsis };
