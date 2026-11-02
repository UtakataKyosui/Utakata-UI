'use client';

import { Popover as BasePopover } from '@base-ui/react/popover';
import { classedPart, namedPart } from './parts.js';

const triggerTarget = {
  name: 'Popover.Trigger',
  fix: 'Provide visible text, aria-label, or a valid aria-labelledby.',
  nameFromContent: true,
};

const closeTarget = { ...triggerTarget, name: 'Popover.Close' };

const popupTarget = {
  name: 'Popover.Popup',
  fix: 'Provide a Popover.Title or another accessible label.',
};

export const Popover = {
  Root: BasePopover.Root,
  Trigger: namedPart(BasePopover.Trigger, 'ui-popover__trigger', triggerTarget),
  Portal: BasePopover.Portal,
  Positioner: classedPart(
    BasePopover.Positioner,
    'ui-popover__positioner',
    'Popover.Positioner',
  ),
  Popup: namedPart(BasePopover.Popup, 'ui-popover__popup', popupTarget),
  Arrow: classedPart(BasePopover.Arrow, 'ui-popover__arrow', 'Popover.Arrow'),
  Title: classedPart(BasePopover.Title, 'ui-popover__title', 'Popover.Title'),
  Description: classedPart(
    BasePopover.Description,
    'ui-popover__description',
    'Popover.Description',
  ),
  Close: namedPart(BasePopover.Close, 'ui-popover__close', closeTarget),
};
