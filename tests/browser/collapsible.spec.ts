import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';

const section = 'section[aria-label="Collapsible states"]';
const timeout = 5000;

function collapsible(page: Page) {
  const root = page.locator(section);
  return {
    before: root.getByRole('button', { name: 'Before collapsible' }),
    after: root.getByRole('button', { name: 'After collapsible' }),
    trigger: root.getByRole('button', { name: 'Advanced settings' }),
    kept: root.getByRole('button', { name: 'Kept mounted' }),
    action: root.getByRole('button', { name: 'Panel action' }),
    hiddenAction: root.getByRole('button', {
      name: 'Hidden action',
      includeHidden: true,
    }),
  };
}

async function verifyKeyboard(page: Page) {
  const { before, after, trigger, kept, action, hiddenAction } =
    collapsible(page);
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(trigger).toBeFocused({ timeout });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false', { timeout });
  await expect(action).toHaveCount(0);
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true', { timeout });
  await expect(action).toBeVisible({ timeout });
  await expect(trigger).toBeFocused({ timeout });
  // Open content joins the real Tab order.
  await page.keyboard.press('Tab');
  await expect(action).toBeFocused({ timeout });
  await page.keyboard.press('Shift+Tab');
  await expect(trigger).toBeFocused({ timeout });
  await page.keyboard.press('Space');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false', { timeout });
  await expect(trigger).toBeFocused({ timeout });
  await expect(action).toHaveCount(0, { timeout });
  // A closed keepMounted panel stays in the DOM but is skipped by Tab.
  await expect(hiddenAction).toHaveCount(1);
  await page.keyboard.press('Tab');
  await expect(kept).toBeFocused({ timeout });
  await page.keyboard.press('Tab');
  await expect(after).toBeFocused({ timeout });
  // The focused trigger stays inside the viewport with a visible indicator.
  await trigger.focus();
  const box = await trigger.boundingBox();
  const viewport = page.viewportSize();
  expect(box && viewport).toBeTruthy();
  if (box && viewport) {
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  }
  const indicator = await trigger.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      boxShadow: style.boxShadow,
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
    };
  });
  expect(
    indicator.boxShadow !== 'none' ||
      (indicator.outlineStyle !== 'none' && indicator.outlineWidth > 0),
    'focus indicator',
  ).toBe(true);
}

async function readTransitions(page: Page) {
  const { trigger } = collapsible(page);
  return trigger.evaluate((node) => ({
    arrow: getComputedStyle(node, '::after').transitionDuration,
    arrowTransform: getComputedStyle(node, '::after').transform,
  }));
}

async function verifyMotion(page: Page, reduced: boolean) {
  const { trigger } = collapsible(page);
  const before = await readTransitions(page);
  const seconds = (value: string) =>
    Math.max(...value.split(',').map((part) => Number.parseFloat(part)));
  if (reduced) expect(seconds(before.arrow), 'reduced motion').toBe(0);
  else expect(seconds(before.arrow), 'default motion').toBeGreaterThan(0);
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true', { timeout });
  const panel = page.locator(`${section} .ui-collapsible__panel`).first();
  const panelTransition = await panel.evaluate(
    (node) => getComputedStyle(node).transitionDuration,
  );
  if (reduced) expect(seconds(panelTransition), 'reduced panel').toBe(0);
  else expect(seconds(panelTransition), 'default panel').toBeGreaterThan(0);
  // The indicator rotates when opened, so the state does not rely on color.
  await expect
    .poll(async () => (await readTransitions(page)).arrowTransform, { timeout })
    .not.toBe(before.arrowTransform);
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false', { timeout });
}

async function verifyForcedFocus(page: Page) {
  const { before, trigger } = collapsible(page);
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(trigger).toBeFocused({ timeout });
  const style = await trigger.evaluate((node) => {
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
  const rules = componentManifest.components.Collapsible.qualityRules.filter(
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

test('[collapsible.keyboard-focus] real Enter/Space, hidden content and focus', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'collapsible.keyboard-focus', () =>
    verifyKeyboard(page),
  );
});

test('[collapsible.motion-forced] transitions, reduced motion, indicator and forced-colors focus', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'collapsible.motion-forced', async () => {
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

test('Collapsible detector rejects a closed panel that stays reachable', async ({
  page,
}) => {
  await page.goto('/');
  // Force the closed keepMounted panel visible so its action joins the Tab order.
  await page.addStyleTag({
    content: `${section} .ui-collapsible__panel[hidden] { display: block !important; }`,
  });
  await expect(verifyKeyboard(page)).rejects.toThrow();
});

test('Collapsible detector rejects motion under reduced motion', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `.ui-collapsible__panel, .ui-collapsible__trigger::after { transition: all 150ms ease !important; }`,
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(verifyMotion(page, true)).rejects.toThrow();
});

test('Collapsible detector rejects a forced-colors focus ring that disappears', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} .ui-collapsible__trigger:focus-visible { outline: none !important; box-shadow: none !important; }`,
  });
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(verifyForcedFocus(page)).rejects.toThrow();
});
