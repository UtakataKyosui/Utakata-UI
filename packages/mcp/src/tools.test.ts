import { describe, expect, it } from 'vitest';
import { getComponent, listComponents, searchComponents } from './tools.js';

describe('manifest tools', () => {
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
      'Input',
      'Textarea',
      'NativeSelect',
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
