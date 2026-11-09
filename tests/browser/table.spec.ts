import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';

const section = 'section[aria-label="Table states"]';
let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

function table(page: Page) {
  const root = page.locator(section);
  return {
    root,
    before: root.getByRole('button', { name: 'Before table' }),
    after: root.getByRole('button', { name: 'After table' }),
    region: root.getByRole('region', { name: 'Team members' }),
  };
}

async function verifyScrolling(page: Page) {
  const { region } = table(page);
  const geometry = await region.evaluate((node) => ({
    scrollWidth: node.scrollWidth,
    clientWidth: node.clientWidth,
    overflowX: getComputedStyle(node).overflowX,
    page: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
    tableWidth: node.querySelector('table')?.getBoundingClientRect().width ?? 0,
  }));
  expect(geometry.overflowX, 'container scrolls').toBe('auto');
  expect(geometry.scrollWidth, 'table is wider').toBeGreaterThan(
    geometry.clientWidth,
  );
  expect(geometry.tableWidth, 'table keeps its width').toBeGreaterThan(
    geometry.clientWidth,
  );
}

async function verifyKeyboardScroll(page: Page) {
  const { region, before, after } = table(page);
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(region).toBeFocused({ timeout });
  const start = await region.evaluate((node) => node.scrollLeft);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect
    .poll(() => region.evaluate((node) => node.scrollLeft), { timeout })
    .toBeGreaterThan(start);
  await page.keyboard.press('Tab');
  // The container holds no focusable descendants, so Tab leaves the table.
  await expect(after).toBeFocused({ timeout });
}

async function verifyFocusIndicator(page: Page, forcedColors: boolean) {
  const { region, before } = table(page);
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(region).toBeFocused({ timeout });
  const style = await region.evaluate((node) => {
    const computed = getComputedStyle(node);
    return {
      boxShadow: computed.boxShadow,
      outlineStyle: computed.outlineStyle,
      outlineWidth: Number.parseFloat(computed.outlineWidth),
    };
  });
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

test('[table.reflow-focus] scrolling container, keyboard scroll and focus indicator', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  const rules = componentManifest.components.Table.qualityRules.filter(
    (rule) => rule.verification === 'browser',
  );
  const report = await evaluateQuality(rules, {
    'table.reflow-focus': async () => {
      await page.locator(section).scrollIntoViewIfNeeded();
      await verifyScrolling(page);
      // Axe runs before the container is scrolled so cells are not partially obscured.
      const axe = await new AxeBuilder({ page }).include(section).analyze();
      await test.info().attach('table-axe', {
        body: JSON.stringify(axe),
        contentType: 'application/json',
      });
      expect(axe.violations).toEqual([]);
      expect(axe.incomplete).toEqual([]);
      await verifyKeyboardScroll(page);
      await verifyFocusIndicator(page, false);
      await page.setViewportSize({ width: 320, height: 720 });
      await verifyScrolling(page);
      await page.emulateMedia({ forcedColors: 'active' });
      await verifyFocusIndicator(page, true);
    },
  });
  await test.info().attach('table-evidence', {
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

test('Table detector rejects a container that does not scroll', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} .ui-table-container { overflow-x: visible !important; }`,
  });
  await expect(verifyScrolling(page)).rejects.toThrow();
});

test('Table detector rejects a forced-colors focus ring that disappears', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} .ui-table-container:focus-visible { outline: none !important; box-shadow: none !important; }`,
  });
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(verifyFocusIndicator(page, true)).rejects.toThrow();
});
