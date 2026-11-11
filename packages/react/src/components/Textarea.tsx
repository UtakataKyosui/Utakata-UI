'use client';

import { Field as BaseField } from '@base-ui/react/field';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import type { TextareaSize } from '../metadata/components/Textarea.js';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';
import { type WithLismProps, withLism } from './lism.js';

export type TextareaProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<'textarea'>, 'className'> & {
    className?: string;
    size?: TextareaSize;
  }
>;

type FieldControlProps = ComponentPropsWithoutRef<typeof BaseField.Control>;

// Field.Control supplies id, name, value and ARIA props to the native element.
const renderTextarea: FieldControlProps['render'] = (props) => (
  <textarea {...props} />
);

const textareaTarget = {
  name: 'Textarea',
  fix: 'Place it in Field.Root with a Field.Label, or provide a label element, aria-label or aria-labelledby.',
};

/**
 * A multi-line text input. It renders Base UI Field.Control as a native
 * textarea so Field labelling, descriptions and validation apply to it.
 */
export const Textarea = withLism(
  forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
    { className, size = 'md', rows = 3, ...props },
    ref,
  ) {
    const accessibilityRef = useAccessibilityRef(textareaTarget, ref);
    return (
      <BaseField.Control
        // Native textarea props; Field.Control forwards them to the element.
        {...({ ...props, rows } as FieldControlProps)}
        ref={accessibilityRef}
        render={renderTextarea}
        className={withClassName(`ui-textarea ui-textarea--${size}`, className)}
      />
    );
  }),
  ['rows', 'cols'],
);
