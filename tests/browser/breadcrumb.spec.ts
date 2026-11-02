import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import { measureOverflow, measureRenderedColors } from './rendered-colors.js';

const section = 'section[aria-label="Breadcrumb states"]';
const root = `${section} nav`;
const timeout = 5000;

async function verifyLayout(page: Page) {
  const layout = await measureOverflow(page, root);
  expect(layout.clipped, 'clipped content').toEqual([false]);
  expect(layout.outside, 'content outside breadcrumb').toEqual([false]);
}

async function verifyTextAndMarks(page: Page) {
  const links = await measureRenderedColors(
    page,
    `${section} .ui-breadcrumb__link, ${section} .ui-breadcrumb__page`,
  );
  expect(links).toHaveLength(3);
  for (const item of links)
    expect(item.text, 'text contrast').toBeGreaterThanOrEqual(4.5);
  // Links are underlined and the current page is not, so they differ without color.
  const decorations = await page.evaluate((query) => {
    const read = (selector: string) =>
      [...document.querySelectorAll<HTMLElement>(`${query} ${selector}`)].map(
        (node) => getComputedStyle(node).textDecorationLine,
      );
    return {
      links: read('.ui-breadcrumb__link'),
      page: read('.ui-breadcrumb__page'),
    };
  }, section);
  expect(decorations.links).toHaveLength(2);
  for (const line of decorations.links) expect(line).toContain('underline');
  expect(decorations.page).toHaveLength(1);
  for (const line of decorations.page) expect(line).not.toContain('underline');
}

async function verifyTabOrder(page: Page) {
  const home = page.locator(section).getByRole('link', { name: 'Home' });
  const catalog = page
    .locator(section)
    .getByRole('link', { name: /Catalog_of/ });
  await page
    .locator(section)
    .getByRole('button', { name: 'Before breadcrumb' })
    .focus();
  await page.keyboard.press('Tab');
  await expect(home).toBeFocused({ timeout });
  await page.keyboard.press('Tab');
  // The decorative separators and ellipsis are skipped.
  await expect(catalog).toBeFocused({ timeout });
  await page.keyboard.press('Tab');
  await expect(
    page.locator(section).getByRole('button', { name: 'After breadcrumb' }),
  ).toBeFocused({ timeout });
}

async function verifyFocusIndicator(page: Page, forcedColors: boolean) {
  const home = page.locator(section).getByRole('link', { name: 'Home' });
  await page
    .locator(section)
    .getByRole('button', { name: 'Before breadcrumb' })
    .focus();
  await page.keyboard.press('Tab');
  await expect(home).toBeFocused({ timeout });
  const style = await home.evaluate((node) => {
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

test('[breadcrumb.reflow-focus] wrapping, contrast, tab order and focus indicator', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  const rules = componentManifest.components.Breadcrumb.qualityRules.filter(
    (rule) => rule.verification === 'browser',
  );
  const report = await evaluateQuality(rules, {
    'breadcrumb.reflow-focus': async () => {
      await page.locator(section).scrollIntoViewIfNeeded();
      await verifyLayout(page);
      await verifyTextAndMarks(page);
      const axe = await new AxeBuilder({ page }).include(section).analyze();
      await test.info().attach('breadcrumb-axe', {
        body: JSON.stringify(axe),
        contentType: 'application/json',
      });
      expect(axe.violations).toEqual([]);
      expect(axe.incomplete).toEqual([]);
      await verifyTabOrder(page);
      await verifyFocusIndicator(page, false);
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
  await test.info().attach('breadcrumb-evidence', {
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

test('Breadcrumb detector rejects clipped non-wrapping content', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} .ui-breadcrumb__item { overflow-wrap: normal; white-space: nowrap; }
${section} .ui-breadcrumb__list { flex-wrap: nowrap; overflow: hidden; }`,
  });
  await expect(verifyLayout(page)).rejects.toThrow();
});

test('Breadcrumb detector rejects a forced-colors focus ring that disappears', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} .ui-breadcrumb__link:focus-visible { outline: none !important; box-shadow: none !important; }`,
  });
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(verifyFocusIndicator(page, true)).rejects.toThrow();
});

test('Breadcrumb detector rejects links that lose their underline', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} .ui-breadcrumb__link { text-decoration: none !important; }`,
  });
  await expect(verifyTextAndMarks(page)).rejects.toThrow();
});
