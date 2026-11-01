import { describe, expect, it } from 'vitest';
import { getComponent, listComponents, searchComponents } from './tools.js';

describe('manifest tools', () => {
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
