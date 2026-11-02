'use client';

import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';
import { classedPart, type FloatingPartProps } from './parts.js';

/**
 * Tooltip.Root props. `disableHoverablePopup` is omitted so the popup stays
 * open while the pointer moves onto it (WCAG 1.4.13).
 */
export type TooltipRootProps = Omit<
  BaseTooltip.Root.Props,
  'disableHoverablePopup'
>;

/** Tooltips contain short plain text only; interactive content belongs in Popover. */
export type TooltipText = string | number | readonly (string | number)[];

export type TooltipPopupProps = Omit<
  FloatingPartProps<typeof BaseTooltip.Popup>,
  'children' | 'role'
> & {
  children: TooltipText;
};

interface Description {
  id: string;
  popupId: string | undefined;
  setPopupId: (id: string | undefined) => void;
}

// Base UI does not describe the trigger, so the mounted popup registers its id.
const DescriptionContext = createContext<Description | null>(null);

function Root(props: TooltipRootProps) {
  const id = useId();
  const [popupId, setPopupId] = useState<string>();
  const value = useMemo(() => ({ id, popupId, setPopupId }), [id, popupId]);
  return (
    <DescriptionContext.Provider value={value}>
      <BaseTooltip.Root {...props} />
    </DescriptionContext.Provider>
  );
}

const triggerTarget = {
  name: 'Tooltip.Trigger',
  fix: 'Provide visible text, aria-label, or a valid aria-labelledby; the tooltip is a description, not the name.',
  nameFromContent: true,
};

const Trigger = forwardRef<
  HTMLElement,
  FloatingPartProps<typeof BaseTooltip.Trigger>
>(function TooltipTrigger(
  { className, 'aria-describedby': describedBy, ...props },
  ref,
) {
  const accessibilityRef = useAccessibilityRef(triggerTarget, ref);
  const popupId = useContext(DescriptionContext)?.popupId;
  return (
    <BaseTooltip.Trigger
      {...props}
      ref={accessibilityRef}
      aria-describedby={
        [describedBy, popupId].filter(Boolean).join(' ') || undefined
      }
      className={withClassName('ui-tooltip__trigger', className)}
    />
  );
});

const Popup = forwardRef<HTMLDivElement, TooltipPopupProps>(
  function TooltipPopup({ className, id, ...props }, ref) {
    const context = useContext(DescriptionContext);
    const popupId = id ?? context?.id;
    const setPopupId = context?.setPopupId;
    useEffect(() => {
      setPopupId?.(popupId);
      return () => setPopupId?.(undefined);
    }, [popupId, setPopupId]);
    return (
      <BaseTooltip.Popup
        {...props}
        id={popupId}
        ref={ref}
        role="tooltip"
        className={withClassName('ui-tooltip__popup', className)}
      />
    );
  },
);

export const Tooltip = {
  /** Shares delays between tooltips. Hover delay defaults to 600ms. */
  Provider: BaseTooltip.Provider,
  Root,
  Trigger,
  Portal: BaseTooltip.Portal,
  Positioner: classedPart(
    BaseTooltip.Positioner,
    'ui-tooltip__positioner',
    'Tooltip.Positioner',
  ),
  Popup,
  Arrow: classedPart(BaseTooltip.Arrow, 'ui-tooltip__arrow', 'Tooltip.Arrow'),
};
