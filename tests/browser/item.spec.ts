import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import { measureOverflow, measureRenderedColors } from './rendered-colors.js';

const section = 'section[aria-label="Item states"]';
const rows = `${section} .ui-item`;
let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

async function verifyLayout(page: Page) {
  const layout = await measureOverflow(page, rows);
  expect(layout.clipped, 'clipped content').toEqual([false, false, false]);
  expect(layout.outside, 'content outside item').toEqual([false, false, false]);
}

async function verifyTextAndMarks(page: Page) {
  const texts = await measureRenderedColors(
    page,
    [
      '.ui-item__title',
      '.ui-item__description',
      '.ui-item__meta',
      '.ui-item__link',
    ]
      .map((part) => `${section} ${part}`)
      .join(', '),
  );
  expect(texts.length).toBeGreaterThanOrEqual(8);
  for (const item of texts)
    expect(item.text, 'text contrast').toBeGreaterThanOrEqual(4.5);
  // A link is underlined, so it differs from static text without color.
  const decoration = await page.evaluate((query) => {
    const link = document.querySelector<HTMLElement>(
      `${query} .ui-item__link:not(.ui-item__button)`,
    );
    return link ? getComputedStyle(link).textDecorationLine : '';
  }, section);
  expect(decoration, 'link underline').toContain('underline');
}

async function verifyTargetSizes(page: Page) {
  const sizes = await page.evaluate((query) => {
    return [
      ...document.querySelectorAll<HTMLElement>(
        `${query} .ui-item__actions button`,
      ),
    ].map((node) => {
      const box = node.getBoundingClientRect();
      return [box.width, box.height];
    });
  }, section);
  expect(sizes).toHaveLength(2);
  for (const [width, height] of sizes) {
    expect(width, 'action width').toBeGreaterThanOrEqual(24);
    expect(height, 'action height').toBeGreaterThanOrEqual(24);
  }
}

async function verifyTabOrder(page: Page) {
  const scope = page.locator(section);
  await scope.getByRole('button', { name: 'Before item' }).focus();
  const order = [
    scope.getByRole('link', { name: /Quarterly_report/ }),
    scope.getByRole('button', { name: 'Edit report' }),
    scope.getByRole('button', { name: 'Delete report' }),
    scope.getByRole('button', { name: 'Open details' }),
    scope.getByRole('button', { name: 'After item' }),
  ];
  for (const target of order) {
    await page.keyboard.press('Tab');
    await expect(target).toBeFocused({ timeout });
  }
}

async function verifyFocusIndicator(page: Page, forcedColors: boolean) {
  const scope = page.locator(section);
  const link = scope.getByRole('link', { name: /Quarterly_report/ });
  await scope.getByRole('button', { name: 'Before item' }).focus();
  await page.keyboard.press('Tab');
  await expect(link).toBeFocused({ timeout });
  const style = await link.evaluate((node) => {
    const after = getComputedStyle(node, '::after');
    const root = node.closest('.ui-item') as HTMLElement;
    const rootBox = root.getBoundingClientRect();
    const box = node.getBoundingClientRect();
    return {
      boxShadow: after.boxShadow,
      outlineStyle: after.outlineStyle,
      outlineWidth: Number.parseFloat(after.outlineWidth),
      // The ring is drawn on a pseudo-element that spans the whole row.
      coversRow:
        after.position === 'absolute' &&
        rootBox.width > box.width &&
        getComputedStyle(root).position === 'relative',
    };
  });
  expect(style.coversRow, 'indicator around the whole row').toBe(true);
  if (forcedColors) {
    // Forced colors suppress box shadows, so an outline must remain.
    expect(style.outlineStyle, 'forced-colors outline').toBe('solid');
    expect(
      style.outlineWidth,
      'forced-colors outline width',
    ).toBeGreaterThanOrEqual(2);
  } else {
    expect(
      style.boxShadow !== 'none' ||
        (style.outlineStyle !== 'none' && style.outlineWidth > 0),
      'focus indicator',
    ).toBe(true);
  }
}

async function verifyPointer(page: Page) {
  const counts = page.locator(`${section} [data-testid="item-counts"]`);
  const row = page.locator(`${section} [data-case="button"]`);
  const box = await row.boundingBox();
  if (!box) throw new Error('Unverified: row has no box');
  // A click on the row padding activates the stretched primary button.
  await page.mouse.click(box.x + 4, box.y + 4);
  await expect(counts).toContainText('primary 1', { timeout });
  const linkRow = page.locator(`${section} [data-case="link"]`);
  await linkRow.getByRole('button', { name: 'Edit report' }).click({ timeout });
  // An action beside the stretched target runs only itself.
  await expect(counts).toContainText('primary 1 edit 1 delete 0', { timeout });
}

test('[item.layout-focus] wrapping, contrast, tab order, focus indicator, targets and pointer', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  const rules = componentManifest.components.Item.qualityRules.filter(
    (rule) => rule.verification === 'browser',
  );
  const report = await evaluateQuality(rules, {
    'item.layout-focus': async () => {
      await page.locator(section).scrollIntoViewIfNeeded();
      await verifyLayout(page);
      await verifyTextAndMarks(page);
      await verifyTargetSizes(page);
      const axe = await new AxeBuilder({ page }).include(section).analyze();
      await test.info().attach('item-axe', {
        body: JSON.stringify(axe),
        contentType: 'application/json',
      });
      expect(axe.violations).toEqual([]);
      expect(axe.incomplete).toEqual([]);
      await verifyTabOrder(page);
      await verifyFocusIndicator(page, false);
      await verifyPointer(page);
      await page.setViewportSize({ width: 320, height: 720 });
      await verifyLayout(page);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      await verifyLayout(page);
      await verifyTextAndMarks(page);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '';
      });
      await page.emulateMedia({ forcedColors: 'active' });
      await verifyFocusIndicator(page, true);
    },
  });
  await test.info().attach('item-evidence', {
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

test('Item detector rejects clipped non-wrapping content', async ({ page }) => {
  timeout = 1000;
  await page.goto('/');
  await page.addStyleTag({
    content: `${rows} { overflow-wrap: normal; white-space: nowrap; flex-wrap: nowrap; overflow: hidden; }`,
  });
  await expect(verifyLayout(page)).rejects.toThrow();
});

test('Item detector rejects a forced-colors focus ring that disappears', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} .ui-item__link:focus-visible::after { outline: none !important; box-shadow: none !important; }`,
  });
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(verifyFocusIndicator(page, true)).rejects.toThrow();
});

test('Item detector rejects actions covered by the stretched target', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} .ui-item__actions { position: static !important; z-index: auto !important; }`,
  });
  await expect(verifyPointer(page)).rejects.toThrow();
});

test('Item detector rejects links that lose their underline', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} .ui-item__link { text-decoration: none !important; }`,
  });
  await expect(verifyTextAndMarks(page)).rejects.toThrow();
});

test('Item detector rejects undersized action targets', async ({ page }) => {
  timeout = 1000;
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} .ui-item__actions button { inline-size: 12px !important; block-size: 12px !important; min-inline-size: 0 !important; min-block-size: 0 !important; padding: 0 !important; }`,
  });
  await expect(verifyTargetSizes(page)).rejects.toThrow();
});
