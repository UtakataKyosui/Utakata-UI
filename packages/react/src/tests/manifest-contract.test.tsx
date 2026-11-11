import { describe, expect, it } from 'vitest';
import { componentManifest } from '../metadata/manifest.js';

describe('public manifest contract', () => {
  it('requires browser evidence for InputGroup keyboard and states and keeps zoom manual', () => {
    const rules = componentManifest.components.InputGroup?.qualityRules ?? [];
    for (const id of ['input-group.keyboard', 'input-group.visual-states'])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id, verification: 'browser' }),
        ]),
      );
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'input-group.zoom-theme',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('requires browser evidence for ButtonGroup keyboard and layout and keeps zoom manual', () => {
    const rules = componentManifest.components.ButtonGroup?.qualityRules ?? [];
    for (const id of ['button-group.keyboard', 'button-group.visual-layout'])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id, verification: 'browser' }),
        ]),
      );
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'button-group.zoom-theme',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('requires browser evidence for ToggleGroup keyboard and visuals and keeps zoom manual', () => {
    const rules = componentManifest.components.ToggleGroup?.qualityRules ?? [];
    for (const id of ['toggle-group.keyboard', 'toggle-group.visual-states'])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id, verification: 'browser' }),
        ]),
      );
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'toggle-group.zoom-theme',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('requires browser evidence for Toast timers, keyboard and layout and keeps platform checks manual', () => {
    const rules = componentManifest.components.Toast?.qualityRules ?? [];
    for (const id of [
      'toast.pause-on-hover-focus',
      'toast.close-action-keyboard',
      'toast.viewport-layout',
    ])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id, verification: 'browser' }),
        ]),
      );
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'toast.platform-manual',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('requires browser evidence for AlertDialog focus and dismissal and keeps platform checks manual', () => {
    const rules = componentManifest.components.AlertDialog?.qualityRules ?? [];
    for (const id of [
      'alert-dialog.initial-focus-containment',
      'alert-dialog.dismissal-focus-return',
      'alert-dialog.forced-focus',
    ])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id, verification: 'browser' }),
        ]),
      );
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'alert-dialog.platform-manual',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('requires browser evidence for Sheet focus, dismissal, placement, motion and forced colors and keeps platform checks manual', () => {
    const rules = componentManifest.components.Sheet?.qualityRules ?? [];
    for (const id of [
      'sheet.focus-containment',
      'sheet.dismissal-focus-return',
      'sheet.placement-scroll',
      'sheet.reduced-motion',
      'sheet.forced-focus',
    ])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id, verification: 'browser' }),
        ]),
      );
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'sheet.platform-manual',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('requires browser evidence for DropdownMenu keyboard, dismissal and forced highlight and keeps platform checks manual', () => {
    const rules = componentManifest.components.DropdownMenu?.qualityRules ?? [];
    for (const id of [
      'dropdown-menu.keyboard',
      'dropdown-menu.activate-dismiss',
      'dropdown-menu.forced-highlight',
    ])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id, verification: 'browser' }),
        ]),
      );
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'dropdown-menu.platform-manual',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('requires browser evidence for Popover dismissal and forced-colors focus and keeps platform checks manual', () => {
    const rules = componentManifest.components.Popover?.qualityRules ?? [];
    for (const id of ['popover.open-dismiss-focus', 'popover.forced-focus'])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id, verification: 'browser' }),
        ]),
      );
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'popover.platform-manual',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('requires browser evidence for Tooltip interaction and visuals and keeps platform checks manual', () => {
    const rules = componentManifest.components.Tooltip?.qualityRules ?? [];
    for (const id of [
      'tooltip.focus-hover-escape',
      'tooltip.hoverable',
      'tooltip.visual-position',
    ])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id, verification: 'browser' }),
        ]),
      );
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'tooltip.platform-manual',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('requires browser evidence for Toggle keyboard and visuals and keeps zoom manual', () => {
    const rules = componentManifest.components.Toggle?.qualityRules ?? [];
    for (const id of ['toggle.keyboard', 'toggle.visual-theme'])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id, verification: 'browser' }),
        ]),
      );
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'toggle.zoom-theme',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('requires browser evidence for Tabs keyboard and layout and keeps zoom and speech manual', () => {
    const rules = componentManifest.components.Tabs?.qualityRules ?? [];
    for (const id of ['tabs.keyboard', 'tabs.indicator-layout'])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id, verification: 'browser' }),
        ]),
      );
    for (const id of ['tabs.zoom-theme', 'tabs.screen-reader'])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id, verification: 'manual' }),
        ]),
      );
  });
  it('requires browser evidence for Accordion keyboard and motion and keeps zoom and speech manual', () => {
    const rules = componentManifest.components.Accordion?.qualityRules ?? [];
    for (const id of ['accordion.keyboard-focus', 'accordion.motion-forced'])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id, verification: 'browser' }),
        ]),
      );
    for (const id of ['accordion.zoom-theme', 'accordion.screen-reader'])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id, verification: 'manual' }),
        ]),
      );
  });
  it('requires browser evidence for Collapsible keyboard and motion and keeps zoom manual', () => {
    const rules = componentManifest.components.Collapsible?.qualityRules ?? [];
    for (const id of [
      'collapsible.keyboard-focus',
      'collapsible.motion-forced',
    ])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id, verification: 'browser' }),
        ]),
      );
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'collapsible.zoom-theme',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('requires browser evidence for Pagination keyboard and reflow and keeps zoom manual', () => {
    const rules = componentManifest.components.Pagination?.qualityRules ?? [];
    for (const id of [
      'pagination.disabled-direction',
      'pagination.target-reflow',
    ])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id, verification: 'browser' }),
        ]),
      );
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'pagination.zoom-theme',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('requires browser evidence for Breadcrumb reflow and focus and keeps zoom manual', () => {
    expect(componentManifest.components.Breadcrumb?.qualityRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'breadcrumb.reflow-focus',
          verification: 'browser',
          severity: 'error',
        }),
        expect.objectContaining({
          id: 'breadcrumb.zoom-theme',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('requires browser evidence for Table scrolling and focus and keeps zoom manual', () => {
    expect(componentManifest.components.Table?.qualityRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'table.reflow-focus',
          verification: 'browser',
          severity: 'error',
        }),
        expect.objectContaining({
          id: 'table.zoom-theme',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('requires browser evidence for Progress visuals and keeps OS checks manual', () => {
    expect(componentManifest.components.Progress?.qualityRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'progress.visual-motion',
          verification: 'browser',
          severity: 'error',
        }),
        expect.objectContaining({
          id: 'progress.os-reduced-motion',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('requires browser evidence for Avatar visuals and keeps zoom manual', () => {
    expect(componentManifest.components.Avatar?.qualityRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'avatar.visual-theme',
          verification: 'browser',
          severity: 'error',
        }),
        expect.objectContaining({
          id: 'avatar.zoom-assistive',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('requires browser evidence for Alert visuals and keeps announcements manual', () => {
    expect(componentManifest.components.Alert?.qualityRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'alert.visual-theme',
          verification: 'browser',
          severity: 'error',
        }),
        expect.objectContaining({
          id: 'alert.announcement',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('requires browser evidence for Card layout and keeps zoom manual', () => {
    expect(componentManifest.components.Card?.qualityRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'card.layout-theme',
          verification: 'browser',
          severity: 'error',
        }),
        expect.objectContaining({
          id: 'card.zoom-assistive',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('requires browser evidence for Spinner motion and keeps OS checks manual', () => {
    expect(componentManifest.components.Spinner?.qualityRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'spinner.motion-theme',
          verification: 'browser',
          severity: 'error',
        }),
        expect.objectContaining({
          id: 'spinner.os-reduced-motion',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('requires browser evidence for Skeleton motion and keeps OS checks manual', () => {
    expect(componentManifest.components.Skeleton?.qualityRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'skeleton.motion-theme',
          verification: 'browser',
          severity: 'error',
        }),
        expect.objectContaining({
          id: 'skeleton.os-reduced-motion',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('requires browser evidence for Badge visuals and keeps zoom and speech manual', () => {
    const rules = componentManifest.components.Badge?.qualityRules ?? [];
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'badge.visual-theme',
          verification: 'browser',
          severity: 'error',
        }),
        expect.objectContaining({
          id: 'badge.zoom-assistive',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('requires browser evidence for Slider keyboard and pointer and keeps speech manual', () => {
    const rules = componentManifest.components.Slider?.qualityRules ?? [];
    for (const id of ['slider.keyboard', 'slider.pointer'])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id, verification: 'browser' }),
        ]),
      );
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'slider.screen-reader',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('requires browser evidence for Select interaction and keeps speech manual', () => {
    const rules = componentManifest.components.Select?.qualityRules ?? [];
    for (const id of [
      'select.keyboard-selection',
      'select.escape-focus-return',
      'select.popup-position-dismiss',
    ])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id, verification: 'browser' }),
        ]),
      );
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'select.screen-reader',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('requires browser evidence for Command interaction and keeps real IME and speech manual', () => {
    const rules = componentManifest.components.Command?.qualityRules ?? [];
    for (const id of [
      'command.keyboard-execute',
      'command.dialog-focus',
      'command.visual-forced',
    ])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id,
            verification: 'browser',
            severity: 'error',
          }),
        ]),
      );
    for (const id of ['command.real-ime', 'command.screen-reader'])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id, verification: 'manual' }),
        ]),
      );
  });
  it('requires browser evidence for Combobox interaction and keeps real IME and speech manual', () => {
    const rules = componentManifest.components.Combobox?.qualityRules ?? [];
    for (const id of [
      'combobox.keyboard-selection',
      'combobox.dismiss-focus',
      'combobox.ime-browser',
    ])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id,
            verification: 'browser',
            severity: 'error',
          }),
        ]),
      );
    for (const id of ['combobox.real-ime', 'combobox.screen-reader'])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id, verification: 'manual' }),
        ]),
      );
  });
  it('requires browser evidence for InputOTP keyboard, paste and visual properties and keeps autofill, speech and physical zoom manual', () => {
    const rules = componentManifest.components.InputOTP?.qualityRules ?? [];
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'input-otp.keyboard-paste',
          verification: 'browser',
          severity: 'error',
        }),
      ]),
    );
    for (const id of [
      'input-otp.target-size',
      'input-otp.contrast',
      'input-otp.focus-visible',
      'input-otp.invalid-state',
      'input-otp.forced-colors',
      'input-otp.reflow',
    ])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id,
            verification: 'browser',
            severity: 'error',
          }),
        ]),
      );
    for (const id of [
      'input-otp.autofill-ime',
      'input-otp.screen-reader',
      'input-otp.zoom-physical',
    ])
      expect(rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id, verification: 'manual' }),
        ]),
      );
  });
  it('requires browser evidence for RadioGroup keyboard interaction', () => {
    expect(componentManifest.components.RadioGroup?.qualityRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'radio-group.keyboard',
          verification: 'browser',
          severity: 'error',
        }),
      ]),
    );
  });
  it('requires browser evidence for Switch keyboard interaction', () => {
    expect(componentManifest.components.Switch?.qualityRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'switch.keyboard-pointer',
          verification: 'browser',
          severity: 'error',
        }),
      ]),
    );
  });
  it('exposes the required Checkbox reset browser rule', () => {
    expect(componentManifest.components.Checkbox?.qualityRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'checkbox.reset-browser',
          verification: 'browser',
          severity: 'error',
        }),
      ]),
    );
  });
  it('exposes NativeSelect browser coverage separately from platform evidence', () => {
    expect(componentManifest.components.NativeSelect?.qualityRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'native-select.browser-behavior',
          verification: 'browser',
          severity: 'error',
        }),
        expect.objectContaining({
          id: 'native-select.platform-picker',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('exposes the required Textarea keyboard browser rule', () => {
    expect(componentManifest.components.Textarea?.qualityRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'textarea.keyboard-input',
          verification: 'browser',
          severity: 'error',
        }),
      ]),
    );
  });
  it('distinguishes required Input browser checks from residual manual evidence', () => {
    expect(componentManifest.components.Input?.qualityRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'input.visual-theme',
          verification: 'browser',
          severity: 'error',
        }),
        expect.objectContaining({
          id: 'input.zoom-assistive-output',
          verification: 'manual',
        }),
      ]),
    );
  });
  it('exposes component and shared review rules to agents', () => {
    expect(
      [
        ...componentManifest.components.Dialog.qualityRules,
        ...componentManifest.sharedQualityRules,
      ].map(({ id }) => id),
    ).toEqual(
      expect.arrayContaining([
        'dialog.accessible-name',
        'dialog.escape-focus-return',
        'theme.rendered-contrast',
        'theme.focus-visibility',
        'dialog.assistive-output',
        'content.labels-headings',
      ]),
    );
  });

  it('lists every public component', () => {
    expect(Object.keys(componentManifest.components)).toEqual([
      'Button',
      'Field',
      'Dialog',
      'Kbd',
      'Separator',
      'Sheet',
      'Badge',
      'Skeleton',
      'Spinner',
      'Card',
      'Empty',
      'Alert',
      'Avatar',
      'Progress',
      'Table',
      'Breadcrumb',
      'Pagination',
      'Input',
      'Textarea',
      'NativeSelect',
      'Checkbox',
      'Switch',
      'RadioGroup',
      'Select',
      'InputOTP',
      'Combobox',
      'Command',
      'Slider',
      'Collapsible',
      'Accordion',
      'Tabs',
      'Toggle',
      'Tooltip',
      'Popover',
      'DropdownMenu',
      'AlertDialog',
      'Toast',
      'InputGroup',
      'ToggleGroup',
      'ButtonGroup',
    ]);
  });

  it('exposes strict icon naming and development diagnostics', () => {
    expect(componentManifest.components.Button).toMatchObject({
      props: {
        iconOnly: {
          default: false,
          type: 'boolean; true requires aria-label or aria-labelledby',
        },
      },
      composition: expect.stringContaining('Development diagnostics'),
    });
  });
});
