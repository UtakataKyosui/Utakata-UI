'use client';

import { Select as BaseSelect } from '@base-ui/react/select';
import {
  type ComponentPropsWithoutRef,
  type ElementType,
  forwardRef,
} from 'react';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';

type SelectPartProps<T extends ElementType> = ComponentPropsWithoutRef<T> & {
  className?: string;
};

/** Single selection only; use several controls or a listbox for multiple values. */
export type SelectRootProps<Value> = Omit<
  BaseSelect.Root.Props<Value, false>,
  'multiple'
>;

const triggerTarget = {
  name: 'Select.Trigger',
  fix: 'Provide a Select.Label, a Field.Label, aria-label, or a valid aria-labelledby. The selected value is not a name.',
};

function Root<Value>(props: SelectRootProps<Value>) {
  return <BaseSelect.Root {...props} />;
}

const Label = forwardRef<
  HTMLDivElement,
  SelectPartProps<typeof BaseSelect.Label>
>(function SelectLabel({ className, ...props }, ref) {
  return (
    <BaseSelect.Label
      {...props}
      ref={ref}
      className={withClassName('ui-select__label', className)}
    />
  );
});

const Trigger = forwardRef<
  HTMLButtonElement,
  SelectPartProps<typeof BaseSelect.Trigger>
>(function SelectTrigger({ className, ...props }, ref) {
  const accessibilityRef = useAccessibilityRef(triggerTarget, ref);
  return (
    <BaseSelect.Trigger
      {...props}
      ref={accessibilityRef}
      className={withClassName('ui-select__trigger', className)}
    />
  );
});

const Value = forwardRef<
  HTMLSpanElement,
  SelectPartProps<typeof BaseSelect.Value>
>(function SelectValue({ className, ...props }, ref) {
  return (
    <BaseSelect.Value
      {...props}
      ref={ref}
      className={withClassName('ui-select__value', className)}
    />
  );
});

const Icon = forwardRef<
  HTMLSpanElement,
  SelectPartProps<typeof BaseSelect.Icon>
>(function SelectIcon({ className, children = null, ...props }, ref) {
  // Without children, CSS draws the chevron instead of Base UI's ▼ glyph so
  // the decorative icon is not exposed as text content.
  return (
    <BaseSelect.Icon
      {...props}
      ref={ref}
      className={withClassName('ui-select__icon', className)}
    >
      {children}
    </BaseSelect.Icon>
  );
});

const Positioner = forwardRef<
  HTMLDivElement,
  SelectPartProps<typeof BaseSelect.Positioner>
>(function SelectPositioner({ className, ...props }, ref) {
  return (
    <BaseSelect.Positioner
      {...props}
      ref={ref}
      className={withClassName('ui-select__positioner', className)}
    />
  );
});

const Popup = forwardRef<
  HTMLDivElement,
  SelectPartProps<typeof BaseSelect.Popup>
>(function SelectPopup({ className, ...props }, ref) {
  return (
    <BaseSelect.Popup
      {...props}
      ref={ref}
      className={withClassName('ui-select__popup', className)}
    />
  );
});

const List = forwardRef<
  HTMLDivElement,
  SelectPartProps<typeof BaseSelect.List>
>(function SelectList({ className, ...props }, ref) {
  return (
    <BaseSelect.List
      {...props}
      ref={ref}
      className={withClassName('ui-select__list', className)}
    />
  );
});

const Item = forwardRef<HTMLElement, SelectPartProps<typeof BaseSelect.Item>>(
  function SelectItem({ className, ...props }, ref) {
    return (
      <BaseSelect.Item
        {...props}
        ref={ref}
        className={withClassName('ui-select__item', className)}
      />
    );
  },
);

const ItemText = forwardRef<
  HTMLDivElement,
  SelectPartProps<typeof BaseSelect.ItemText>
>(function SelectItemText({ className, ...props }, ref) {
  return (
    <BaseSelect.ItemText
      {...props}
      ref={ref}
      className={withClassName('ui-select__item-text', className)}
    />
  );
});

const ItemIndicator = forwardRef<
  HTMLSpanElement,
  SelectPartProps<typeof BaseSelect.ItemIndicator>
>(function SelectItemIndicator({ className, ...props }, ref) {
  return (
    <BaseSelect.ItemIndicator
      {...props}
      ref={ref}
      className={withClassName('ui-select__item-indicator', className)}
    />
  );
});

const Group = forwardRef<
  HTMLDivElement,
  SelectPartProps<typeof BaseSelect.Group>
>(function SelectGroup({ className, ...props }, ref) {
  return (
    <BaseSelect.Group
      {...props}
      ref={ref}
      className={withClassName('ui-select__group', className)}
    />
  );
});

const GroupLabel = forwardRef<
  HTMLDivElement,
  SelectPartProps<typeof BaseSelect.GroupLabel>
>(function SelectGroupLabel({ className, ...props }, ref) {
  return (
    <BaseSelect.GroupLabel
      {...props}
      ref={ref}
      className={withClassName('ui-select__group-label', className)}
    />
  );
});

export const Select = {
  Root,
  Label,
  Trigger,
  Value,
  Icon,
  Portal: BaseSelect.Portal,
  Positioner,
  Popup,
  List,
  Item,
  ItemText,
  ItemIndicator,
  Group,
  GroupLabel,
};
