'use client';

import { Menu as BaseMenu } from '@base-ui/react/menu';
import { classedPart, namedPart } from './parts.js';

const triggerTarget = {
  name: 'DropdownMenu.Trigger',
  fix: 'Provide visible text, aria-label, or a valid aria-labelledby.',
  nameFromContent: true,
};

/**
 * An action menu built on Base UI Menu. Base UI provides the menu/menuitem
 * roles, roving focus, typeahead, Escape/outside dismissal and focus return.
 */
export const DropdownMenu = {
  Root: BaseMenu.Root,
  Trigger: namedPart(
    BaseMenu.Trigger,
    'ui-dropdown-menu__trigger',
    triggerTarget,
  ),
  Portal: BaseMenu.Portal,
  Positioner: classedPart(
    BaseMenu.Positioner,
    'ui-dropdown-menu__positioner',
    'DropdownMenu.Positioner',
  ),
  Popup: classedPart(
    BaseMenu.Popup,
    'ui-dropdown-menu__popup',
    'DropdownMenu.Popup',
  ),
  Item: classedPart(
    BaseMenu.Item,
    'ui-dropdown-menu__item',
    'DropdownMenu.Item',
  ),
  Group: classedPart(
    BaseMenu.Group,
    'ui-dropdown-menu__group',
    'DropdownMenu.Group',
  ),
  GroupLabel: classedPart(
    BaseMenu.GroupLabel,
    'ui-dropdown-menu__group-label',
    'DropdownMenu.GroupLabel',
  ),
  Separator: classedPart(
    BaseMenu.Separator,
    'ui-dropdown-menu__separator',
    'DropdownMenu.Separator',
  ),
};
