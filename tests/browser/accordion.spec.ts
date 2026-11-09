import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';

const section = 'section[aria-label="Accordion states"]';
let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

function accordion(page: Page) {
  const root = page.locator(section);
  return {
    before: root.getByRole('button', { name: 'Before accordion' }),
    after: root.getByRole('button', { name: 'After accordion' }),
    account: root.getByRole('button', { name: 'Account', exact: true }),
    billing: root.getByRole('button', { name: 'Billing', exact: true }),
    archive: root.getByRole('button', { name: 'Archive', exact: true }),
    accountLink: root.getByRole('link', { name: 'Account link' }),
    billingLink: root.getByRole('link', { name: 'Billing link' }),
  };
}

async function verifyKeyboard(page: Page) {
  const { before, after, account, billing, archive, accountLink, billingLink } =
    accordion(page);
  await expect(archive).toBeDisabled();
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(account).toBeFocused({ timeout });
  await page.keyboard.press('Tab');
  await expect(billing).toBeFocused({ timeout });
  // The disabled Archive trigger is skipped by the real Tab order.
  await page.keyboard.press('Tab');
  await expect(after).toBeFocused({ timeout });
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(account).toBeFocused({ timeout });
  await expect(accountLink).toHaveCount(0);
  await page.keyboard.press('Enter');
  await expect(account).toHaveAttribute('aria-expanded', 'true', { timeout });
  await expect(accountLink).toBeVisible({ timeout });
  await expect(account).toBeFocused({ timeout });
  // The open panel's link joins the Tab order directly after its trigger.
  await page.keyboard.press('Tab');
  await expect(accountLink).toBeFocused({ timeout });
  await page.keyboard.press('Shift+Tab');
  await expect(account).toBeFocused({ timeout });
  await page.keyboard.press('Space');
  await expect(account).toHaveAttribute('aria-expanded', 'false', { timeout });
  await expect(account).toBeFocused({ timeout });
  await expect(accountLink).toHaveCount(0, { timeout });
  // With the panel closed, Tab goes straight to the next trigger.
  await page.keyboard.press('Tab');
  await expect(billing).toBeFocused({ timeout });
  await expect(billingLink).toHaveCount(0);
}

async function readIndicator(page: Page) {
  const { account } = accordion(page);
  return account.evaluate((node) => ({
    duration: getComputedStyle(node, '::after').transitionDuration,
    transform: getComputedStyle(node, '::after').transform,
  }));
}

async function verifyMotion(page: Page, reduced: boolean) {
  const { account } = accordion(page);
  const seconds = (value: string) =>
    Math.max(...value.split(',').map((part) => Number.parseFloat(part)));
  const closed = await readIndicator(page);
  if (reduced) expect(seconds(closed.duration), 'reduced motion').toBe(0);
  else expect(seconds(closed.duration), 'default motion').toBeGreaterThan(0);
  await account.click();
  await expect(account).toHaveAttribute('aria-expanded', 'true', { timeout });
  const panel = await page
    .locator(`${section} .ui-accordion__panel`)
    .first()
    .evaluate((node) => getComputedStyle(node).transitionDuration);
  if (reduced) expect(seconds(panel), 'reduced panel').toBe(0);
  else expect(seconds(panel), 'default panel').toBeGreaterThan(0);
  // The indicator rotates when opened, so the state does not rely on color.
  await expect
    .poll(async () => (await readIndicator(page)).transform, { timeout })
    .not.toBe(closed.transform);
  await account.click();
  await expect(account).toHaveAttribute('aria-expanded', 'false', { timeout });
}

async function verifyForcedFocus(page: Page) {
  const { before, account } = accordion(page);
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(account).toBeFocused({ timeout });
  const style = await account.evaluate((node) => {
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

async function runRule(
  page: Page,
  browser: { version(): string },
  id: string,
  body: () => Promise<void>,
) {
  const rules = componentManifest.components.Accordion.qualityRules.filter(
    (rule) => rule.id === id && rule.verification === 'browser',
  );
  expect(rules).toHaveLength(1);
  const report = await evaluateQuality(rules, {
    [id]: async () => {
      await page.locator(section).scrollIntoViewIfNeeded();
      // Axe runs first: forced-colors emulation makes its color checks meaningless.
      const axe = await new AxeBuilder({ page }).include(section).analyze();
      await test.info().attach(`${id}-axe`, {
        body: JSON.stringify(axe),
        contentType: 'application/json',
      });
      expect(axe.violations).toEqual([]);
      expect(axe.incomplete).toEqual([]);
      await body();
    },
  });
  await test.info().attach(`${id}-evidence`, {
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
}

test('[accordion.keyboard-focus] real Tab, Enter/Space, panel links and focus', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'accordion.keyboard-focus', () =>
    verifyKeyboard(page),
  );
});

test('[accordion.motion-forced] transitions, reduced motion, indicator and forced-colors focus', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'accordion.motion-forced', async () => {
    await verifyMotion(page, false);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await verifyMotion(page, true);
    await page.emulateMedia({
      reducedMotion: 'no-preference',
      forcedColors: 'active',
    });
    await verifyForcedFocus(page);
  });
});

test('Accordion detector rejects a disabled trigger that stays in the Tab order', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/');
  await accordion(page).archive.evaluate((node) => {
    node.removeAttribute('disabled');
    node.removeAttribute('data-disabled');
  });
  await expect(verifyKeyboard(page)).rejects.toThrow();
});

test('Accordion detector rejects motion under reduced motion', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/');
  await page.addStyleTag({
    content: `.ui-accordion__panel, .ui-accordion__trigger::after { transition: all 150ms ease !important; }`,
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(verifyMotion(page, true)).rejects.toThrow();
});

test('Accordion detector rejects a forced-colors focus ring that disappears', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} .ui-accordion__trigger:focus-visible { outline: none !important; box-shadow: none !important; }`,
  });
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(verifyForcedFocus(page)).rejects.toThrow();
});
