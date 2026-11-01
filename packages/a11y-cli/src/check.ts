export type Check = {
  name: string;
  kind: 'text' | 'large-text' | 'non-text';
  foreground: string;
  background: string;
  conveysMeaning: boolean;
  nonColorCue?: string;
};

function luminance(color: string): number {
  if (!/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(color)) {
    throw new Error(`Unsupported color ${color}: use opaque #RGB or #RRGGBB`);
  }
  const hex =
    color.length === 4
      ? [...color.slice(1)].map((digit) => digit + digit).join('')
      : color.slice(1);
  const channels = [0, 2, 4].map((offset) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (
    (channels[0] ?? 0) * 0.2126 +
    (channels[1] ?? 0) * 0.7152 +
    (channels[2] ?? 0) * 0.0722
  );
}

export function contrast(foreground: string, background: string): number {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export function parseChecks(input: unknown): Check[] {
  if (!Array.isArray(input) || input.length === 0)
    throw new Error('Expected a non-empty array of color checks');
  const names = new Set<string>();
  return input.map((entry: unknown) => {
    if (typeof entry !== 'object' || entry === null)
      throw new Error('Each check must be an object');
    const value = entry as Record<string, unknown>;
    if (
      typeof value.name !== 'string' ||
      !value.name.trim() ||
      names.has(value.name) ||
      typeof value.kind !== 'string' ||
      !['text', 'large-text', 'non-text'].includes(value.kind) ||
      typeof value.foreground !== 'string' ||
      typeof value.background !== 'string' ||
      typeof value.conveysMeaning !== 'boolean' ||
      (value.nonColorCue !== undefined && typeof value.nonColorCue !== 'string')
    ) {
      throw new Error(
        'Invalid check: require unique name, kind, foreground, background and conveysMeaning',
      );
    }
    names.add(value.name);
    contrast(value.foreground, value.background);
    return value as Check;
  });
}

export function checkColors(checks: Check[]) {
  return checks.map((check) => {
    const ratio = contrast(check.foreground, check.background);
    const minimum = check.kind === 'text' ? 4.5 : 3;
    const violations: string[] = [];
    if (ratio < minimum)
      violations.push(
        `${check.kind === 'non-text' ? '1.4.11' : '1.4.3'}: contrast below ${minimum}:1`,
      );
    if (check.conveysMeaning && !check.nonColorCue?.trim())
      violations.push('1.4.1: describe a visible non-color cue');
    return { name: check.name, ratio, minimum, violations };
  });
}
