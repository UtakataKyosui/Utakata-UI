import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import { measureOverflow, measureRenderedColors } from './rendered-colors.js';

const roots = 'section[aria-label="Alert states"] .ui-alert';
const texts =
  'section[aria-label="Alert states"] .ui-alert__title, section[aria-label="Alert states"] .ui-alert__description';
const count = componentManifest.components.Alert.variants.length * 2;

async function verifyLayout(page: Page) {
  const layout = await measureOverflow(page, roots);
  expect(layout.clipped, 'clipped content').toEqual(Array(count).fill(false));
  expect(layout.outside, 'content outside alert').toEqual(
    Array(count).fill(false),
  );
}

async function verifyColors(page: Page, forcedColors: boolean) {
  const items = await measureRenderedColors(page, texts);
  expect(items).toHaveLength(count * 2);
  for (const item of items)
    expect(item.text, 'text contrast').toBeGreaterThanOrEqual(4.5);
  if (!forcedColors) return;
  const alerts = await measureRenderedColors(page, roots);
  expect(alerts).toHaveLength(count);
  for (const alert of alerts) {
    expect(alert.borderWidth, 'forced-colors border').toBeGreaterThanOrEqual(1);
    expect(alert.borderStyle).toBe('solid');
    expect(
      alert.border,
      'forced-colors border contrast',
    ).toBeGreaterThanOrEqual(3);
  }
}

test('[alert.visual-theme] contrast, wrapping and forced colors for both variants', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  const measurements: unknown[] = [];
  const rules = componentManifest.components.Alert.qualityRules.filter(
    (rule) => rule.verification === 'browser',
  );
  const report = await evaluateQuality(rules, {
    'alert.visual-theme': async () => {
      await page
        .locator('section[aria-label="Alert states"]')
        .scrollIntoViewIfNeeded();
      await verifyLayout(page);
      await verifyColors(page, false);
      const axe = await new AxeBuilder({ page })
        .include('section[aria-label="Alert states"]')
        .analyze();
      await test.info().attach('alert-axe', {
        body: JSON.stringify(axe),
        contentType: 'application/json',
      });
      expect(axe.violations).toEqual([]);
      expect(axe.incomplete).toEqual([]);
      await page.setViewportSize({ width: 320, height: 720 });
      await verifyLayout(page);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      await verifyLayout(page);
      await verifyColors(page, false);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '';
      });
      await page.emulateMedia({ forcedColors: 'active' });
      await verifyColors(page, true);
      measurements.push({
        conditions: ['default', '320px', 'text-size-200', 'forced-colors'],
      });
    },
  });
  await test.info().attach('alert-evidence', {
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

test('Alert detector rejects low-contrast destructive text', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content:
      '.ui-alert--destructive { color: #ff9999 !important; --ui-alert-background: #ffffff; background: #ffffff !important; }',
  });
  await expect(verifyColors(page, false)).rejects.toThrow();
});

test('Alert detector rejects clipped non-wrapping content', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content:
      '.ui-alert[data-case="long"] { overflow-wrap: normal; white-space: nowrap; }',
  });
  await expect(verifyLayout(page)).rejects.toThrow();
});
