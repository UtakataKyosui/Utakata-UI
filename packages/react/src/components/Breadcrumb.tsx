'use client';

import { useRender } from '@base-ui/react/use-render';
import { type ComponentPropsWithoutRef, forwardRef, type JSX } from 'react';
import { withClassName } from './classNames.js';

type BreadcrumbPartProps<Tag extends keyof JSX.IntrinsicElements> = Omit<
  ComponentPropsWithoutRef<Tag>,
  'className'
> & {
  className?: string;
};

/** Defaults to aria-label="パンくずリスト"; aria-labelledby replaces it. */
export type BreadcrumbRootProps = BreadcrumbPartProps<'nav'>;

/**
 * A link needs a destination: pass href, or a `render` element such as a
 * router link that provides it.
 */
export type BreadcrumbLinkProps = BreadcrumbPartProps<'a'> &
  (
    | { href: string; render?: useRender.RenderProp }
    | { href?: string; render: useRender.RenderProp }
  );

export type BreadcrumbPageProps = Omit<
  BreadcrumbPartProps<'span'>,
  'aria-current'
>;

export type BreadcrumbDecorationProps = Omit<
  BreadcrumbPartProps<'li'>,
  'aria-hidden' | 'role'
>;

const Root = forwardRef<HTMLElement, BreadcrumbRootProps>(
  function BreadcrumbRoot({ className, ...props }, ref) {
    return (
      <nav
        aria-label={props['aria-labelledby'] ? undefined : 'パンくずリスト'}
        {...props}
        ref={ref}
        className={withClassName('ui-breadcrumb', className)}
      />
    );
  },
);

const List = forwardRef<HTMLOListElement, BreadcrumbPartProps<'ol'>>(
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
);

const Item = forwardRef<HTMLLIElement, BreadcrumbPartProps<'li'>>(
  function BreadcrumbItem({ className, ...props }, ref) {
    return (
      <li
        {...props}
        ref={ref}
        className={withClassName('ui-breadcrumb__item', className)}
      />
    );
  },
);

/** Composes with router links through Base UI's `render` prop. */
const Link = forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  function BreadcrumbLink({ className, render, ...props }, ref) {
    return useRender({
      defaultTagName: 'a',
      render,
      ref,
      props: {
        ...props,
        className: withClassName('ui-breadcrumb__link', className),
      },
    });
  },
);

/** The current page; exposes aria-current="page" and is not a link. */
const Page = forwardRef<HTMLSpanElement, BreadcrumbPageProps>(
  function BreadcrumbPage({ className, ...props }, ref) {
    return (
      <span
        {...props}
        ref={ref}
        aria-current="page"
        className={withClassName('ui-breadcrumb__page', className)}
      />
    );
  },
);

/** A decorative list item between items; hidden from assistive technology. */
const Separator = forwardRef<HTMLLIElement, BreadcrumbDecorationProps>(
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
);

/** A decorative mark for collapsed levels inside an Item; not interactive. */
const Ellipsis = forwardRef<
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
});

export const Breadcrumb = { Root, List, Item, Link, Page, Separator, Ellipsis };
