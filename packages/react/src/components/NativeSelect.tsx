'use client';

import { Field as BaseField } from '@base-ui/react/field';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import type { NativeSelectSize } from '../metadata/components/NativeSelect.js';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';

/**
 * Native single-value select props. The visual `size` replaces the native
 * listbox `size` attribute; `multiple` is not supported.
 */
export type NativeSelectProps = Omit<
  ComponentPropsWithoutRef<'select'>,
  'className' | 'size' | 'multiple'
> & {
  className?: string;
  size?: NativeSelectSize;
};

type FieldControlProps = ComponentPropsWithoutRef<typeof BaseField.Control>;

// Field.Control supplies id, name, value and ARIA props to the native element.
const renderNativeSelect: FieldControlProps['render'] = (props) => (
  <select {...props} />
);

const nativeSelectTarget = {
  name: 'NativeSelect',
  fix: 'Place it in Field.Root with a Field.Label, or provide a label element, aria-label or aria-labelledby.',
};

/**
 * A browser-native select. It renders Base UI Field.Control as a select so
 * Field labelling applies; className and ref target the select element.
 */
export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  function NativeSelect({ className, size = 'md', ...props }, ref) {
    const accessibilityRef = useAccessibilityRef(nativeSelectTarget, ref);
    return (
      <span className={`ui-native-select ui-native-select--${size}`}>
        <BaseField.Control
          // Native select props; Field.Control forwards them to the element.
          {...(props as FieldControlProps)}
          ref={accessibilityRef}
          render={renderNativeSelect}
          className={withClassName('ui-native-select__control', className)}
        />
        <span aria-hidden="true" className="ui-native-select__icon" />
      </span>
    );
  },
);
