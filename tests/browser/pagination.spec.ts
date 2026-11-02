import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import { measureOverflow, measureRenderedColors } from './rendered-colors.js';

const section = 'section[aria-label="Pagination states"]';
const timeout = 5000;

function pagination(page: Page) {
  const root = page.locator(section);
  const link = (name: string) => root.getByRole('link', { name, exact: true });
  return {
    before: root.getByRole('button', { name: 'Before pagination' }),
    after: root.getByRole('button', { name: 'After pagination' }),
    previous: link('Previous'),
    one: link('1'),
    two: link('2'),
    nine: link('9'),
    next: link('Next'),
    clicks: root.getByLabel('Pagination clicks'),
  };
}

async function verifyKeyboardAndDisabled(page: Page) {
  const { before, after, previous, one, two, nine, next, clicks } =
    pagination(page);
  await expect(previous).toHaveAttribute('aria-disabled', 'true');
  await expect(previous).not.toHaveAttribute('href');
  await before.focus();
  await page.keyboard.press('Tab');
  // The disabled Previous link is skipped by the real Tab order.
  await expect(one).toBeFocused({ timeout });
  await page.keyboard.press('Tab');
  await expect(two).toBeFocused({ timeout });
  await page.keyboard.press('Tab');
  await expect(nine).toBeFocused({ timeout });
  await page.keyboard.press('Tab');
  await expect(next).toBeFocused({ timeout });
  await page.keyboard.press('Tab');
  await expect(after).toBeFocused({ timeout });
  await page.keyboard.press('Shift+Tab');
  await expect(next).toBeFocused({ timeout });
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(two).toBeFocused({ timeout });
  await page.keyboard.press('Enter');
  await expect
    .poll(() => page.evaluate(() => location.hash), { timeout })
    .toBe('#page-2');
  const hash = await page.evaluate(() => location.hash);
  await previous.click({ force: true });
  await page.keyboard.press('Enter');
  await expect(clicks).toHaveText('0', { timeout });
  expect(await page.evaluate(() => location.hash)).toBe(hash);
}

async function verifyTargetsAndMarks(page: Page) {
  const links = await measureRenderedColors(
    page,
    `${section} .ui-pagination__link`,
  );
  const ellipsis = await measureRenderedColors(
    page,
    `${section} .ui-pagination__ellipsis`,
  );
  expect(links).toHaveLength(5);
  expect(ellipsis).toHaveLength(1);
  for (const item of [...links, ...ellipsis]) {
    expect(
      item.clientWidth + item.borderWidth * 2,
      'target width',
    ).toBeGreaterThanOrEqual(24);
    expect(
      item.clientHeight + item.borderWidth * 2,
      'target height',
    ).toBeGreaterThanOrEqual(24);
  }
  // Order: Previous (disabled), 1 (current), 2, 9, Next.
  const [previous, current, ...others] = links;
  expect(previous && current).toBeTruthy();
  if (!previous || !current) return;
  for (const link of [current, ...others])
    expect(link.text, 'link text contrast').toBeGreaterThanOrEqual(4.5);
  for (const link of others)
    expect(current.borderWidth, 'current page border').toBeGreaterThan(
      link.borderWidth,
    );
  expect(previous.borderStyle, 'disabled border style').toBe('dashed');
  for (const link of [current, ...others])
    expect(link.borderStyle).not.toBe('dashed');
  const weights = await page.evaluate((query) => {
    const read = (selector: string) =>
      [...document.querySelectorAll<HTMLElement>(`${query} ${selector}`)].map(
        (node) => Number.parseInt(getComputedStyle(node).fontWeight, 10),
      );
    return {
      current: read('.ui-pagination__link[aria-current="page"]'),
      others: read('.ui-pagination__link:not([aria-current="page"])'),
    };
  }, section);
  expect(weights.current).toHaveLength(1);
  for (const weight of weights.others)
    expect(weights.current[0], 'current page weight').toBeGreaterThan(weight);
}

async function verifyLayout(page: Page) {
  const layout = await measureOverflow(page, `${section} .ui-pagination`);
  expect(layout.clipped, 'clipped content').toEqual([false]);
  expect(layout.outside, 'content outside list').toEqual([false]);
}

async function verifyForcedFocus(page: Page) {
  const { before, one } = pagination(page);
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(one).toBeFocused({ timeout });
  const style = await one.evaluate((node) => {
    const computed = getComputedStyle(node);
    return {
      outlineStyle: computed.outlineStyle,
      outlineWidth: Number.parseFloat(computed.outlineWidth),
    };
  });
  // Forced colors suppress box shadows, so an outline must remain.
  expect(style.outlineStyle, 'forced-colors outline').toBe('solid');
  expect(
    style.outlineWidth,
    'forced-colors outline width',
  ).toBeGreaterThanOrEqual(2);
}

test('[pagination.disabled-direction] real Tab skips disabled controls and Enter navigates', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  const rules = componentManifest.components.Pagination.qualityRules.filter(
    (rule) => rule.id === 'pagination.disabled-direction',
  );
  const report = await evaluateQuality(rules, {
    'pagination.disabled-direction': async () => {
      await page.locator(section).scrollIntoViewIfNeeded();
      await verifyKeyboardAndDisabled(page);
      const axe = await new AxeBuilder({ page }).include(section).analyze();
      await test.info().attach('pagination-keyboard-axe', {
        body: JSON.stringify(axe),
        contentType: 'application/json',
      });
      expect(axe.violations).toEqual([]);
      expect(axe.incomplete).toEqual([]);
    },
  });
  await test.info().attach('pagination-keyboard-evidence', {
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

test('[pagination.target-reflow] targets, wrapping, non-color marks and forced-colors focus', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  const rules = componentManifest.components.Pagination.qualityRules.filter(
    (rule) => rule.id === 'pagination.target-reflow',
  );
  const report = await evaluateQuality(rules, {
    'pagination.target-reflow': async () => {
      await page.locator(section).scrollIntoViewIfNeeded();
      await verifyTargetsAndMarks(page);
      await verifyLayout(page);
      await page.setViewportSize({ width: 320, height: 720 });
      await verifyLayout(page);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      await verifyLayout(page);
      await verifyTargetsAndMarks(page);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '';
      });
      await page.emulateMedia({ forcedColors: 'active' });
      await verifyForcedFocus(page);
    },
  });
  await test.info().attach('pagination-reflow-evidence', {
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

test('Pagination detector rejects a disabled control that stays focusable', async ({
  page,
}) => {
  await page.goto('/');
  await pagination(page).previous.evaluate((node) => {
    node.setAttribute('tabindex', '0');
  });
  await expect(verifyKeyboardAndDisabled(page)).rejects.toThrow();
});

test('Pagination detector rejects marks that rely on color alone', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} .ui-pagination__link[aria-current="page"] { border-width: 1px !important; font-weight: 400 !important; }`,
  });
  await expect(verifyTargetsAndMarks(page)).rejects.toThrow();
});

test('Pagination detector rejects a forced-colors focus ring that disappears', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} .ui-pagination__link:focus-visible { outline: none !important; }`,
  });
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(verifyForcedFocus(page)).rejects.toThrow();
});
