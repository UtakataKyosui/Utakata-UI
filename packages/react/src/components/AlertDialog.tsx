'use client';

import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';
import { Dialog } from './Dialog.js';
import { type WithLismProps, withLism } from './lism.js';

export type AlertDialogPopupProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<typeof BaseAlertDialog.Popup>, 'className'> & {
    className?: string;
  }
>;

const popupDiagnostics = {
  name: 'AlertDialog.Popup',
  fix: 'Provide an AlertDialog.Title or another accessible label.',
};

/**
 * The alertdialog surface. Place the cancel `AlertDialog.Close` first or pass
 * `initialFocus` so focus starts on the least destructive action.
 */
const Popup = withLism(
  forwardRef<HTMLDivElement, AlertDialogPopupProps>(function AlertDialogPopup(
    { className, ...props },
    ref,
  ) {
    const accessibilityRef = useAccessibilityRef(popupDiagnostics, ref);
    return (
      <BaseAlertDialog.Popup
        {...props}
        ref={accessibilityRef}
        className={withClassName(
          'ui-dialog__popup ui-alert-dialog__popup',
          className,
        )}
      />
    );
  }),
);

// Base UI Alert Dialog reuses the Dialog backdrop, title and description parts,
// so the styled Dialog parts and their ui-dialog__* classes are shared.
export const AlertDialog = {
  Root: BaseAlertDialog.Root,
  Trigger: withLism(BaseAlertDialog.Trigger),
  Portal: BaseAlertDialog.Portal,
  Backdrop: Dialog.Backdrop,
  Popup,
  Title: Dialog.Title,
  Description: Dialog.Description,
  Close: withLism(BaseAlertDialog.Close),
};
