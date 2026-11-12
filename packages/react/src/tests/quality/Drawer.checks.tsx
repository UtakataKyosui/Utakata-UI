import { Button } from '../../components/Button.js';
import { Drawer } from '../../components/Drawer.js';
import {
  type DrawerSide,
  drawerManifest,
} from '../../metadata/components/Drawer.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { sideDialogChecks } from '../side-dialog-checks.js';

function FilterContent() {
  return (
    <>
      <Drawer.Title>Filters</Drawer.Title>
      <Drawer.Description>Narrow the list of results.</Drawer.Description>
      <Drawer.Close render={<Button variant="outline" />}>
        Close filters
      </Drawer.Close>
    </>
  );
}

function FilterDrawer({ side }: { side: DrawerSide | undefined }) {
  return (
    <>
      <p>Outside content</p>
      <Drawer.Root {...(side ? { side } : {})}>
        <Drawer.Trigger render={<Button />}>Open filters</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Backdrop />
          <Drawer.Popup>
            <FilterContent />
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}

export const drawerChecks: Record<string, QualityCheck> = sideDialogChecks({
  prefix: 'drawer',
  dismissalId: 'no-drag-dismissal',
  popupClass: 'ui-drawer__popup',
  sides: drawerManifest.sides,
  defaultSide: drawerManifest.props.side.default,
  renderDialog: (side) => (
    <FilterDrawer side={side as DrawerSide | undefined} />
  ),
});
