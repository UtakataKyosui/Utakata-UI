import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { expect } from 'vitest';
import { Button } from '../../components/Button.js';
import { Drawer } from '../../components/Drawer.js';
import {
  type DrawerSide,
  drawerManifest,
} from '../../metadata/components/Drawer.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { audit } from '../audit.js';

function FilterDrawer({ side }: { side: DrawerSide | undefined }) {
  return (
    <>
      <p>Outside content</p>
      <Drawer.Root {...(side ? { side } : {})}>
        <Drawer.Trigger render={<Button />}>Open filters</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop />
          <Drawer.Popup>
            <Drawer.Title>Filters</Drawer.Title>
            <Drawer.Description>Narrow the list of results.</Drawer.Description>
            <Drawer.Close render={<Button variant="outline" />}>
              Close filters
            </Drawer.Close>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}

async function openDrawer(side?: DrawerSide) {
  render(<FilterDrawer side={side} />);
  const trigger = screen.getByRole('button', { name: 'Open filters' });
  trigger.focus();
  fireEvent.click(trigger);
  const dialog = await screen.findByRole('dialog', { name: 'Filters' });
  await waitFor(() =>
    expect(dialog).toContainElement(document.activeElement as HTMLElement),
  );
  return { trigger, dialog };
}

async function expectClosedWithFocusOn(trigger: HTMLElement) {
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  await waitFor(() => expect(trigger).toHaveFocus());
}

export const drawerChecks: Record<string, QualityCheck> = {
  'drawer.semantics': async () => {
    for (const side of [undefined, ...drawerManifest.sides]) {
      const { dialog } = await openDrawer(side);
      const expected = side ?? drawerManifest.props.side.default;
      expect(dialog).toHaveAccessibleDescription('Narrow the list of results.');
      expect(dialog).toHaveAttribute('data-side', expected);
      expect(dialog).toHaveClass(
        'ui-drawer__popup',
        `ui-drawer__popup--${expected}`,
      );
      expect((await audit(document.body)).violations).toEqual([]);
      cleanup();
    }
  },
  'drawer.no-drag-dismissal': async () => {
    for (const side of drawerManifest.sides) {
      const escaped = await openDrawer(side);
      fireEvent.keyDown(document.activeElement ?? document.body, {
        key: 'Escape',
      });
      await expectClosedWithFocusOn(escaped.trigger);
      cleanup();
      const closed = await openDrawer(side);
      fireEvent.click(screen.getByRole('button', { name: 'Close filters' }));
      await expectClosedWithFocusOn(closed.trigger);
      cleanup();
    }
  },
};
