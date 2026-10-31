import { Field as BaseField } from '@base-ui/react/field';
import {
  type ComponentPropsWithoutRef,
  type ElementType,
  forwardRef,
} from 'react';

type FieldPartProps<T extends ElementType> = ComponentPropsWithoutRef<T> & {
  className?: string;
};

function withClassName(className: string, extraClassName?: string) {
  return [className, extraClassName].filter(Boolean).join(' ');
}

const Root = forwardRef<HTMLDivElement, FieldPartProps<typeof BaseField.Root>>(
  function FieldRoot({ className, ...props }, ref) {
    return (
      <BaseField.Root
        {...props}
        ref={ref}
        className={withClassName('ui-field', className)}
      />
    );
  },
);

const Label = forwardRef<HTMLElement, FieldPartProps<typeof BaseField.Label>>(
  function FieldLabel({ className, ...props }, ref) {
    return (
      <BaseField.Label
        {...props}
        ref={ref}
        className={withClassName('ui-field__label', className)}
      />
    );
  },
);

const Control = forwardRef<
  HTMLElement,
  FieldPartProps<typeof BaseField.Control>
>(function FieldControl({ className, ...props }, ref) {
  return (
    <BaseField.Control
      {...props}
      ref={ref}
      className={withClassName('ui-field__control', className)}
    />
  );
});

const Description = forwardRef<
  HTMLParagraphElement,
  FieldPartProps<typeof BaseField.Description>
>(function FieldDescription({ className, ...props }, ref) {
  return (
    <BaseField.Description
      {...props}
      ref={ref}
      className={withClassName('ui-field__description', className)}
    />
  );
});

const FieldError = forwardRef<
  HTMLDivElement,
  FieldPartProps<typeof BaseField.Error>
>(function FieldError({ className, ...props }, ref) {
  return (
    <BaseField.Error
      {...props}
      ref={ref}
      className={withClassName('ui-field__error', className)}
    />
  );
});

export const Field = { Root, Label, Control, Description, Error: FieldError };
