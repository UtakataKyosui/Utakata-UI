'use client';

import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import { forwardRef } from 'react';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';

type PartProps<P> = Omit<P, 'className' | 'ref'> & { className?: string };

export type CollapsibleRootProps = PartProps<BaseCollapsible.Root.Props>;
export type CollapsibleTriggerProps = PartProps<BaseCollapsible.Trigger.Props>;
export type CollapsiblePanelProps = PartProps<BaseCollapsible.Panel.Props>;

const triggerTarget = {
  name: 'Collapsible.Trigger',
  fix: 'Provide visible text, aria-label, or a valid aria-labelledby.',
  nameFromContent: true,
};

const Root = forwardRef<HTMLDivElement, CollapsibleRootProps>(
  function CollapsibleRoot({ className, ...props }, ref) {
    return (
      <BaseCollapsible.Root
        {...props}
        ref={ref}
        className={withClassName('ui-collapsible', className)}
      />
    );
  },
);

const Trigger = forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  function CollapsibleTrigger({ className, ...props }, ref) {
    const accessibilityRef = useAccessibilityRef(triggerTarget, ref);
    return (
      <BaseCollapsible.Trigger
        {...props}
        ref={accessibilityRef}
        className={withClassName('ui-collapsible__trigger', className)}
      />
    );
  },
);

/** Closed panels are unmounted unless keepMounted, which hides them instead. */
const Panel = forwardRef<HTMLDivElement, CollapsiblePanelProps>(
  function CollapsiblePanel({ className, ...props }, ref) {
    return (
      <BaseCollapsible.Panel
        {...props}
        ref={ref}
        className={withClassName('ui-collapsible__panel', className)}
      />
    );
  },
);

export const Collapsible = { Root, Trigger, Panel };
