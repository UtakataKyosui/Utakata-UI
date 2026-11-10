'use client';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import type { SheetSide } from '../metadata/components/Sheet.js';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';
import { Dialog } from './Dialog.js';

export type SheetPopupProps = Omit<
  ComponentPropsWithoutRef<typeof BaseDialog.Popup>,
  'className'
> & {
  className?: string;
  /** Viewport edge the panel is attached to. Defaults to `right`. */
  side?: SheetSide;
};

export type SheetRootProps<Payload = unknown> = Omit<
  BaseDialog.Root.Props<Payload>,
  'modal'
> & {
  /** A Sheet is always modal; the Dialog `modal` option is not available. */
  modal?: never;
};

const popupDiagnostics = {
  name: 'Sheet.Popup',
  fix: 'Provide a Sheet.Title or another accessible label.',
};

/** The Dialog root with `modal` fixed to its default (modal) behavior by type. */
function Root<Payload = unknown>(props: SheetRootProps<Payload>) {
  return <BaseDialog.Root {...props} />;
}

/**
 * The sheet surface, attached to one viewport edge. It is a Dialog popup, so
 * name it with `Sheet.Title` and include a `Sheet.Close`.
 */
const Popup = forwardRef<HTMLDivElement, SheetPopupProps>(function SheetPopup(
  { className, side = 'right', ...props },
  ref,
) {
  const accessibilityRef = useAccessibilityRef(popupDiagnostics, ref);
  return (
    <BaseDialog.Popup
      {...props}
      ref={accessibilityRef}
      data-side={side}
      className={withClassName(
        `ui-dialog__popup ui-sheet__popup ui-sheet__popup--${side}`,
        className,
      )}
    />
  );
});

// A Sheet is a Dialog attached to an edge. Trigger, Portal and Close are the
// Base UI Dialog parts, Root is the Dialog root without the `modal` option, and
// Backdrop, Title and Description are the styled Dialog parts, so the
// ui-dialog__* classes and the Dialog behavior are shared.
export const Sheet = {
  Root,
  Trigger: BaseDialog.Trigger,
  Portal: BaseDialog.Portal,
  Backdrop: Dialog.Backdrop,
  Popup,
  Title: Dialog.Title,
  Description: Dialog.Description,
  Close: BaseDialog.Close,
};
