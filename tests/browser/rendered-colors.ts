import type { Page } from '@playwright/test';

export type RenderedColors = {
  /** Contrast of the element's own text color against its own composited background. */
  text: number;
  /** Contrast of the element's own composited background against what is behind it. */
  fill: number;
  /** Contrast of the border against what is behind the element. */
  border: number;
  borderWidth: number;
  borderStyle: string;
  opacity: number;
  animationName: string;
  animationPlayState: string;
  animationDuration: string;
  width: number;
  height: number;
  left: number;
  right: number;
  scrollWidth: number;
  clientWidth: number;
  scrollHeight: number;
  clientHeight: number;
};

/**
 * Measures rendered colors for every element matching `selector`. Colors are
 * resolved through a canvas so color-mix() and system colors become RGBA, and
 * semi-transparent layers are composited over their ancestors.
 */
export async function measureRenderedColors(
  page: Page,
  selector: string,
): Promise<RenderedColors[]> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  return page.evaluate((query) => {
    type Rgba = [number, number, number, number];
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Unverified color: no canvas context');
    function rgba(color: string): Rgba {
      if (!context) throw new Error('Unverified color: no canvas context');
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = '#000';
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const data = context.getImageData(0, 0, 1, 1).data;
      return [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0, (data[3] ?? 0) / 255];
    }
    function over(top: Rgba, bottom: Rgba): Rgba {
      const alpha = top[3] + bottom[3] * (1 - top[3]);
      if (alpha === 0) return [0, 0, 0, 0];
      const mix = (index: 0 | 1 | 2) =>
        (top[index] * top[3] + bottom[index] * bottom[3] * (1 - top[3])) /
        alpha;
      return [mix(0), mix(1), mix(2), alpha];
    }
    function behind(node: Element): Rgba {
      const layers: Rgba[] = [];
      for (
        let current: Element | null = node.parentElement;
        current;
        current = current.parentElement
      )
        layers.push(rgba(getComputedStyle(current).backgroundColor));
      let result: Rgba = [255, 255, 255, 1];
      for (const layer of layers.reverse()) result = over(layer, result);
      return [result[0], result[1], result[2], 1];
    }
    function luminance(color: Rgba) {
      const channels = [color[0], color[1], color[2]].map((channel) => {
        const value = channel / 255;
        return value <= 0.04045
          ? value / 12.92
          : ((value + 0.055) / 1.055) ** 2.4;
      });
      return (
        0.2126 * (channels[0] ?? 0) +
        0.7152 * (channels[1] ?? 0) +
        0.0722 * (channels[2] ?? 0)
      );
    }
    function contrast(first: Rgba, second: Rgba) {
      const a = luminance(first);
      const b = luminance(second);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    }
    return [...document.querySelectorAll<HTMLElement>(query)].map((node) => {
      const style = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      const back = behind(node);
      const fill = over(rgba(style.backgroundColor), back);
      const text = over(rgba(style.color), [fill[0], fill[1], fill[2], 1]);
      const border = over(rgba(style.borderTopColor), back);
      return {
        text: contrast(text, [fill[0], fill[1], fill[2], 1]),
        fill: contrast([fill[0], fill[1], fill[2], 1], back),
        border: contrast(border, back),
        borderWidth: Number.parseFloat(style.borderTopWidth),
        borderStyle: style.borderTopStyle,
        opacity: Number.parseFloat(style.opacity),
        animationName: style.animationName,
        animationPlayState: style.animationPlayState,
        animationDuration: style.animationDuration,
        width: box.width,
        height: box.height,
        left: box.left,
        right: box.right,
        scrollWidth: node.scrollWidth,
        clientWidth: node.clientWidth,
        scrollHeight: node.scrollHeight,
        clientHeight: node.clientHeight,
      };
    });
  }, selector);
}
