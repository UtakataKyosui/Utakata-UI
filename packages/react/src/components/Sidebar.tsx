'use client';

import { useRender } from '@base-ui/react/use-render';
import {
  type ComponentPropsWithoutRef,
  createContext,
  forwardRef,
  type JSX,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { Button, type ButtonProps } from './Button.js';
import { withClassName } from './classNames.js';
import { type WithLismProps, withLism } from './lism.js';
import { Sheet } from './Sheet.js';

type PartProps<Tag extends keyof JSX.IntrinsicElements> = WithLismProps<
  Omit<ComponentPropsWithoutRef<Tag>, 'className'> & { className?: string }
>;

/** Narrow-viewport breakpoint in CSS pixels used when none is given. */
export const sidebarMobileBreakpoint = 768;

interface SidebarContextValue {
  /** Desktop expansion, and whether the narrow-viewport sheet is open. */
  open: boolean;
  setOpen: (open: boolean) => void;
  /** True while the viewport is narrower than the breakpoint. */
  isMobile: boolean;
  /** Expanded (desktop) or open (narrow-viewport sheet) state of the sidebar. */
  expanded: boolean;
  toggle: () => void;
  id: string;
  triggerRef: { current: HTMLElement | null };
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

/**
 * Reads the sidebar state. `open` is the persistent (wide viewport) state,
 * `isMobile` tells whether the sheet is shown, and `expanded` is the state the
 * trigger currently controls.
 */
export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context)
    throw new Error('Sidebar parts must be used inside Sidebar.Provider.');
  return context;
}

