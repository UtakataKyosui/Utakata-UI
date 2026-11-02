'use client';

import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { forwardRef } from 'react';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';

type PartProps<P> = Omit<P, 'className' | 'ref'> & { className?: string };
type TabValue = BaseTabs.Tab.Value;

/** The initially selected tab must be explicit: pass value or defaultValue. */
export type TabsRootProps = Omit<
  PartProps<BaseTabs.Root.Props>,
  'value' | 'defaultValue'
> &
  (
    | { value: TabValue; defaultValue?: never }
    | { defaultValue: TabValue; value?: never }
  );
/** Name the list with aria-label or aria-labelledby when the context is not obvious. */
export type TabsListProps = PartProps<BaseTabs.List.Props>;
export type TabsTabProps = PartProps<BaseTabs.Tab.Props>;
export type TabsPanelProps = PartProps<BaseTabs.Panel.Props>;
export type TabsIndicatorProps = PartProps<BaseTabs.Indicator.Props>;

const tabTarget = {
  name: 'Tabs.Tab',
  fix: 'Provide visible text, aria-label, or a valid aria-labelledby.',
  nameFromContent: true,
};

const Root = forwardRef<HTMLDivElement, TabsRootProps>(function TabsRoot(
  { className, ...props },
  ref,
) {
  return (
    <BaseTabs.Root
      {...props}
      ref={ref}
      className={withClassName('ui-tabs', className)}
    />
  );
});

const List = forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
  { className, ...props },
  ref,
) {
  return (
    <BaseTabs.List
      {...props}
      ref={ref}
      className={withClassName('ui-tabs__list', className)}
    />
  );
});

const Tab = forwardRef<HTMLElement, TabsTabProps>(function TabsTab(
  { className, ...props },
  ref,
) {
  const accessibilityRef = useAccessibilityRef(tabTarget, ref);
  return (
    <BaseTabs.Tab
      {...props}
      ref={accessibilityRef}
      className={withClassName('ui-tabs__tab', className)}
    />
  );
});

/** Inactive panels are unmounted unless keepMounted, which hides them instead. */
const Panel = forwardRef<HTMLDivElement, TabsPanelProps>(function TabsPanel(
  { className, ...props },
  ref,
) {
  return (
    <BaseTabs.Panel
      {...props}
      ref={ref}
      className={withClassName('ui-tabs__panel', className)}
    />
  );
});

/** Optional animated marker; the selected Tab is styled without it. */
const Indicator = forwardRef<HTMLSpanElement, TabsIndicatorProps>(
  function TabsIndicator({ className, ...props }, ref) {
    return (
      <BaseTabs.Indicator
        {...props}
        ref={ref}
        className={withClassName('ui-tabs__indicator', className)}
      />
    );
  },
);

export const Tabs = { Root, List, Tab, Panel, Indicator };
