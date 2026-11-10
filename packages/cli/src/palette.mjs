const tokens = [
  'primary',
  'on-primary',
  'surface',
  'text',
  'muted',
  'border',
  'danger',
];

export function parsePalette(input) {
  if (input === undefined) return undefined;
  const palette = typeof input === 'string' ? JSON.parse(input) : input;
  if (
    !palette ||
    typeof palette !== 'object' ||
    Array.isArray(palette) ||
    !Object.keys(palette).length
  )
    throw new Error('Palette must contain light and/or dark color maps');
  const result = {};
  for (const [scheme, colors] of Object.entries(palette)) {
    if (
      !['light', 'dark'].includes(scheme) ||
      !colors ||
      typeof colors !== 'object' ||
      Array.isArray(colors) ||
      !Object.keys(colors).length
    )
      throw new Error(
        'Palette must contain non-empty light and/or dark color maps',
      );
    result[scheme] = {};
    for (const [token, color] of Object.entries(colors)) {
      if (
        !tokens.includes(token) ||
        typeof color !== 'string' ||
        !/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(color)
      )
        throw new Error(
          `Invalid palette color ${scheme}.${token}: use a supported token and opaque #RGB or #RRGGBB`,
        );
      result[scheme][token] = color.toLowerCase();
    }
  }
  return result;
}

export function paletteFile(palette) {
  if (palette === undefined) return undefined;
  const blocks = ['@import "./styles/styles.css";'];
  for (const scheme of ['light', 'dark']) {
    if (!palette[scheme]) continue;
    const properties = tokens
      .filter((token) => palette[scheme][token] !== undefined)
      .map((token) => `    --ui-color-${token}: ${palette[scheme][token]};`)
      .join('\n');
    blocks.push(
      `@media (prefers-color-scheme: ${scheme}) {\n  :root {\n${properties}\n  }\n}`,
    );
  }
  return { path: 'theme.css', content: `${blocks.join('\n\n')}\n` };
}
