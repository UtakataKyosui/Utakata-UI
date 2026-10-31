import { describe, expect, it } from 'vitest';
import { getComponent, listComponents, searchComponents } from './tools.js';

describe('manifest tools', () => {
  it('lists every public component', () => {
    expect(listComponents().map(({ name }) => name)).toEqual([
      'Button',
      'Field',
      'Dialog',
    ]);
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
