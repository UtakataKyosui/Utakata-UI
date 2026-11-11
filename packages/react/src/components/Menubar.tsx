'use client';

import { Menu as BaseMenu } from '@base-ui/react/menu';
import { Menubar as BaseMenubar } from '@base-ui/react/menubar';
import { forwardRef } from 'react';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';
import { DropdownMenu } from './DropdownMenu.js';
import { type WithLismProps, withLism } from './lism.js';
import { namedPart } from './parts.js';

/**
 * Base UI DirectionProvider, re-exported so right-to-left content can swap the
 * horizontal arrow keys without importing a transitive dependency.
 */
export { DirectionProvider } from '@base-ui/react/direction-provider';

/**
 * Base UI Menubar props. The menubar must be named by aria-label or
 * aria-labelledby (for example the visible heading of the region it controls).
 */
export type MenubarRootProps = WithLismProps<
  Omit<
    BaseMenubar.Props,
    'className' | 'ref' | 'aria-label' | 'aria-labelledby'
  > & {
    className?: string;
  } & (
      | { 'aria-label': string; 'aria-labelledby'?: never }
      | { 'aria-label'?: never; 'aria-labelledby': string }
    )
>;

const rootTarget = {
  name: 'Menubar.Root',
  fix: 'Provide aria-label or an aria-labelledby that references visible text.',
};

const triggerTarget = {
  name: 'Menubar.Trigger',
  fix: 'Provide visible text, aria-label, or a valid aria-labelledby.',
  nameFromContent: true,
};

const submenuTriggerTarget = {
  name: 'Menubar.SubmenuTrigger',
  fix: 'Provide visible text, aria-label, or a valid aria-labelledby.',
  nameFromContent: true,
};

const Root = withLism(
  forwardRef<HTMLDivElement, MenubarRootProps>(function MenubarRoot(
    { className, ...props },
    ref,
  ) {
    const accessibilityRef = useAccessibilityRef(rootTarget, ref);
    return (
      <BaseMenubar
        {...props}
        ref={accessibilityRef}
        className={withClassName('ui-menubar', className)}
      />
    );
  }),
);

/**
 * A bar of menus built on Base UI Menubar. Each Menu is a DropdownMenu-style
 * popup; the popup parts reuse DropdownMenu's markup and styles. Base UI
 * provides the menubar/menuitem roles, arrow-key roving between triggers,
 * submenu arrow keys, Escape and focus return.
 */
export const Menubar = {
  Root,
  Menu: BaseMenu.Root,
  Trigger: namedPart(BaseMenu.Trigger, 'ui-menubar__trigger', triggerTarget),
  Portal: DropdownMenu.Portal,
  Positioner: DropdownMenu.Positioner,
  Popup: DropdownMenu.Popup,
  Item: DropdownMenu.Item,
  Group: DropdownMenu.Group,
  GroupLabel: DropdownMenu.GroupLabel,
  Separator: DropdownMenu.Separator,
  SubmenuRoot: BaseMenu.SubmenuRoot,
  SubmenuTrigger: namedPart(
    BaseMenu.SubmenuTrigger,
    'ui-dropdown-menu__item ui-menubar__submenu-trigger',
    submenuTriggerTarget,
  ),
};
