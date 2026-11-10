import { describe, expect, it } from 'vitest';
import { checkColors, contrast, parseChecks } from './check.js';

const entry = {
  name: 'body',
  kind: 'text',
  foreground: '#000',
  background: '#fff',
  conveysMeaning: false,
};

describe('WCAG color checks', () => {
  it('calculates sRGB contrast symmetrically, including shorthand', () => {
    expect(contrast('#000', '#ffffff')).toBe(21);
    expect(contrast('#fff', '#000000')).toBe(21);
    expect(contrast('#123', '#123')).toBe(1);
  });
  it('uses the unrounded ratio for the AA threshold', () => {
    const results = checkColors(
      parseChecks([{ ...entry, foreground: '#777' }]),
    );
    expect(results[0]?.ratio).toBeLessThan(4.5);
    expect(results[0]?.violations).toHaveLength(1);
    for (const kind of ['large-text', 'non-text']) {
      expect(
        checkColors(parseChecks([{ ...entry, kind, foreground: '#777' }]))[0]
          ?.violations,
      ).toEqual([]);
    }
  });
  it('requires a declared visible cue for meaningful colors', () => {
    expect(
      checkColors(parseChecks([{ ...entry, conveysMeaning: true }]))[0]
        ?.violations,
    ).toHaveLength(1);
    expect(
      checkColors(
        parseChecks([
          { ...entry, conveysMeaning: true, nonColorCue: 'Error label' },
        ]),
      )[0]?.violations,
    ).toEqual([]);
  });
  it('rejects unsupported colors and malformed or empty configuration', () => {
    for (const input of [
      [],
      {},
      [entry, entry],
      [{ ...entry, foreground: 'transparent' }],
      [{ ...entry, background: '#ffffff80' }],
      [{ ...entry, conveysMeaning: undefined }],
    ]) {
      expect(() => parseChecks(input)).toThrow();
    }
  });
});
