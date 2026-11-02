import {
  type ComponentPropsWithoutRef,
  type ForwardedRef,
  forwardRef,
  type JSX,
} from 'react';
import { withClassName } from './classNames.js';

type PaginationPartProps<Tag extends keyof JSX.IntrinsicElements> = Omit<
  ComponentPropsWithoutRef<Tag>,
  'className'
> & {
  className?: string;
};

// Optional `never` members also reject these names when props arrive through a spread.
type AnchorProps = Omit<
  PaginationPartProps<'a'>,
  'href' | 'aria-current' | 'aria-disabled' | 'role'
> & {
  'aria-current'?: never;
  'aria-disabled'?: never;
  role?: never;
};

/** Defaults to aria-label="ページ送り"; aria-labelledby replaces it. */
export type PaginationRootProps = PaginationPartProps<'nav'>;

export type PaginationLinkProps = AnchorProps & {
  href: string;
  /** The current page; renders aria-current="page". */
  active?: boolean;
};

/**
 * An enabled Previous/Next needs a URL. When disabled it renders no href, is
 * removed from the Tab order and ignores clicks.
 */
export type PaginationDirectionProps = AnchorProps &
  ({ disabled?: false; href: string } | { disabled: true; href?: never });

export type PaginationEllipsisProps = Omit<
  PaginationPartProps<'span'>,
  'children' | 'role'
> & {
  children?: never;
  role?: never;
  /** Text read by assistive technology instead of the visual "…". */
  label?: string;
};

const Root = forwardRef<HTMLElement, PaginationRootProps>(
  function PaginationRoot({ className, ...props }, ref) {
    return (
      <nav
        aria-label={props['aria-labelledby'] ? undefined : 'ページ送り'}
        {...props}
        ref={ref}
        className={withClassName('ui-pagination', className)}
      />
    );
  },
);

const List = forwardRef<HTMLUListElement, PaginationPartProps<'ul'>>(
  function PaginationList({ className, children, ...props }, ref) {
    return (
      <ul
        {...props}
        ref={ref}
        className={withClassName('ui-pagination__list', className)}
      >
        {children}
      </ul>
    );
  },
);

const Item = forwardRef<HTMLLIElement, PaginationPartProps<'li'>>(
  function PaginationItem({ className, ...props }, ref) {
    return (
      <li
        {...props}
        ref={ref}
        className={withClassName('ui-pagination__item', className)}
      />
    );
  },
);

const Link = forwardRef<HTMLAnchorElement, PaginationLinkProps>(
  function PaginationLink({ className, active = false, ...props }, ref) {
    return (
      <a
        {...props}
        ref={ref}
        aria-current={active ? 'page' : undefined}
        className={withClassName('ui-pagination__link', className)}
      />
    );
  },
);

type DirectionLinkProps = PaginationDirectionProps & {
  direction: 'previous' | 'next';
  forwardedRef: ForwardedRef<HTMLAnchorElement>;
};

function DirectionLink({
  className,
  direction,
  disabled = false,
  forwardedRef,
  onClick,
  ...props
}: DirectionLinkProps) {
  // A disabled link has no href, so it is not focusable and cannot navigate.
  const state = disabled
    ? { href: undefined, role: 'link', 'aria-disabled': true as const }
    : { onClick };
  return (
    <a
      {...props}
      {...state}
      ref={forwardedRef}
      className={withClassName(
        `ui-pagination__link ui-pagination__${direction}`,
        className,
      )}
    />
  );
}

const Previous = forwardRef<HTMLAnchorElement, PaginationDirectionProps>(
  function PaginationPrevious({ children = '前のページ', ...props }, ref) {
    return (
      <DirectionLink {...props} direction="previous" forwardedRef={ref}>
        {children}
      </DirectionLink>
    );
  },
);

const Next = forwardRef<HTMLAnchorElement, PaginationDirectionProps>(
  function PaginationNext({ children = '次のページ', ...props }, ref) {
    return (
      <DirectionLink {...props} direction="next" forwardedRef={ref}>
        {children}
      </DirectionLink>
    );
  },
);

/** Marks skipped pages. It is not interactive. */
const Ellipsis = forwardRef<HTMLSpanElement, PaginationEllipsisProps>(
  function PaginationEllipsis(
    { className, label = '省略されたページ', ...props },
    ref,
  ) {
    return (
      <span
        {...props}
        ref={ref}
        className={withClassName('ui-pagination__ellipsis', className)}
      >
        <span aria-hidden="true">…</span>
        <span className="ui-pagination__hidden-text">{label}</span>
      </span>
    );
  },
);

export const Pagination = { Root, List, Item, Link, Previous, Next, Ellipsis };
