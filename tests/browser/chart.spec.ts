import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import { measureRenderedColors } from './rendered-colors.js';

const section = 'section[aria-label="Chart states"]';
const markers = `${section} .ui-chart__legend .ui-chart__marker`;
let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

function chart(page: Page) {
  const root = page.locator(section);
  return {
    root,
    before: root.getByRole('button', { name: 'Before chart' }),
    summary: root.getByText('Show data table'),
    details: root.locator('details.ui-chart__data'),
    table: root.getByRole('table', { name: 'Monthly visits by channel' }),
  };
}

/** Real Tab, Enter and Space: the data table is reachable and operable. */
async function verifyKeyboard(page: Page) {
  const { before, summary, details, table } = chart(page);
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(summary, 'Tab reaches the summary').toBeFocused({ timeout });
  await expect(details).not.toHaveAttribute('open', '', { timeout });
  await expect(table).toBeHidden({ timeout });
  await page.keyboard.press('Enter');
  await expect(details, 'Enter opens').toHaveAttribute('open', '', {
    timeout,
  });
  await expect(table).toBeVisible({ timeout });
  await page.keyboard.press('Space');
  await expect(details, 'Space closes').not.toHaveAttribute('open', '', {
    timeout,
  });
  await expect(table).toBeHidden({ timeout });
  await page.keyboard.press('Space');
  await expect(table).toBeVisible({ timeout });
  // Leave the chart open state as found.
  await page.keyboard.press('Enter');
  await expect(table).toBeHidden({ timeout });
}

async function verifyFocusIndicator(page: Page, forcedColors: boolean) {
  const { before, summary } = chart(page);
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(summary).toBeFocused({ timeout });
  const style = await summary.evaluate((node) => {
    const computed = getComputedStyle(node);
    return {
      boxShadow: computed.boxShadow,
      outlineStyle: computed.outlineStyle,
      outlineWidth: Number.parseFloat(computed.outlineWidth),
    };
  });
  if (forcedColors) {
    expect(style.outlineStyle, 'forced-colors outline').toBe('solid');
    expect(style.outlineWidth).toBeGreaterThanOrEqual(2);
  } else {
    expect(
      style.boxShadow !== 'none' ||
        (style.outlineStyle !== 'none' && style.outlineWidth > 0),
      'focus indicator',
    ).toBe(true);
  }
}

/** Series are told apart by shape, and the shapes are visible in the theme. */
async function verifyMarkers(page: Page, forcedColors: boolean) {
  const shapes = await page
    .locator(markers)
    .evaluateAll((nodes) => nodes.map((node) => node.innerHTML));
  expect(shapes).toHaveLength(componentManifest.components.Chart.series.length);
  expect(new Set(shapes).size, 'distinct marker shapes').toBe(shapes.length);
  const colors = await measureRenderedColors(page, markers);
  expect(colors).toHaveLength(shapes.length);
  for (const marker of colors) {
    expect(marker.width).toBeGreaterThan(0);
    expect(
      marker.text,
      'series color against the chart background',
    ).toBeGreaterThanOrEqual(3);
  }
  // Solid shapes must paint with the series color; the ring paints a stroke.
  const paint = await page.locator(markers).evaluateAll((nodes) =>
    nodes.map((node) => {
      const shape = node.firstElementChild as SVGElement;
      const style = getComputedStyle(shape);
      return {
        fill: style.fill,
        stroke: style.stroke,
        strokeWidth: Number.parseFloat(style.strokeWidth),
        color: getComputedStyle(node).color,
      };
    }),
  );
  for (const [index, item] of paint.entries()) {
    const ring = index === paint.length - 1;
    if (ring) {
      expect(item.fill, 'ring is hollow').toBe('none');
      expect(item.stroke, 'ring stroke').toBe(item.color);
      expect(item.strokeWidth).toBeGreaterThan(0);
    } else {
      expect(item.fill, 'solid shape paint').toBe(item.color);
    }
  }
  if (forcedColors)
    expect(
      new Set(paint.map((item) => item.color)).size,
      'forced colors use one system color',
    ).toBe(1);
}

