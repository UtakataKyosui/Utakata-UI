/** For the opaque computed RGB colors used by the standard-theme fixtures. */
export function contrast(first: string, second: string) {
  function luminance(color: string) {
    const match = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(color);
    if (!match) throw new Error(`Unverified color: ${color}`);
    const channels = match.slice(1).map((channel) => {
      const value = Number(channel) / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
    return channels.reduce(
      (sum, value, index) =>
        sum + value * ([0.2126, 0.7152, 0.0722][index] ?? 0),
      0,
    );
  }
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
