'use client';

import { ContextMenu as BaseContextMenu } from '@base-ui/react/context-menu';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { DropdownMenu } from './DropdownMenu.js';
import { classedPart, type FloatingPartProps, namedPart } from './parts.js';

const popupTarget = {
  name: 'ContextMenu.Popup',
  fix: 'Provide aria-label or a valid aria-labelledby; there is no trigger button to name the menu.',
};

type NameSource =
  | { 'aria-label': string; 'aria-labelledby'?: string }
  | { 'aria-label'?: string; 'aria-labelledby': string };

/** Props of ContextMenu.Popup; the menu needs a name from the consumer. */
export type ContextMenuPopupProps = FloatingPartProps<
  typeof BaseContextMenu.Popup
> &
  NameSource;

const Popup = namedPart(
  BaseContextMenu.Popup,
  'ui-dropdown-menu__popup ui-context-menu__popup',
  popupTarget,
) as unknown as ForwardRefExoticComponent<
  ContextMenuPopupProps & RefAttributes<HTMLElement>
>;

/**
 * A pointer-opened menu built on Base UI ContextMenu. Right click, long press,
 * and the ContextMenu key / Shift+F10 on a focused element inside the Trigger
 * open it. Items, groups and separators are the DropdownMenu parts, so they
 * share its styling, roving focus, typeahead, dismissal and focus return.
 */
export const ContextMenu = {
  Root: BaseContextMenu.Root,
  Trigger: classedPart(
    BaseContextMenu.Trigger,
    'ui-context-menu__trigger',
    'ContextMenu.Trigger',
  ),
  Portal: BaseContextMenu.Portal,
  Positioner: classedPart(
    BaseContextMenu.Positioner,
    'ui-dropdown-menu__positioner ui-context-menu__positioner',
    'ContextMenu.Positioner',
  ),
  Popup,
  Item: DropdownMenu.Item,
  Group: DropdownMenu.Group,
  GroupLabel: DropdownMenu.GroupLabel,
  Separator: DropdownMenu.Separator,
};
