'use client';

import { useRender } from '@base-ui/react/use-render';
import {
  type ComponentPropsWithoutRef,
  createContext,
  forwardRef,
  type JSX,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { withClassName } from './classNames.js';
import { type WithLismProps, withLism } from './lism.js';

// Replaced by consumer bundlers, as with React; no Node typings at runtime.
declare const process: { env: { NODE_ENV?: string } };

type ItemPartProps<Tag extends keyof JSX.IntrinsicElements> = WithLismProps<
  Omit<ComponentPropsWithoutRef<Tag>, 'className'> & {
    className?: string;
  }
>;

/**
 * A static row. It has no role, is not focusable and has no click handler:
 * `onClick`, `tabIndex` and `role` are rejected so the whole row can never be
 * an unnamed, keyboard-inaccessible control. Make the row operable with
 * `Item.Link` or `Item.Button` inside `Item.Title`, and put further operations
 * in `Item.Actions`.
 */
export type ItemRootProps = WithLismProps<
  Omit<
    ComponentPropsWithoutRef<'div'>,
    'className' | 'onClick' | 'tabIndex' | 'role'
  > & {
    className?: string;
    onClick?: never;
    tabIndex?: never;
    role?: never;
  }
>;

export type ItemGroupProps = ItemPartProps<'ul'>;

/** Always decorative: put the meaning in `Item.Title` text instead. */
export type ItemIconProps = WithLismProps<
  Omit<
    ComponentPropsWithoutRef<'div'>,
    'className' | 'aria-hidden' | 'aria-label' | 'aria-labelledby' | 'role'
  > & {
    className?: string;
    'aria-hidden'?: never;
    'aria-label'?: never;
    'aria-labelledby'?: never;
    role?: never;
  }
>;

export type ItemBodyProps = ItemPartProps<'div'>;
export type ItemTitleProps = ItemPartProps<'div'>;
export type ItemDescriptionProps = ItemPartProps<'p'>;
export type ItemMetaProps = ItemPartProps<'div'>;
export type ItemActionsProps = ItemPartProps<'div'>;

/**
 * The row's primary navigation. It needs a destination: pass href, or a
 * `render` element such as a router link that provides it. Its children are the
 * accessible name and must stay text or non-interactive content.
 */
export type ItemLinkProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<'a'>, 'className' | 'role' | 'children'> & {
    className?: string;
    role?: never;
    children: ReactNode;
  } & (
      | { href: string; render?: useRender.RenderProp }
      | { href?: string; render: useRender.RenderProp }
    )
>;

/**
 * The row's primary action. Always a native `button` with type="button"; use
 * `Item.Link` to navigate. Its children are the accessible name.
 */
export type ItemButtonProps = WithLismProps<
  Omit<
    ComponentPropsWithoutRef<'button'>,
    'className' | 'type' | 'role' | 'children'
  > & {
    className?: string;
    type?: never;
    role?: never;
    children: ReactNode;
  }
>;

const InGroupContext = createContext(false);

const interactiveSelector = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  '[tabindex]',
  '[role="button"]',
  '[role="link"]',
].join(',');

function diagnose(root: HTMLElement): string[] {
  const issues: string[] = [];
  const links = Array.from(
    root.querySelectorAll<HTMLElement>('.ui-item__link'),
  );
  if (links.length > 1)
    issues.push(
      `Item has ${links.length} primary links or buttons. Use one Item.Link or Item.Button per Item and put other operations in Item.Actions.`,
    );
  for (const link of links) {
    if (link.querySelector(interactiveSelector))
      issues.push(
        'Item.Link or Item.Button contains an interactive element. Interactive elements must not be nested; move Buttons and links to Item.Actions.',
      );
    if (link.closest('.ui-item__actions, .ui-item__meta, .ui-item__icon'))
      issues.push(
        'Item.Link or Item.Button must be inside Item.Title or Item.Body, not Item.Actions, Item.Meta or Item.Icon.',
      );
  }
  const outer = root.parentElement?.closest(
    'a[href], button, [role="button"], [role="link"]',
  );
  if (outer)
    issues.push(
      'Item is inside an interactive element. Make the Item itself operable with Item.Link or Item.Button instead of wrapping it.',
    );
  return issues;
}

