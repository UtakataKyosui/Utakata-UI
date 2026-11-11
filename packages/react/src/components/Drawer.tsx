'use client';

import { Drawer as BaseDrawer } from '@base-ui/react/drawer';
import {
  type ComponentPropsWithoutRef,
  createContext,
  type ElementType,
  forwardRef,
  useContext,
} from 'react';
import type { DrawerSide } from '../metadata/components/Drawer.js';
import { useAccessibilityRef } from './accessibility.js';
import { withClassName } from './classNames.js';
import { type WithLismProps, withLism } from './lism.js';

type DrawerPartProps<T extends ElementType> = WithLismProps<
  Omit<ComponentPropsWithoutRef<T>, 'className'> & {
    className?: string;
  }
>;

export type DrawerPopupProps = DrawerPartProps<typeof BaseDrawer.Popup>;

export type DrawerRootProps<Payload = unknown> = Omit<
  BaseDrawer.Root.Props<Payload>,
  | 'modal'
  | 'swipeDirection'
  | 'snapPoints'
  | 'snapPoint'
  | 'defaultSnapPoint'
  | 'onSnapPointChange'
  | 'snapToSequentialPoints'
> & {
  /** Viewport edge the drawer is attached to. Defaults to `bottom`. */
  side?: DrawerSide;
  /** A Drawer is always modal; the `modal` option is not available. */
  modal?: never;
  /** The swipe direction follows `side`; set `side` instead. */
  swipeDirection?: never;
  /** Snap points are not provided. */
  snapPoints?: never;
  /** Snap points are not provided. */
  snapPoint?: never;
  /** Snap points are not provided. */
  defaultSnapPoint?: never;
  /** Snap points are not provided. */
  onSnapPointChange?: never;
  /** Snap points are not provided. */
  snapToSequentialPoints?: never;
};

// The swipe that dismisses a drawer moves it back toward its own edge.
const swipeDirections = {
  top: 'up',
  right: 'right',
  bottom: 'down',
  left: 'left',
} as const satisfies Record<DrawerSide, string>;

const SideContext = createContext<DrawerSide>('bottom');

const popupDiagnostics = {
  name: 'Drawer.Popup',
  fix: 'Provide a Drawer.Title or another accessible label.',
};

/**
 * The Base UI Drawer root. `side` picks the edge and the matching swipe-to-
 * dismiss direction; `modal` and the snap point options are not available.
 */
function Root<Payload = unknown>({
  side = 'bottom',
  ...props
}: DrawerRootProps<Payload>) {
  return (
    <SideContext.Provider value={side}>
      <BaseDrawer.Root
        {...(props as BaseDrawer.Root.Props<Payload>)}
        swipeDirection={swipeDirections[side]}
      />
    </SideContext.Provider>
  );
}

const Backdrop = withLism(
  forwardRef<HTMLDivElement, DrawerPartProps<typeof BaseDrawer.Backdrop>>(
    function DrawerBackdrop({ className, ...props }, ref) {
      return (
        <BaseDrawer.Backdrop
          {...props}
          ref={ref}
          className={withClassName(
            'ui-dialog__backdrop ui-drawer__backdrop',
            className,
          )}
        />
      );
    },
  ),
);

/**
 * The drawer surface, attached to the edge chosen on `Drawer.Root`. It renders
 * the Base UI viewport (required for swipe handling), popup and a scrollable
 * content region, so name it with `Drawer.Title` and include a `Drawer.Close`.
 */
const Popup = withLism(
  forwardRef<HTMLDivElement, DrawerPopupProps>(function DrawerPopup(
    { className, children, ...props },
    ref,
  ) {
    const side = useContext(SideContext);
    const accessibilityRef = useAccessibilityRef(popupDiagnostics, ref);
    return (
      <BaseDrawer.Viewport className="ui-drawer__viewport" data-side={side}>
        <BaseDrawer.Popup
          {...props}
          ref={accessibilityRef}
          data-side={side}
          className={withClassName(
            `ui-dialog__popup ui-drawer__popup ui-drawer__popup--${side}`,
            className,
          )}
        >
          <BaseDrawer.Content className="ui-drawer__content">
            {children}
          </BaseDrawer.Content>
        </BaseDrawer.Popup>
      </BaseDrawer.Viewport>
    );
  }),
);

const Title = withLism(
  forwardRef<HTMLHeadingElement, DrawerPartProps<typeof BaseDrawer.Title>>(
    function DrawerTitle({ className, ...props }, ref) {
      return (
        <BaseDrawer.Title
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
    DrawerPartProps<typeof BaseDrawer.Description>
  >(function DrawerDescription({ className, ...props }, ref) {
    return (
      <BaseDrawer.Description
        {...props}
        ref={ref}
        className={withClassName('ui-dialog__description', className)}
      />
    );
  }),
);

// A Drawer is a swipe-dismissible modal panel built on Base UI Drawer.
// Trigger, Portal and Close are the Base UI parts; the styled Dialog classes
// give Backdrop, Popup, Title and Description the same surface.
export const Drawer = {
  Root,
  Trigger: withLism(BaseDrawer.Trigger),
  Portal: BaseDrawer.Portal,
  Backdrop,
  Popup,
  Title,
  Description,
  Close: withLism(BaseDrawer.Close),
};
