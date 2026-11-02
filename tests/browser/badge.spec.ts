import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';

type BadgeMeasurement = {
  variant: string;
  kind: string;
  contrast: number;
  clipped: boolean;
  overflowsViewport: boolean;
  lines: number;
  borderWidth: number;
  right: number;
  parentRight: number;
  clientWidth: number;
};

// Colors are resolved through a canvas so color-mix() and system colors become RGBA.
function measureBadges(page: Page) {
  return page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Unverified color: no canvas context');
    function rgba(color: string): [number, number, number, number] {
      context?.clearRect(0, 0, 1, 1);
      if (context) context.fillStyle = '#000';
      if (context) context.fillStyle = color;
      context?.fillRect(0, 0, 1, 1);
      const data = context?.getImageData(0, 0, 1, 1).data;
      if (!data) throw new Error(`Unverified color: ${color}`);
      return [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0, (data[3] ?? 0) / 255];
    }
    function over(
      top: [number, number, number, number],
      bottom: [number, number, number, number],
    ): [number, number, number, number] {
      const alpha = top[3] + bottom[3] * (1 - top[3]);
      if (alpha === 0) return [0, 0, 0, 0];
      return [0, 1, 2].map(
        (index) =>
          ((top[index] ?? 0) * top[3] +
            (bottom[index] ?? 0) * bottom[3] * (1 - top[3])) /
          alpha,
      ) as unknown as [number, number, number, number];
    }
    function background(node: Element) {
      const layers: [number, number, number, number][] = [];
      for (
        let current: Element | null = node;
        current;
        current = current.parentElement
      )
        layers.push(rgba(getComputedStyle(current).backgroundColor));
      let result: [number, number, number, number] = [255, 255, 255, 1];
      for (const layer of layers.reverse()) {
        const mixed = over(layer, result);
        result = [mixed[0], mixed[1], mixed[2], 1];
      }
      return result;
    }
    function luminance(color: number[]) {
      const channels = color.slice(0, 3).map((channel) => {
        const value = (channel ?? 0) / 255;
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
    function contrast(first: number[], second: number[]) {
      const a = luminance(first);
      const b = luminance(second);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    }
    return [
      ...document.querySelectorAll<HTMLElement>(
        'section[aria-label="Badge states"] .ui-badge',
      ),
    ].map((node) => {
      const style = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      const text = rgba(style.color);
      const back = background(node);
      const blended = over(text, [back[0], back[1], back[2], 1]);
      const lineHeight = Number.parseFloat(style.lineHeight);
      const padding =
        Number.parseFloat(style.paddingTop) +
        Number.parseFloat(style.paddingBottom) +
        Number.parseFloat(style.borderTopWidth) * 2;
      return {
        variant: node.className.match(/ui-badge--(\w+)/)?.[1] ?? 'unknown',
        kind: node.dataset.case ?? 'unknown',
        contrast: contrast(blended, back),
        clipped:
          node.scrollWidth > node.clientWidth + 1 ||
          node.scrollHeight > node.clientHeight + 1,
        overflowsViewport:
          box.right > document.documentElement.clientWidth + 1 ||
          box.right >
            (node.parentElement?.getBoundingClientRect().right ?? 0) + 1,
        lines: Math.round((box.height - padding) / lineHeight),
        borderWidth: Number.parseFloat(style.borderTopWidth),
        right: box.right,
        parentRight: node.parentElement?.getBoundingClientRect().right ?? 0,
        clientWidth: document.documentElement.clientWidth,
      };
    });
  });
}

function verify(measurements: BadgeMeasurement[], forcedColors = false) {
  const variants = componentManifest.components.Badge.variants;
  expect(measurements).toHaveLength(variants.length * 3);
  for (const item of measurements) {
    const label = `${item.variant}/${item.kind} ${JSON.stringify(item)}`;
    expect(item.contrast, `${label} contrast`).toBeGreaterThanOrEqual(4.5);
    expect(item.clipped, `${label} clipped`).toBe(false);
    expect(item.overflowsViewport, `${label} overflow`).toBe(false);
    if (item.kind === 'long')
      expect(item.lines, `${label} wraps`).toBeGreaterThan(1);
    if (forcedColors)
      expect(item.borderWidth, `${label} border`).toBeGreaterThanOrEqual(1);
  }
}

test('[badge.visual-theme] contrast, wrapping, text size and forced colors', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  const measurements: unknown[] = [];
  const rules = componentManifest.components.Badge.qualityRules.filter(
    (rule) => rule.verification === 'browser',
  );
  const report = await evaluateQuality(rules, {
    'badge.visual-theme': async () => {
      await page
        .locator('section[aria-label="Badge states"]')
        .scrollIntoViewIfNeeded();
      const normal = await measureBadges(page);
      measurements.push({ condition: 'default', normal });
      verify(normal);
      const axe = await new AxeBuilder({ page })
        .include('section[aria-label="Badge states"]')
        .analyze();
      await test.info().attach('badge-axe', {
        body: JSON.stringify(axe),
        contentType: 'application/json',
      });
      expect(axe.violations).toEqual([]);
      expect(axe.incomplete).toEqual([]);
      await page.setViewportSize({ width: 320, height: 720 });
      const narrow = await measureBadges(page);
      measurements.push({ condition: '320px', narrow });
      verify(narrow);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      const large = await measureBadges(page);
      measurements.push({ condition: 'text-size-200', large });
      verify(large);
      await page.emulateMedia({ forcedColors: 'active' });
      const forced = await measureBadges(page);
      measurements.push({ condition: 'forced-colors', forced });
      verify(forced, true);
    },
  });
  await test.info().attach('badge-evidence', {
    body: JSON.stringify({
      browser: browser.version(),
      platform: process.platform,
      project: test.info().project.name,
      report,
      measurements,
    }),
    contentType: 'application/json',
  });
  expect(report.automatedPassed, formatQualityReport(report.results)).toBe(
    true,
  );
});

test('Badge visual detector rejects low contrast', async ({ page }) => {
  await page.goto('/');
  await page.addStyleTag({
    content:
      'section[aria-label="Badge states"] .ui-badge--subtle { --ui-badge-color: #bbbbbb; --ui-badge-background: #ffffff; }',
  });
  const measurements = await measureBadges(page);
  expect(() => verify(measurements)).toThrow();
});

test('Badge visual detector rejects clipped non-wrapping text', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content:
      'section[aria-label="Badge states"] .ui-badge[data-case="long"] { overflow: hidden; white-space: nowrap; inline-size: 6rem; }',
  });
  const measurements = await measureBadges(page);
  expect(measurements.some((item) => item.clipped)).toBe(true);
  expect(() => verify(measurements)).toThrow();
});
