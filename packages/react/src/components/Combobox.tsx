'use client';

import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import {
  type ComponentPropsWithoutRef,
  type ElementType,
  forwardRef,
  type ReactNode,
} from 'react';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';
import { type WithLismProps, withLism } from './lism.js';

type ComboboxPartProps<T extends ElementType> = WithLismProps<
  ComponentPropsWithoutRef<T> & {
    className?: string;
  }
>;

/**
 * Single selection with the input outside the popup. Multiple selection,
 * chips, inline lists, grids and virtualization are not provided.
 */
export type ComboboxRootProps<Value, Item = Value> = Omit<
  BaseCombobox.Root.Props<Value, false, Item>,
  'multiple' | 'inline' | 'grid' | 'virtualized'
>;

/** Input needs a name from Field.Label, a label element, aria-label or aria-labelledby. */
export type ComboboxInputProps = WithLismProps<
  ComboboxPartProps<typeof BaseCombobox.Input>
>;

/** Icon buttons need visible text or an explicit name; an empty button is a type error. */
export type ComboboxButtonAccessibilityProps =
  | { children: ReactNode }
  | { 'aria-label': string }
  | { 'aria-labelledby': string };

export type ComboboxTriggerProps = WithLismProps<
  ComboboxPartProps<typeof BaseCombobox.Trigger> &
    ComboboxButtonAccessibilityProps
>;

export type ComboboxClearProps = WithLismProps<
  ComboboxPartProps<typeof BaseCombobox.Clear> &
    ComboboxButtonAccessibilityProps
>;

const inputTarget = {
  name: 'Combobox.Input',
  fix: 'Place it in Field.Root with a Field.Label, or provide a label element, aria-label or aria-labelledby. A placeholder is not a name.',
};
const triggerTarget = {
  name: 'Combobox.Trigger',
  fix: 'Provide aria-label (for example "Show options") or a valid aria-labelledby.',
  nameFromContent: true,
};
const clearTarget = {
  name: 'Combobox.Clear',
  fix: 'Provide aria-label (for example "Clear") or a valid aria-labelledby.',
  nameFromContent: true,
};

function Root<Value, Item = Value>(props: ComboboxRootProps<Value, Item>) {
  return <BaseCombobox.Root {...props} />;
}

const InputGroup = withLism(
  forwardRef<HTMLDivElement, ComboboxPartProps<typeof BaseCombobox.InputGroup>>(
    function ComboboxInputGroup({ className, ...props }, ref) {
      return (
        <BaseCombobox.InputGroup
          {...props}
          ref={ref}
          className={withClassName('ui-combobox__input-group', className)}
        />
      );
    },
  ),
);

const Input = withLism(
  forwardRef<HTMLInputElement, ComboboxInputProps>(function ComboboxInput(
    { className, ...props },
    ref,
  ) {
    const accessibilityRef = useAccessibilityRef(inputTarget, ref);
    return (
      <BaseCombobox.Input
        {...props}
        ref={accessibilityRef}
        className={withClassName('ui-combobox__input', className)}
      />
    );
  }),
);

const Trigger = withLism(
  forwardRef<HTMLButtonElement, ComboboxTriggerProps>(function ComboboxTrigger(
    { className, ...props },
    ref,
  ) {
    const accessibilityRef = useAccessibilityRef(triggerTarget, ref);
    return (
      <BaseCombobox.Trigger
        {...props}
        // Base UI would otherwise label the button with Field.Label and ignore aria-label.
        aria-labelledby={props['aria-labelledby']}
        ref={accessibilityRef}
        className={withClassName('ui-combobox__trigger', className)}
      />
    );
  }),
);

