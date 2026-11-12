'use client';

import { NavigationMenu as BaseNavigationMenu } from '@base-ui/react/navigation-menu';
import {
  type ForwardRefExoticComponent,
  forwardRef,
  type RefAttributes,
} from 'react';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';
import { type WithLismProps, withLism } from './lism.js';
import { classedPart, namedPart } from './parts.js';

/**
 * Base UI NavigationMenu root props. The navigation landmark must be named by
 * aria-label or aria-labelledby so it can be told apart from other landmarks.
 */
export type NavigationMenuRootProps = WithLismProps<
  Omit<
    BaseNavigationMenu.Root.Props,
    'className' | 'ref' | 'aria-label' | 'aria-labelledby'
  > & {
    className?: string;
  } & (
      | { 'aria-label': string; 'aria-labelledby'?: never }
      | { 'aria-label'?: never; 'aria-labelledby': string }
    )
>;

type LinkRender = BaseNavigationMenu.Link.Props['render'];

/**
 * A link needs a destination: pass href, or a `render` element such as a router
 * link that provides it. `active` marks the current page (aria-current="page").
 */
export type NavigationMenuLinkProps = WithLismProps<
  Omit<
    BaseNavigationMenu.Link.Props,
    'className' | 'ref' | 'href' | 'render' | 'aria-current'
  > & {
    className?: string;
    'aria-current'?: never;
  } & (
      | { href: string; render?: LinkRender }
      | { href?: string; render: LinkRender }
    )
>;

const rootTarget = {
  name: 'NavigationMenu.Root',
  fix: 'Provide aria-label or an aria-labelledby that references visible text.',
};

const triggerTarget = {
  name: 'NavigationMenu.Trigger',
  fix: 'Provide visible text, aria-label, or a valid aria-labelledby.',
  nameFromContent: true,
};

const linkTarget = {
  name: 'NavigationMenu.Link',
  fix: 'Provide visible text, aria-label, or a valid aria-labelledby.',
  nameFromContent: true,
};

const Root = withLism(
  forwardRef<HTMLElement, NavigationMenuRootProps>(function NavigationMenuRoot(
    { className, ...props },
    ref,
  ) {
    const accessibilityRef = useAccessibilityRef(rootTarget, ref);
    return (
      <BaseNavigationMenu.Root
        {...props}
        ref={accessibilityRef}
        className={withClassName('ui-navigation-menu', className)}
      />
    );
  }),
);

/** Decorative open-state icon; empty by default so CSS draws a chevron. */
const Icon = withLism(
  forwardRef<
    HTMLSpanElement,
    WithLismProps<
      Omit<BaseNavigationMenu.Icon.Props, 'className' | 'ref'> & {
        className?: string;
      }
    >
  >(function NavigationMenuIcon({ className, children, ...props }, ref) {
    return (
      <BaseNavigationMenu.Icon
        {...props}
        ref={ref}
        className={withClassName('ui-navigation-menu__icon', className)}
      >
        {children ?? null}
      </BaseNavigationMenu.Icon>
    );
  }),
);

const Link = namedPart(
  BaseNavigationMenu.Link,
  'ui-navigation-menu__link',
  linkTarget,
) as unknown as ForwardRefExoticComponent<
  NavigationMenuLinkProps & RefAttributes<HTMLAnchorElement>
>;

/**
 * Site navigation built on Base UI NavigationMenu: a named nav landmark with a
 * list of links and triggers that open panels of more links. It is a
 * disclosure-style navigation, not an application menu bar: Tab visits each
 * link and trigger and panel links are ordinary links.
 */
export const NavigationMenu = {
  Root,
  List: classedPart(
    BaseNavigationMenu.List,
    'ui-navigation-menu__list',
    'NavigationMenu.List',
  ),
  Item: classedPart(
    BaseNavigationMenu.Item,
    'ui-navigation-menu__item',
    'NavigationMenu.Item',
  ),
  Trigger: namedPart(
    BaseNavigationMenu.Trigger,
    'ui-navigation-menu__trigger',
    triggerTarget,
  ),
  Icon,
  Content: classedPart(
    BaseNavigationMenu.Content,
    'ui-navigation-menu__content',
    'NavigationMenu.Content',
  ),
  Link,
  Portal: BaseNavigationMenu.Portal,
  Positioner: classedPart(
    BaseNavigationMenu.Positioner,
    'ui-navigation-menu__positioner',
    'NavigationMenu.Positioner',
  ),
  Popup: classedPart(
    BaseNavigationMenu.Popup,
    'ui-navigation-menu__popup',
    'NavigationMenu.Popup',
  ),
  Viewport: classedPart(
    BaseNavigationMenu.Viewport,
    'ui-navigation-menu__viewport',
    'NavigationMenu.Viewport',
  ),
};
