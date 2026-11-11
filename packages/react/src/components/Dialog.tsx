'use client';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import {
  type ComponentPropsWithoutRef,
  type ElementType,
  forwardRef,
} from 'react';
import { useAccessibilityRef } from './accessibility.js';
import { type WithLismProps, withLism } from './lism.js';

type DialogPartProps<T extends ElementType> = WithLismProps<
  ComponentPropsWithoutRef<T> & {
    className?: string;
  }
>;

function withClassName(className: string, extraClassName?: string) {
  return [className, extraClassName].filter(Boolean).join(' ');
}

const Backdrop = withLism(
  forwardRef<HTMLDivElement, DialogPartProps<typeof BaseDialog.Backdrop>>(
    function DialogBackdrop({ className, ...props }, ref) {
      return (
        <BaseDialog.Backdrop
          {...props}
          ref={ref}
          className={withClassName('ui-dialog__backdrop', className)}
        />
      );
    },
  ),
);

const Popup = withLism(
  forwardRef<HTMLDivElement, DialogPartProps<typeof BaseDialog.Popup>>(
    function DialogPopup({ className, ...props }, ref) {
      const accessibilityRef = useAccessibilityRef('Dialog.Popup', ref);
      return (
        <BaseDialog.Popup
          {...props}
          ref={accessibilityRef}
          className={withClassName('ui-dialog__popup', className)}
        />
      );
    },
  ),
);

const Title = withLism(
  forwardRef<HTMLHeadingElement, DialogPartProps<typeof BaseDialog.Title>>(
    function DialogTitle({ className, ...props }, ref) {
      return (
        <BaseDialog.Title
          {...props}
          ref={ref}
          className={withClassName('ui-dialog__title', className)}
        />
      );
    },
  ),
);

const Description = withLism(
  forwardRef<
    HTMLParagraphElement,
    DialogPartProps<typeof BaseDialog.Description>
  >(function DialogDescription({ className, ...props }, ref) {
    return (
      <BaseDialog.Description
        {...props}
        ref={ref}
        className={withClassName('ui-dialog__description', className)}
      />
    );
  }),
);

export const Dialog = {
  Root: BaseDialog.Root,
  Trigger: withLism(BaseDialog.Trigger),
  Portal: BaseDialog.Portal,
  Backdrop,
  Popup,
  Title,
  Description,
  Close: withLism(BaseDialog.Close),
};
