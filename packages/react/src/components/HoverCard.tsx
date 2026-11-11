'use client';

import { PreviewCard as BasePreviewCard } from '@base-ui/react/preview-card';
import {
  type ForwardRefExoticComponent,
  forwardRef,
  type RefAttributes,
} from 'react';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';
import { withLism } from './lism.js';
import { classedPart, type FloatingPartProps } from './parts.js';

const triggerTarget = {
  name: 'HoverCard.Trigger',
  fix: 'Provide visible link text, aria-label, or a valid aria-labelledby.',
  nameFromContent: true,
};

/**
 * HoverCard.Trigger props. The trigger is a link, so `href` is required: touch
 * and screen-reader users never see the card and follow the link instead.
 */
export type HoverCardTriggerProps = FloatingPartProps<
  typeof BasePreviewCard.Trigger
> & { href: string };

const Trigger = withLism(
  forwardRef<HTMLElement, HoverCardTriggerProps>(function HoverCardTrigger(
    { className, ...props },
    ref,
  ) {
    return (
      <BasePreviewCard.Trigger
        {...props}
        ref={useAccessibilityRef(triggerTarget, ref)}
        className={withClassName('ui-hover-card__trigger', className)}
      />
    );
  }),
) as unknown as ForwardRefExoticComponent<
  HoverCardTriggerProps & RefAttributes<HTMLElement>
>;

/** HoverCard.Root props. The card is supplementary and never the only path to information. */
export type HoverCardRootProps = BasePreviewCard.Root.Props;

/**
 * A supplementary preview of a link target, built on Base UI PreviewCard. It
 * opens on pointer hover and keyboard focus of the Trigger link after a delay,
 * stays open while the pointer is on the Popup, and closes with Escape. Touch
 * and assistive-technology users follow the link, so nothing essential may
 * appear only in the card. The Popup is not focus-managed and is not announced.
 */
export const HoverCard = {
  Root: BasePreviewCard.Root,
  /** `delay` defaults to 600ms and `closeDelay` to 300ms. */
  Trigger,
  Portal: BasePreviewCard.Portal,
  Positioner: classedPart(
    BasePreviewCard.Positioner,
    'ui-hover-card__positioner',
    'HoverCard.Positioner',
  ),
  Popup: classedPart(
    BasePreviewCard.Popup,
    'ui-hover-card__popup',
    'HoverCard.Popup',
  ),
  Arrow: classedPart(
    BasePreviewCard.Arrow,
    'ui-hover-card__arrow',
    'HoverCard.Arrow',
  ),
};
