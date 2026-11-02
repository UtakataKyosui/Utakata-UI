import { describe, expect, it } from 'vitest';
import { getComponent, listComponents, searchComponents } from './tools.js';

describe('manifest tools', () => {
  it('requires browser evidence for Pagination keyboard and reflow and keeps zoom manual', () => {
    const rules = getComponent('Pagination')?.qualityRules ?? [];
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
    expect(getComponent('Breadcrumb')?.qualityRules).toEqual(
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
    expect(getComponent('Table')?.qualityRules).toEqual(
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
    expect(getComponent('Progress')?.qualityRules).toEqual(
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
    expect(getComponent('Avatar')?.qualityRules).toEqual(
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
    expect(getComponent('Alert')?.qualityRules).toEqual(
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
    expect(getComponent('Card')?.qualityRules).toEqual(
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
    expect(getComponent('Spinner')?.qualityRules).toEqual(
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
    expect(getComponent('Skeleton')?.qualityRules).toEqual(
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
    const rules = getComponent('Badge')?.qualityRules ?? [];
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
    const rules = getComponent('Slider')?.qualityRules ?? [];
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
    const rules = getComponent('Select')?.qualityRules ?? [];
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
  it('requires browser evidence for RadioGroup keyboard interaction', () => {
    expect(getComponent('RadioGroup')?.qualityRules).toEqual(
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
    expect(getComponent('Switch')?.qualityRules).toEqual(
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
    expect(getComponent('Checkbox')?.qualityRules).toEqual(
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
    expect(getComponent('NativeSelect')?.qualityRules).toEqual(
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
    expect(getComponent('Textarea')?.qualityRules).toEqual(
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
    expect(getComponent('Input')?.qualityRules).toEqual(
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
    expect(getComponent('Dialog')?.qualityRules.map(({ id }) => id)).toEqual(
      expect.arrayContaining([
        'dialog.accessible-name',
        'dialog.escape-focus-return',
        'theme.contrast-focus',
        'content.labels-headings',
      ]),
    );
    expect(
      searchComponents('dialog.escape-focus-return').map(({ name }) => name),
    ).toEqual(['Dialog']);
  });

  it('lists every public component', () => {
    expect(listComponents().map(({ name }) => name)).toEqual([
      'Button',
      'Field',
      'Dialog',
      'Kbd',
      'Separator',
      'Badge',
      'Skeleton',
      'Spinner',
      'Card',
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
      'Slider',
    ]);
  });

  it('exposes strict icon naming and development diagnostics', () => {
    expect(getComponent('Button')).toMatchObject({
      props: {
        iconOnly: {
          default: false,
          type: 'boolean; true requires aria-label or aria-labelledby',
        },
      },
      composition: expect.stringContaining('Development diagnostics'),
    });
  });

  it('retrieves a component by case-insensitive name', () => {
    expect(getComponent('field')).toMatchObject({
      name: 'Field',
      parts: ['Root', 'Label', 'Control', 'Description', 'Error'],
      partProps: { Control: 'Base UI FieldControlProps' },
      avoid: expect.arrayContaining([
        'Do not omit Field.Label when composing a control.',
      ]),
    });
    expect(getComponent('Missing')).toBeUndefined();
  });

  it('searches names and component guidance', () => {
    expect(searchComponents('modal').map(({ name }) => name)).toEqual([
      'Dialog',
    ]);
    expect(searchComponents('   ')).toEqual([]);
  });
});
