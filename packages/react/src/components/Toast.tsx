'use client';

import { Toast as BaseToast } from '@base-ui/react/toast';
import {
  type ComponentPropsWithoutRef,
  type ElementType,
  forwardRef,
  type ReactNode,
} from 'react';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';

type ToastPartProps<T extends ElementType> = Omit<
  ComponentPropsWithoutRef<T>,
  'className'
> & { className?: string };

export type ToastViewportProps = ToastPartProps<typeof BaseToast.Viewport>;
export type ToastRootProps = ToastPartProps<typeof BaseToast.Root>;
export type ToastActionProps = ToastPartProps<typeof BaseToast.Action>;

/** Close needs visible text or an explicit name; an empty button is a type error. */
export type ToastCloseAccessibilityProps =
  | { children: ReactNode }
  | { 'aria-label': string }
  | { 'aria-labelledby': string };

export type ToastCloseProps = ToastPartProps<typeof BaseToast.Close> &
  ToastCloseAccessibilityProps;

const rootDiagnostics = {
  name: 'Toast.Root',
  fix: 'Render a Toast.Title or add a title when calling the toast manager.',
};
const actionDiagnostics = {
  name: 'Toast.Action',
  fix: 'Provide visible action text, aria-label, or a valid aria-labelledby.',
  nameFromContent: true,
};

/**
 * The notification region. Place one per app inside Toast.Provider; Base UI
 * announces additions politely and moves focus here with F6.
 */
const Viewport = forwardRef<HTMLDivElement, ToastViewportProps>(
  function ToastViewport({ className, ...props }, ref) {
    return (
      <BaseToast.Viewport
        {...props}
        ref={ref}
        className={withClassName('ui-toast__viewport', className)}
      />
    );
  },
);

/** One notification; labelled by its Title and described by its Description. */
const Root = forwardRef<HTMLDivElement, ToastRootProps>(function ToastRoot(
  { className, ...props },
  ref,
) {
  const accessibilityRef = useAccessibilityRef(rootDiagnostics, ref);
  return (
    <BaseToast.Root
      {...props}
      ref={accessibilityRef}
      className={withClassName('ui-toast', className)}
    />
  );
});

const Content = forwardRef<
  HTMLDivElement,
  ToastPartProps<typeof BaseToast.Content>
>(function ToastContent({ className, ...props }, ref) {
  return (
    <BaseToast.Content
      {...props}
      ref={ref}
      className={withClassName('ui-toast__content', className)}
    />
  );
});

const Title = forwardRef<
  HTMLHeadingElement,
  ToastPartProps<typeof BaseToast.Title>
>(function ToastTitle({ className, ...props }, ref) {
  return (
    <BaseToast.Title
      {...props}
      ref={ref}
      className={withClassName('ui-toast__title', className)}
    />
  );
});

const Description = forwardRef<
  HTMLParagraphElement,
  ToastPartProps<typeof BaseToast.Description>
>(function ToastDescription({ className, ...props }, ref) {
  return (
    <BaseToast.Description
      {...props}
      ref={ref}
      className={withClassName('ui-toast__description', className)}
    />
  );
});

/** Renders only when it has content, from children or the toast's actionProps. */
const Action = forwardRef<HTMLButtonElement, ToastActionProps>(
  function ToastAction({ className, ...props }, ref) {
    const accessibilityRef = useAccessibilityRef(actionDiagnostics, ref);
    return (
      <BaseToast.Action
        {...props}
        ref={accessibilityRef}
        className={withClassName('ui-toast__action', className)}
      />
    );
  },
);

/**
 * Base UI hides Close from assistive technology until the viewport is expanded
 * or the button is focused, so its name is enforced by type rather than by
 * development diagnostics.
 */
const Close = forwardRef<HTMLButtonElement, ToastCloseProps>(
  function ToastClose({ className, ...props }, ref) {
    return (
      <BaseToast.Close
        {...props}
        ref={ref}
        className={withClassName('ui-toast__close', className)}
      />
    );
  },
);

export const Toast = {
  Provider: BaseToast.Provider,
  Portal: BaseToast.Portal,
  Viewport,
  Root,
  Content,
  Title,
  Description,
  Action,
  Close,
};

/** Adds, updates and closes toasts rendered under the nearest Toast.Provider. */
export const useToastManager = BaseToast.useToastManager;
