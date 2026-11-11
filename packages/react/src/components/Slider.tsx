'use client';

import { Slider as BaseSlider } from '@base-ui/react/slider';
import {
  type ComponentPropsWithoutRef,
  type ElementType,
  forwardRef,
} from 'react';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';
import { type WithLismProps, withLism } from './lism.js';

type SliderPartProps<T extends ElementType> = WithLismProps<
  ComponentPropsWithoutRef<T> & {
    className?: string;
  }
>;

// The accessible name and value text live on Base UI's hidden range input.
const thumbTarget = {
  name: 'Slider.Thumb',
  fix: 'Provide a Slider.Label, a Field.Label, aria-label, getAriaLabel or a valid aria-labelledby.',
};

const Root = withLism(
  forwardRef<HTMLDivElement, SliderPartProps<typeof BaseSlider.Root>>(
    function SliderRoot({ className, ...props }, ref) {
      return (
        <BaseSlider.Root
          {...props}
          ref={ref}
          className={withClassName('ui-slider', className)}
        />
      );
    },
  ),
);

const Label = withLism(
  forwardRef<HTMLDivElement, SliderPartProps<typeof BaseSlider.Label>>(
    function SliderLabel({ className, ...props }, ref) {
      return (
        <BaseSlider.Label
          {...props}
          ref={ref}
          className={withClassName('ui-slider__label', className)}
        />
      );
    },
  ),
);

const Value = withLism(
  forwardRef<HTMLOutputElement, SliderPartProps<typeof BaseSlider.Value>>(
    function SliderValue({ className, ...props }, ref) {
      return (
        <BaseSlider.Value
          {...props}
          ref={ref}
          className={withClassName('ui-slider__value', className)}
        />
      );
    },
  ),
);

const Control = withLism(
  forwardRef<HTMLDivElement, SliderPartProps<typeof BaseSlider.Control>>(
    function SliderControl({ className, ...props }, ref) {
      return (
        <BaseSlider.Control
          {...props}
          ref={ref}
          className={withClassName('ui-slider__control', className)}
        />
      );
    },
  ),
);

const Track = withLism(
  forwardRef<HTMLDivElement, SliderPartProps<typeof BaseSlider.Track>>(
    function SliderTrack({ className, ...props }, ref) {
      return (
        <BaseSlider.Track
          {...props}
          ref={ref}
          className={withClassName('ui-slider__track', className)}
        />
      );
    },
  ),
);

const Indicator = withLism(
  forwardRef<HTMLDivElement, SliderPartProps<typeof BaseSlider.Indicator>>(
    function SliderIndicator({ className, ...props }, ref) {
      return (
        <BaseSlider.Indicator
          {...props}
          ref={ref}
          className={withClassName('ui-slider__indicator', className)}
        />
      );
    },
  ),
);

const Thumb = withLism(
  forwardRef<HTMLDivElement, SliderPartProps<typeof BaseSlider.Thumb>>(
    function SliderThumb({ className, inputRef = null, ...props }, ref) {
      const accessibilityInputRef = useAccessibilityRef(thumbTarget, inputRef);
      return (
        <BaseSlider.Thumb
          {...props}
          ref={ref}
          inputRef={accessibilityInputRef}
          className={withClassName('ui-slider__thumb', className)}
        />
      );
    },
  ),
);

export const Slider = {
  Root,
  Label,
  Value,
  Control,
  Track,
  Indicator,
  Thumb,
};
