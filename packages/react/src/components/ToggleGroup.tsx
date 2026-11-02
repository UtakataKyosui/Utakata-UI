'use client';

import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group';
import { forwardRef } from 'react';
import type { ToggleGroupOrientation } from '../metadata/components/ToggleGroup.js';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';
import { Toggle, type ToggleProps } from './Toggle.js';

/**
 * Base UI ToggleGroup props. The group must be named by aria-label or
 * aria-labelledby. `multiple` follows Base UI; values are always arrays.
 */
export type ToggleGroupRootProps = Omit<
  BaseToggleGroup.Props<string>,
  'className' | 'ref' | 'orientation' | 'aria-label' | 'aria-labelledby'
> & {
  className?: string;
  orientation?: ToggleGroupOrientation;
} & (
    | { 'aria-label': string; 'aria-labelledby'?: never }
    | { 'aria-label'?: never; 'aria-labelledby': string }
  );

// Distributes over the ToggleProps union to keep the iconOnly name requirement.
type GroupedToggleProps<P> = P extends unknown
  ? Omit<P, 'value' | 'pressed' | 'defaultPressed' | 'onPressedChange'> & {
      value: string;
    }
  : never;

/**
 * Toggle appearance props plus the required group value. Pressed state is
 * owned by ToggleGroup.Root, so the per-toggle pressed props are omitted.
 */
export type ToggleGroupItemProps = GroupedToggleProps<ToggleProps>;

const groupTarget = {
  name: 'ToggleGroup.Root',
  fix: 'Provide aria-label or an aria-labelledby that references visible text.',
};

const Root = forwardRef<HTMLDivElement, ToggleGroupRootProps>(
  function ToggleGroupRoot(
    { className, orientation = 'horizontal', ...props },
    ref,
  ) {
    const accessibilityRef = useAccessibilityRef(groupTarget, ref);
    return (
      <BaseToggleGroup
        {...props}
        ref={accessibilityRef}
        orientation={orientation}
        className={withClassName(
          `ui-toggle-group ui-toggle-group--${orientation}`,
          className,
        )}
      />
    );
  },
);

/** A Toggle inside the group; it keeps Toggle names, sizes and variants. */
const Item = forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  function ToggleGroupItem(props, ref) {
    return (
      <Toggle
        {...props}
        ref={ref}
        className={withClassName('ui-toggle-group__item', props.className)}
      />
    );
  },
);

export const ToggleGroup = { Root, Item };