// Development-only DOM relationship check. Types cannot see JSX composition, so
// this complements them; it does not prove actual keyboard or AT behavior.
function useItemDiagnostics(ref: { current: HTMLElement | null }) {
  useEffect(() => {
    const root = ref.current;
    if (!root || process.env.NODE_ENV === 'production') return;
    const reported = new Set<string>();
    const check = () => {
      if (!root.isConnected) return;
      for (const message of diagnose(root)) {
        if (reported.has(message)) continue;
        reported.add(message);
        console.warn(`[Utakata-UI a11y] Item: ${message}`);
      }
    };
    const initial = setTimeout(check, 0);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new MutationObserver(() => {
      if (timer !== undefined) return;
      timer = setTimeout(() => {
        timer = undefined;
        check();
      }, 0);
    });
    observer.observe(root, { subtree: true, childList: true });
    return () => {
      clearTimeout(initial);
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [ref]);
}

/** A list of items. Renders a `ul`; each `Item.Root` inside becomes an `li`. */
const Group = withLism(
  forwardRef<HTMLUListElement, ItemGroupProps>(function ItemGroup(
    { className, children, ...props },
    ref,
  ) {
    return (
      <InGroupContext.Provider value={true}>
        <ul
          {...props}
          ref={ref}
          className={withClassName('ui-item-group', className)}
        >
          {children}
        </ul>
      </InGroupContext.Provider>
    );
  }),
);

const Root = withLism(
  forwardRef<HTMLElement, ItemRootProps>(function ItemRoot(
    { className, ...props },
    ref,
  ) {
    const inGroup = useContext(InGroupContext);
    const element = useRef<HTMLElement | null>(null);
    useImperativeHandle(ref, () => element.current as HTMLElement);
    useItemDiagnostics(element);
    const classes = withClassName('ui-item', className);
    // A nested group is not a list item of the outer one.
    return inGroup ? (
      <InGroupContext.Provider value={false}>
        <li
          {...(props as ComponentPropsWithoutRef<'li'>)}
          ref={element as RefObject<HTMLLIElement>}
          className={classes}
        />
      </InGroupContext.Provider>
    ) : (
      <div
        {...props}
        ref={element as RefObject<HTMLDivElement>}
        className={classes}
      />
    );
  }),
);

const Icon = withLism(
  forwardRef<HTMLDivElement, ItemIconProps>(function ItemIcon(
    { className, ...props },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        aria-hidden="true"
        className={withClassName('ui-item__icon', className)}
      />
    );
  }),
);

const Body = withLism(
  forwardRef<HTMLDivElement, ItemBodyProps>(function ItemBody(
    { className, ...props },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        className={withClassName('ui-item__body', className)}
      />
    );
  }),
);

const Title = withLism(
  forwardRef<HTMLDivElement, ItemTitleProps>(function ItemTitle(
    { className, ...props },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        className={withClassName('ui-item__title', className)}
      />
    );
  }),
);

const Description = withLism(
  forwardRef<HTMLParagraphElement, ItemDescriptionProps>(
    function ItemDescription({ className, ...props }, ref) {
      return (
        <p
          {...props}
          ref={ref}
          className={withClassName('ui-item__description', className)}
        />
      );
    },
  ),
);

/** Supplementary static information such as a date or status text. */
const Meta = withLism(
  forwardRef<HTMLDivElement, ItemMetaProps>(function ItemMeta(
    { className, ...props },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        className={withClassName('ui-item__meta', className)}
      />
    );
  }),
);

/** Operations of their own, as siblings of the primary link or button. */
const Actions = withLism(
  forwardRef<HTMLDivElement, ItemActionsProps>(function ItemActions(
    { className, ...props },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        className={withClassName('ui-item__actions', className)}
      />
    );
  }),
);

/** Composes with router links through Base UI's `render` prop. */
const Link = withLism(
  forwardRef<HTMLAnchorElement, ItemLinkProps>(function ItemLink(
    { className, render, ...props },
    ref,
  ) {
    return useRender({
      defaultTagName: 'a',
      render,
      ref,
      props: {
        ...props,
        className: withClassName('ui-item__title ui-item__link', className),
      },
    });
  }),
);

const ItemButton = withLism(
  forwardRef<HTMLButtonElement, ItemButtonProps>(function ItemButton(
    { className, ...props },
    ref,
  ) {
    return (
      <button
        {...props}
        ref={ref}
        type="button"
        className={withClassName(
          'ui-item__title ui-item__link ui-item__button',
          className,
        )}
      />
    );
  }),
);

/**
 * A row of icon, body, meta and actions. Static by default; `Item.Link` or
 * `Item.Button` inside the body makes the whole row operable through one
 * stretched native control, and `Item.Actions` stay separate siblings.
 */
export const Item = {
  Group,
  Root,
  Icon,
  Body,
  Title,
  Description,
  Meta,
  Actions,
  Link,
  Button: ItemButton,
};
