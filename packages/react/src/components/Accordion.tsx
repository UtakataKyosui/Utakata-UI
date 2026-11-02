'use client';

import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { forwardRef } from 'react';
import type { AccordionHeadingLevel } from '../metadata/components/Accordion.js';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';

type PartProps<P> = Omit<P, 'className' | 'ref'> & { className?: string };

export type AccordionRootProps = PartProps<BaseAccordion.Root.Props>;
export type AccordionItemProps = PartProps<BaseAccordion.Item.Props>;
export type AccordionHeaderProps = PartProps<BaseAccordion.Header.Props> & {
  /** Heading level matching the surrounding document outline. */
  level?: AccordionHeadingLevel;
};
export type AccordionTriggerProps = PartProps<BaseAccordion.Trigger.Props>;
export type AccordionPanelProps = PartProps<BaseAccordion.Panel.Props>;

const triggerTarget = {
  name: 'Accordion.Trigger',
  fix: 'Provide visible text, aria-label, or a valid aria-labelledby.',
  nameFromContent: true,
};

const Root = forwardRef<HTMLDivElement, AccordionRootProps>(
  function AccordionRoot({ className, ...props }, ref) {
    return (
      <BaseAccordion.Root
        {...props}
        ref={ref}
        className={withClassName('ui-accordion', className)}
      />
    );
  },
);

const Item = forwardRef<HTMLDivElement, AccordionItemProps>(
  function AccordionItem({ className, ...props }, ref) {
    return (
      <BaseAccordion.Item
        {...props}
        ref={ref}
        className={withClassName('ui-accordion__item', className)}
      />
    );
  },
);

const Header = forwardRef<HTMLHeadingElement, AccordionHeaderProps>(
  function AccordionHeader({ className, level = 3, render, ...props }, ref) {
    const Heading = `h${level}` as const;
    return (
      <BaseAccordion.Header
        {...props}
        ref={ref}
        render={render ?? <Heading />}
        className={withClassName('ui-accordion__header', className)}
      />
    );
  },
);

const Trigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  function AccordionTrigger({ className, ...props }, ref) {
    const accessibilityRef = useAccessibilityRef(triggerTarget, ref);
    return (
      <BaseAccordion.Trigger
        {...props}
        ref={accessibilityRef}
        className={withClassName('ui-accordion__trigger', className)}
      />
    );
  },
);

/** Closed panels are unmounted unless keepMounted, which hides them instead. */
const Panel = forwardRef<HTMLDivElement, AccordionPanelProps>(
  function AccordionPanel({ className, ...props }, ref) {
    return (
      <BaseAccordion.Panel
        {...props}
        ref={ref}
        className={withClassName('ui-accordion__panel', className)}
      />
    );
  },
);

export const Accordion = { Root, Item, Header, Trigger, Panel };
