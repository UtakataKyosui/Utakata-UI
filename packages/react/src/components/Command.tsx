'use client';

import { Autocomplete as BaseAutocomplete } from '@base-ui/react/autocomplete';
import {
  type ComponentPropsWithoutRef,
  type ElementType,
  forwardRef,
  type HTMLAttributes,
} from 'react';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';

type CommandPartProps<T extends ElementType> = ComponentPropsWithoutRef<T> & {
  className?: string;
};

/**
 * A searchable list of commands that is always visible: the list is rendered
 * inline, so there is no popup, open state or form value. Run a command with
 * Command.Item onClick (pointer click and Enter on the highlighted item).
 */
export type CommandRootProps<Item> = Omit<
  BaseAutocomplete.Root.Props<Item>,
  | 'inline'
  | 'open'
  | 'defaultOpen'
  | 'onOpenChange'
  | 'name'
  | 'form'
  | 'required'
  | 'readOnly'
>;

/** Input needs a name from a label element, aria-label or aria-labelledby. */
export type CommandInputProps = CommandPartProps<typeof BaseAutocomplete.Input>;

const inputTarget = {
  name: 'Command.Input',
  fix: 'Provide a label element, aria-label or aria-labelledby (for example aria-label="Search commands"). A placeholder is not a name.',
};

function Root<Item>(props: CommandRootProps<Item>) {
  // Base UI overloads the generic Items/Item signatures; the omitted keys above
  // make the inline, always-open configuration the only one.
  const rootProps = props as ComponentPropsWithoutRef<
    typeof BaseAutocomplete.Root
  >;
  return <BaseAutocomplete.Root {...rootProps} inline open />;
}

/** Visual surface for the input and list; use it as the child of Dialog.Popup or on its own. */
const Panel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CommandPanel({ className, ...props }, ref) {
    return (
      <div
        {...props}
        ref={ref}
        className={withClassName('ui-command', className)}
      />
    );
  },
);

const Input = forwardRef<HTMLInputElement, CommandInputProps>(
  function CommandInput({ className, ...props }, ref) {
    const accessibilityRef = useAccessibilityRef(inputTarget, ref);
    return (
      <BaseAutocomplete.Input
        {...props}
        ref={accessibilityRef}
        className={withClassName('ui-command__input', className)}
      />
    );
  },
);

const List = forwardRef<
  HTMLDivElement,
  CommandPartProps<typeof BaseAutocomplete.List>
>(function CommandList({ className, ...props }, ref) {
  return (
    <BaseAutocomplete.List
      {...props}
      ref={ref}
      className={withClassName('ui-command__list', className)}
    />
  );
});

/** Always mounted live region; it shows its children only while no item matches. */
const Empty = forwardRef<
  HTMLDivElement,
  CommandPartProps<typeof BaseAutocomplete.Empty>
>(function CommandEmpty({ className, ...props }, ref) {
  return (
    <BaseAutocomplete.Empty
      {...props}
      ref={ref}
      className={withClassName('ui-command__empty', className)}
    />
  );
});

const Group = forwardRef<
  HTMLDivElement,
  CommandPartProps<typeof BaseAutocomplete.Group>
>(function CommandGroup({ className, ...props }, ref) {
  return (
    <BaseAutocomplete.Group
      {...props}
      ref={ref}
      className={withClassName('ui-command__group', className)}
    />
  );
});

const GroupLabel = forwardRef<
  HTMLDivElement,
  CommandPartProps<typeof BaseAutocomplete.GroupLabel>
>(function CommandGroupLabel({ className, ...props }, ref) {
  return (
    <BaseAutocomplete.GroupLabel
      {...props}
      ref={ref}
      className={withClassName('ui-command__group-label', className)}
    />
  );
});

const Item = forwardRef<
  HTMLDivElement,
  CommandPartProps<typeof BaseAutocomplete.Item>
>(function CommandItem({ className, ...props }, ref) {
  return (
    <BaseAutocomplete.Item
      {...props}
      ref={ref}
      className={withClassName('ui-command__item', className)}
    />
  );
});

const Separator = forwardRef<
  HTMLDivElement,
  CommandPartProps<typeof BaseAutocomplete.Separator>
>(function CommandSeparator({ className, ...props }, ref) {
  return (
    <BaseAutocomplete.Separator
      {...props}
      ref={ref}
      className={withClassName('ui-command__separator', className)}
    />
  );
});

/** Decorative hint such as a key combination; the command must not depend on it. */
const Shortcut = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  function CommandShortcut({ className, ...props }, ref) {
    return (
      <span
        {...props}
        ref={ref}
        className={withClassName('ui-command__shortcut', className)}
      />
    );
  },
);

export const Command = {
  Root,
  Panel,
  Input,
  List,
  Empty,
  Group,
  GroupLabel,
  Item,
  Separator,
  Shortcut,
  Collection: BaseAutocomplete.Collection,
};