function useIsMobile(breakpoint: number) {
  const query = `(max-width: ${breakpoint - 0.02}px)`;
  const subscribe = useCallback(
    (notify: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const list = window.matchMedia(query);
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () =>
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia(query).matches
        : false,
    () => false,
  );
}

export type SidebarProviderProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<'div'>, 'className'> & {
    className?: string;
    /** Controlled expansion on wide viewports. */
    open?: boolean;
    /** Initial expansion on wide viewports. Defaults to `true`. */
    defaultOpen?: boolean;
    /** Called when the wide-viewport expansion changes. */
    onOpenChange?: (open: boolean) => void;
    /**
     * Viewports narrower than this many CSS pixels show the sidebar as a
     * modal sheet that starts closed. Defaults to 768.
     */
    mobileBreakpoint?: number;
  }
>;

const Provider = withLism(
  forwardRef<HTMLDivElement, SidebarProviderProps>(function SidebarProvider(
    {
      className,
      open: openProp,
      defaultOpen = true,
      onOpenChange,
      mobileBreakpoint = sidebarMobileBreakpoint,
      ...props
    },
    ref,
  ) {
    const id = useId();
    const [uncontrolled, setUncontrolled] = useState(defaultOpen);
    const [mobileOpen, setMobileOpen] = useState(false);
    const isMobile = useIsMobile(mobileBreakpoint);
    const open = openProp ?? uncontrolled;
    const triggerRef = useRef<HTMLElement | null>(null);
    const focusInside = useRef(false);

    const setOpen = useCallback(
      (next: boolean) => {
        if (isMobile) setMobileOpen(next);
        else {
          if (openProp === undefined) setUncontrolled(next);
          onOpenChange?.(next);
        }
      },
      [isMobile, openProp, onOpenChange],
    );
    const expanded = isMobile ? mobileOpen : open;
    const toggle = useCallback(() => setOpen(!expanded), [setOpen, expanded]);

    // Remember whether focus was last inside the sidebar surface, because the
    // focused element is removed when the layout switches between the inline
    // sidebar and the sheet.
    useEffect(() => {
      const track = (event: FocusEvent) => {
        focusInside.current =
          event.target instanceof Element &&
          event.target.closest('[data-ui-sidebar-surface]') !== null;
      };
      document.addEventListener('focusin', track);
      return () => document.removeEventListener('focusin', track);
    }, []);

    const previousMobile = useRef(isMobile);
    useEffect(() => {
      if (previousMobile.current === isMobile) return;
      previousMobile.current = isMobile;
      setMobileOpen(false);
      const active = document.activeElement;
      if (focusInside.current && (!active || active === document.body))
        triggerRef.current?.focus();
    }, [isMobile]);

    const value = useMemo(
      () => ({ open, setOpen, isMobile, expanded, toggle, id, triggerRef }),
      [open, setOpen, isMobile, expanded, toggle, id],
    );
    return (
      <SidebarContext.Provider value={value}>
        <div
          {...props}
          ref={ref}
          className={withClassName('ui-sidebar-provider', className)}
        />
      </SidebarContext.Provider>
    );
  }),
);

/**
 * The sidebar is a navigation landmark and must be named by `aria-label` or
 * `aria-labelledby` (for example "Main").
 */
export type SidebarRootProps = WithLismProps<
  Omit<
    ComponentPropsWithoutRef<'nav'>,
    'className' | 'aria-label' | 'aria-labelledby' | 'id' | 'hidden'
  > & {
    className?: string;
    /** Visible label of the close control in the narrow-viewport sheet. */
    closeLabel?: ReactNode;
  } & (
      | { 'aria-label': string; 'aria-labelledby'?: never }
      | { 'aria-label'?: never; 'aria-labelledby': string }
    )
>;

/**
 * A named navigation landmark. On wide viewports it stays in the layout and is
 * hidden (removed from the accessibility tree and Tab order) when collapsed. On
 * narrow viewports it is a modal Sheet on the left that starts closed.
 */
const Root = withLism(
  forwardRef<HTMLElement, SidebarRootProps>(function SidebarRoot(
    { className, closeLabel = '閉じる', children, ...props },
    ref,
  ) {
    const { isMobile, expanded, setOpen, id } = useSidebar();
    const name = {
      'aria-label': props['aria-label'],
      'aria-labelledby': props['aria-labelledby'],
    };
    if (isMobile)
      return (
        <Sheet.Root open={expanded} onOpenChange={setOpen}>
          <Sheet.Portal>
            <Sheet.Backdrop />
            <Sheet.Popup
              side="left"
              {...name}
              data-ui-sidebar-surface=""
              className="ui-sidebar__sheet"
            >
              <Sheet.Close render={<Button variant="outline" />}>
                {closeLabel}
              </Sheet.Close>
              <nav
                {...props}
                ref={ref}
                id={id}
                data-state="open"
                className={withClassName('ui-sidebar', className)}
              >
                {children}
              </nav>
            </Sheet.Popup>
          </Sheet.Portal>
        </Sheet.Root>
      );
    return (
      <nav
        {...props}
        ref={ref}
        id={id}
        hidden={!expanded}
        data-state={expanded ? 'open' : 'closed'}
        data-ui-sidebar-surface=""
        className={withClassName('ui-sidebar', className)}
      >
        {children}
      </nav>
    );
  }),
);

/**
 * Toggles the sidebar. It is a Button, so an icon-only trigger needs
 * `aria-label` or `aria-labelledby` by type. The name stays the same while the
 * state is exposed through `aria-expanded`; do not change the label with it.
 */
export type SidebarTriggerProps = ButtonProps;

const Trigger = forwardRef<HTMLElement, SidebarTriggerProps>(
  function SidebarTrigger({ onClick, className, ...props }, ref) {
    const { expanded, toggle, isMobile, id, triggerRef } = useSidebar();
    const setRef = useCallback(
      (element: HTMLElement | null) => {
        triggerRef.current = element;
        if (typeof ref === 'function') ref(element);
        else if (ref) ref.current = element;
      },
      [ref, triggerRef],
    );
    return (
      <Button
        variant="ghost"
        {...(props as ButtonProps)}
        ref={setRef}
        aria-expanded={expanded}
        // The mobile sheet is not mounted while closed, so there is nothing to
        // reference until it opens.
        aria-controls={isMobile && !expanded ? undefined : id}
        onClick={(event: MouseEvent<HTMLElement>) => {
          onClick?.(event as never);
          if (!event.defaultPrevented) toggle();
        }}
        className={withClassName('ui-sidebar__trigger', className)}
      />
    );
  },
);

function part(Tag: 'div', baseClassName: string, displayName: string) {
  const Component = forwardRef<HTMLDivElement, PartProps<'div'>>(
    ({ className, ...props }, ref) => (
      <Tag
        {...props}
        ref={ref}
        className={withClassName(baseClassName, className)}
      />
    ),
  );
  Component.displayName = displayName;
  return withLism(Component);
}

const Header = part('div', 'ui-sidebar__header', 'Sidebar.Header');
const Content = part('div', 'ui-sidebar__content', 'Sidebar.Content');
const Footer = part('div', 'ui-sidebar__footer', 'Sidebar.Footer');

const GroupContext = createContext<((id: string | undefined) => void) | null>(
  null,
);

/** A labelled group of related items; named by its `Sidebar.GroupLabel`. */
const Group = withLism(
  forwardRef<HTMLDivElement, PartProps<'div'>>(function SidebarGroup(
    { className, ...props },
    ref,
  ) {
    const [labelId, setLabelId] = useState<string | undefined>();
    return (
      <GroupContext.Provider value={setLabelId}>
        {labelId ? (
          // biome-ignore lint/a11y/useSemanticElements: fieldset is for form controls; this groups navigation links.
          <div
            role="group"
            aria-labelledby={labelId}
            {...props}
            ref={ref}
            className={withClassName('ui-sidebar__group', className)}
          />
        ) : (
          <div
            {...props}
            ref={ref}
            className={withClassName('ui-sidebar__group', className)}
          />
        )}
      </GroupContext.Provider>
    );
  }),
);

/** Visible name of the enclosing `Sidebar.Group`. */
const GroupLabel = withLism(
  forwardRef<HTMLDivElement, PartProps<'div'>>(function SidebarGroupLabel(
    { className, id: idProp, ...props },
    ref,
  ) {
    const generated = useId();
    const id = idProp ?? generated;
    const register = useContext(GroupContext);
    useLayoutEffect(() => {
      register?.(id);
      return () => register?.(undefined);
    }, [register, id]);
    return (
      <div
        {...props}
        id={id}
        ref={ref}
        className={withClassName('ui-sidebar__group-label', className)}
      />
    );
  }),
);

const Menu = withLism(
  forwardRef<HTMLUListElement, PartProps<'ul'>>(function SidebarMenu(
    { className, children, ...props },
    ref,
  ) {
    return (
      <ul
        {...props}
        ref={ref}
        className={withClassName('ui-sidebar__menu', className)}
      >
        {children}
      </ul>
    );
  }),
);

const MenuItem = withLism(
  forwardRef<HTMLLIElement, PartProps<'li'>>(function SidebarMenuItem(
    { className, ...props },
    ref,
  ) {
    return (
      <li
        {...props}
        ref={ref}
        className={withClassName('ui-sidebar__menu-item', className)}
      />
    );
  }),
);

/**
 * A destination or action in the menu. Pass `href`, or a `render` element such
 * as a router link or `<button />`. `current` marks the current location with
 * `aria-current="page"`; visible text is its accessible name.
 */
export type SidebarMenuButtonProps = WithLismProps<
  Omit<ComponentPropsWithoutRef<'a'>, 'className' | 'aria-current'> & {
    className?: string;
    /** Marks the link to the current page; sets `aria-current="page"`. */
    current?: boolean;
    'aria-current'?: never;
  } & (
      | { href: string; render?: useRender.RenderProp }
      | { href?: string; render: useRender.RenderProp }
    )
>;

const MenuButton = withLism(
  forwardRef<HTMLAnchorElement, SidebarMenuButtonProps>(
    function SidebarMenuButton({ className, render, current, ...props }, ref) {
      return useRender({
        defaultTagName: 'a',
        render,
        ref,
        props: {
          ...props,
          'aria-current': current ? 'page' : undefined,
          'data-current': current ? '' : undefined,
          className: withClassName('ui-sidebar__menu-button', className),
        },
      });
    },
  ),
);

export const Sidebar = {
  Provider,
  Root,
  Trigger,
  Header,
  Content,
  Footer,
  Group,
  GroupLabel,
  Menu,
  MenuItem,
  MenuButton,
};