const Clear = withLism(
  forwardRef<HTMLButtonElement, ComboboxClearProps>(function ComboboxClear(
    { className, children = null, ...props },
    ref,
  ) {
    const accessibilityRef = useAccessibilityRef(clearTarget, ref);
    // Without children, CSS draws the clear mark instead of Base UI's "x" text,
    // so the visible glyph is not text that differs from the accessible name.
    return (
      <BaseCombobox.Clear
        {...props}
        // Base UI would otherwise label the button with Field.Label and ignore aria-label.
        aria-labelledby={props['aria-labelledby']}
        ref={accessibilityRef}
        className={withClassName('ui-combobox__clear', className)}
      >
        {children}
      </BaseCombobox.Clear>
    );
  }),
);

const Positioner = withLism(
  forwardRef<HTMLDivElement, ComboboxPartProps<typeof BaseCombobox.Positioner>>(
    function ComboboxPositioner({ className, ...props }, ref) {
      return (
        <BaseCombobox.Positioner
          {...props}
          ref={ref}
          className={withClassName('ui-combobox__positioner', className)}
        />
      );
    },
  ),
);

const Popup = withLism(
  forwardRef<HTMLDivElement, ComboboxPartProps<typeof BaseCombobox.Popup>>(
    function ComboboxPopup({ className, ...props }, ref) {
      return (
        <BaseCombobox.Popup
          {...props}
          ref={ref}
          className={withClassName('ui-combobox__popup', className)}
        />
      );
    },
  ),
);

const List = withLism(
  forwardRef<HTMLDivElement, ComboboxPartProps<typeof BaseCombobox.List>>(
    function ComboboxList({ className, ...props }, ref) {
      return (
        <BaseCombobox.List
          {...props}
          ref={ref}
          className={withClassName('ui-combobox__list', className)}
        />
      );
    },
  ),
);

/** Always mounted live region; it shows its children only while no item matches. */
const Empty = withLism(
  forwardRef<HTMLDivElement, ComboboxPartProps<typeof BaseCombobox.Empty>>(
    function ComboboxEmpty({ className, ...props }, ref) {
      return (
        <BaseCombobox.Empty
          {...props}
          ref={ref}
          className={withClassName('ui-combobox__empty', className)}
        />
      );
    },
  ),
);

const Item = withLism(
  forwardRef<HTMLDivElement, ComboboxPartProps<typeof BaseCombobox.Item>>(
    function ComboboxItem({ className, ...props }, ref) {
      return (
        <BaseCombobox.Item
          {...props}
          ref={ref}
          className={withClassName('ui-combobox__item', className)}
        />
      );
    },
  ),
);

const ItemIndicator = withLism(
  forwardRef<
    HTMLSpanElement,
    ComboboxPartProps<typeof BaseCombobox.ItemIndicator>
  >(function ComboboxItemIndicator(
    { className, children = null, ...props },
    ref,
  ) {
    // Without children, CSS draws the check mark instead of Base UI's emoji glyph.
    return (
      <BaseCombobox.ItemIndicator
        {...props}
        ref={ref}
        className={withClassName('ui-combobox__item-indicator', className)}
      >
        {children}
      </BaseCombobox.ItemIndicator>
    );
  }),
);

const Group = withLism(
  forwardRef<HTMLDivElement, ComboboxPartProps<typeof BaseCombobox.Group>>(
    function ComboboxGroup({ className, ...props }, ref) {
      return (
        <BaseCombobox.Group
          {...props}
          ref={ref}
          className={withClassName('ui-combobox__group', className)}
        />
      );
    },
  ),
);

const GroupLabel = withLism(
  forwardRef<HTMLDivElement, ComboboxPartProps<typeof BaseCombobox.GroupLabel>>(
    function ComboboxGroupLabel({ className, ...props }, ref) {
      return (
        <BaseCombobox.GroupLabel
          {...props}
          ref={ref}
          className={withClassName('ui-combobox__group-label', className)}
        />
      );
    },
  ),
);

export const Combobox = {
  Root,
  InputGroup,
  Input,
  Trigger,
  Clear,
  Portal: BaseCombobox.Portal,
  Positioner,
  Popup,
  List,
  Empty,
  Item,
  ItemIndicator,
  Group,
  GroupLabel,
  Collection: BaseCombobox.Collection,
};