/** The shared fixture grid widens at 200% text, so the viewport is checked only at normal size. */
async function verifyReflow(page: Page, insideViewport = true) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const geometry = await page.evaluate((selector) => {
    const root = document.querySelector<HTMLElement>(`${selector} .ui-chart`);
    const box = root?.getBoundingClientRect();
    const nodes = [
      ...(root?.querySelectorAll<HTMLElement>(
        '.ui-chart__caption, .ui-chart__description, .ui-chart__plot, .ui-chart__legend, .ui-chart__legend-item, .ui-chart__data-summary',
      ) ?? []),
    ];
    return {
      viewport: document.documentElement.clientWidth,
      right: box?.right ?? 0,
      outside: nodes.some(
        (node) => node.getBoundingClientRect().right > (box?.right ?? 0) + 1,
      ),
      clipped: nodes.some((node) => node.scrollWidth > node.clientWidth + 1),
    };
  }, section);
  if (insideViewport)
    expect(
      geometry.right,
      'chart stays inside the viewport',
    ).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.outside, 'content outside chart').toBe(false);
  expect(geometry.clipped, 'clipped chart content').toBe(false);
}

async function verifyMotion(page: Page) {
  const read = () =>
    page
      .locator(`${section} .ui-chart`)
      .evaluate((node) =>
        getComputedStyle(node).getPropertyValue('--ui-chart-duration').trim(),
      );
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  expect(await read(), 'default duration').not.toBe('0s');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await read(), 'reduced-motion duration').toBe('0s');
}

test('[chart.keyboard-theme-motion] keyboard, series markers, theme, reflow and motion', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  const rules = componentManifest.components.Chart.qualityRules.filter(
    (rule) => rule.verification === 'browser',
  );
  const report = await evaluateQuality(rules, {
    'chart.keyboard-theme-motion': async () => {
      await page.locator(section).scrollIntoViewIfNeeded();
      const closed = await new AxeBuilder({ page }).include(section).analyze();
      await test.info().attach('chart-axe-closed', {
        body: JSON.stringify(closed),
        contentType: 'application/json',
      });
      expect(closed.violations).toEqual([]);
      expect(closed.incomplete).toEqual([]);
      await verifyMarkers(page, false);
      await verifyKeyboard(page);
      await verifyFocusIndicator(page, false);
      // Open state: the table is exposed and still passes rendered axe.
      await chart(page).summary.click();
      await expect(chart(page).table).toBeVisible({ timeout });
      const open = await new AxeBuilder({ page }).include(section).analyze();
      await test.info().attach('chart-axe-open', {
        body: JSON.stringify(open),
        contentType: 'application/json',
      });
      expect(open.violations).toEqual([]);
      expect(open.incomplete).toEqual([]);
      await chart(page).summary.click();
      await page.setViewportSize({ width: 320, height: 720 });
      await verifyReflow(page);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      await verifyReflow(page, false);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '';
      });
      await verifyMotion(page);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.emulateMedia({ forcedColors: 'active' });
      await verifyMarkers(page, true);
      await verifyFocusIndicator(page, true);
    },
  });
  await test.info().attach('chart-evidence', {
    body: JSON.stringify({
      browser: browser.version(),
      platform: process.platform,
      project: test.info().project.name,
      report,
    }),
    contentType: 'application/json',
  });
  expect(report.automatedPassed, formatQualityReport(report.results)).toBe(
    true,
  );
});

test('Chart detector rejects identical marker shapes', async ({ page }) => {
  await page.goto('/');
  await page.locator(markers).evaluateAll((nodes) => {
    for (const node of nodes) node.innerHTML = '<circle cx="6" cy="6" r="5" />';
  });
  await expect(verifyMarkers(page, false)).rejects.toThrow();
});

test('Chart detector rejects a low-contrast series color', async ({ page }) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `.ui-chart__marker--1 { --ui-chart-marker-color: color-mix(in srgb, var(--ui-color-surface) 90%, var(--ui-color-text)); }`,
  });
  await expect(verifyMarkers(page, false)).rejects.toThrow();
});

test('Chart detector rejects a vanished forced-colors focus ring', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} .ui-chart__data-summary:focus-visible { outline: none !important; box-shadow: none !important; }`,
  });
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(verifyFocusIndicator(page, true)).rejects.toThrow();
});

test('Chart detector rejects motion that ignores reduced motion', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content: '.ui-chart { --ui-chart-duration: 200ms !important; }',
  });
  await expect(verifyMotion(page)).rejects.toThrow();
});

test('Chart detector rejects a summary that does not open the table', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/');
  await page.locator(`${section} summary`).evaluate((node) => {
    node.addEventListener('click', (event) => event.preventDefault());
    node.addEventListener('keydown', (event) => event.preventDefault());
  });
  await expect(verifyKeyboard(page)).rejects.toThrow();
});

test('Chart detector rejects content that overflows at 320px', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} .ui-chart { inline-size: 600px !important; max-inline-size: none !important; }`,
  });
  await page.setViewportSize({ width: 320, height: 720 });
  await expect(verifyReflow(page)).rejects.toThrow();
});
