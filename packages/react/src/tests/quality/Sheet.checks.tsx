import { Button } from '../../components/Button.js';
import { Sheet } from '../../components/Sheet.js';
import {
  type SheetSide,
  sheetManifest,
} from '../../metadata/components/Sheet.js';
import type { QualityCheck } from '../../metadata/quality.js';
import { sideDialogChecks } from '../side-dialog-checks.js';

function FilterSheet({ side }: { side: SheetSide | undefined }) {
  return (
    <>
      <p>Outside content</p>
      <Sheet.Root>
        <Sheet.Trigger render={<Button />}>Open filters</Sheet.Trigger>
        <Sheet.Portal>
          <Sheet.Backdrop />
          <Sheet.Popup {...(side ? { side } : {})}>
            <Sheet.Title>Filters</Sheet.Title>
            <Sheet.Description>Narrow the list of results.</Sheet.Description>
            <Sheet.Close render={<Button variant="outline" />}>
              Close filters
            </Sheet.Close>
          </Sheet.Popup>
        </Sheet.Portal>
      </Sheet.Root>
    </>
  );
}

export const sheetChecks: Record<string, QualityCheck> = sideDialogChecks({
  prefix: 'sheet',
  dismissalId: 'escape-focus-return',
  popupClass: 'ui-sheet__popup',
  sides: sheetManifest.sides,
  defaultSide: sheetManifest.props.side.default,
  renderDialog: (side) => <FilterSheet side={side as SheetSide | undefined} />,
});
