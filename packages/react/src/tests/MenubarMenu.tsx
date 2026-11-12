import type { ReactNode } from 'react';
import { Menubar } from '../components/Menubar.js';

/** A top-level menu with the standard portal, positioner and popup. */
export function MenubarMenu({
  label,
  disabled,
  side,
  children,
}: {
  label: string;
  disabled?: boolean | undefined;
  side?: 'inline-end' | undefined;
  children: ReactNode;
}) {
  return (
    <Menubar.Menu disabled={disabled}>
      <Menubar.Trigger>{label}</Menubar.Trigger>
      <Menubar.Portal>
        <Menubar.Positioner sideOffset={4} {...(side ? { side } : {})}>
          <Menubar.Popup>{children}</Menubar.Popup>
        </Menubar.Positioner>
      </Menubar.Portal>
    </Menubar.Menu>
  );
}
