import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';

const section = 'section[aria-label="Toast states"]';
// Known-invalid controls shorten this so detecting a failure stays cheap.
let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

function toast(page: Page) {
  const root = page.locator(section);
  return {
    addTimed: root.getByRole('button', { name: 'Add timed toast' }),
    addPersistent: root.getByRole('button', { name: 'Add persistent toast' }),
    addMany: root.getByRole('button', { name: 'Add many toasts' }),
    undoCount: root.getByLabel('Undo count'),
    saved: page.getByText('Saved', { exact: true }),
    archived: page.getByText('Item archived'),
    undo: page.getByRole('button', { name: 'Undo' }),
    dismiss: page.getByRole('button', { name: 'Dismiss' }),
    viewport: page.getByRole('region', { name: 'Notifications' }),
  };
}

async function verifyPause(page: Page) {
  const { addTimed, saved, viewport } = toast(page);
  // The pointer over the toast pauses its 800ms timer.
  await addTimed.click();
  await expect(saved).toBeVisible({ timeout });
  await saved.hover();
  await page.waitForTimeout(1500);
  await expect(saved).toBeVisible();
  // Moving away resumes the timer and the toast goes away.
  await page.mouse.move(2, 2);
  await expect(saved).toHaveCount(0, { timeout });
  // Keyboard focus inside the viewport pauses it too.
  await addTimed.click();
  await expect(saved).toBeVisible({ timeout });
  await page.keyboard.press('F6');
  await expect(viewport).toBeFocused({ timeout });
  await page.waitForTimeout(1500);
  await expect(saved).toBeVisible();
  await page.mouse.click(2, 2);
  await expect(saved).toHaveCount(0, { timeout });
}

async function verifyCloseAction(page: Page) {
  const { addPersistent, archived, undo, dismiss, undoCount, viewport } =
    toast(page);
  await addPersistent.click();
  await expect(archived).toBeVisible({ timeout });
  // F6 enters the viewport, then Tab reaches the toast and its buttons.
  await page.keyboard.press('F6');
  await expect(viewport).toBeFocused({ timeout });
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(undo).toBeFocused({ timeout });
  await page.keyboard.press('Enter');
  await expect(undoCount).toHaveText('1', { timeout });
  await page.keyboard.press('Tab');
  await expect(dismiss).toBeFocused({ timeout });
  await page.keyboard.press('Enter');
  await expect(archived).toHaveCount(0, { timeout });
  // Space closes too.
  await addPersistent.click();
  await expect(archived).toBeVisible({ timeout });
  await page.keyboard.press('F6');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(dismiss).toBeFocused({ timeout });
  await page.keyboard.press('Space');
  await expect(archived).toHaveCount(0, { timeout });
  // Escape inside the toast closes it without running the action.
  await addPersistent.click();
  await expect(archived).toBeVisible({ timeout });
  await page.keyboard.press('F6');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Escape');
  await expect(archived).toHaveCount(0, { timeout });
  await expect(undoCount).toHaveText('1');
}

async function verifyLayout(page: Page) {
  const { addMany } = toast(page);
  await page.setViewportSize({ width: 320, height: 300 });
  await addMany.click();
  await expect(page.getByText('Notice 5')).toBeAttached({ timeout });
  const layout = await page.locator('.ui-toast__viewport').evaluate((node) => {
    const box = node.getBoundingClientRect();
    const toasts = [...node.querySelectorAll<HTMLElement>('.ui-toast')];
    return {
      top: box.top,
      bottom: box.bottom,
      height: window.innerHeight,
      scrollable: node.scrollHeight > node.clientHeight,
      overflowY: getComputedStyle(node).overflowY,
      shrunk: toasts.filter((item) => item.scrollHeight > item.clientHeight + 1)
        .length,
      count: toasts.length,
    };
  });
  expect(layout.count, 'toasts rendered').toBeGreaterThanOrEqual(5);
  expect(layout.top, 'viewport top stays on screen').toBeGreaterThanOrEqual(0);
  expect(layout.bottom, 'viewport bottom stays on screen').toBeLessThanOrEqual(
    layout.height,
  );
  expect(layout.scrollable, 'tall stack scrolls').toBe(true);
  expect(layout.overflowY).toBe('auto');
  expect(layout.shrunk, 'toasts keep their content height').toBe(0);
}

async function verifyForced(page: Page) {
  const { addPersistent, undo, dismiss, viewport } = toast(page);
  await page.emulateMedia({ forcedColors: 'active' });
  await addPersistent.click();
  await expect(undo).toBeAttached({ timeout });
  await page.keyboard.press('F6');
  await expect(viewport).toBeFocused({ timeout });
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  for (const [name, locator] of [
    ['Undo', undo],
    ['Dismiss', dismiss],
  ] as const) {
    if (name === 'Dismiss') await page.keyboard.press('Tab');
    await expect(locator).toBeFocused({ timeout });
    const style = await locator.evaluate((node) => {
      const computed = getComputedStyle(node);
      return {
        outlineStyle: computed.outlineStyle,
        outlineWidth: Number.parseFloat(computed.outlineWidth),
      };
    });
    // Forced colors suppress box shadows, so an outline must remain.
    expect(style.outlineStyle, `${name} outline`).toBe('solid');
    expect(style.outlineWidth, `${name} outline width`).toBeGreaterThanOrEqual(
      2,
    );
  }
}

async function runRule(
  page: Page,
  browser: { version(): string },
  id: string,
  body: () => Promise<void>,
) {
  const rules = componentManifest.components.Toast.qualityRules.filter(
    (rule) => rule.id === id && rule.verification === 'browser',
  );
  expect(rules).toHaveLength(1);
  const report = await evaluateQuality(rules, {
    [id]: async () => {
      await page.locator(section).scrollIntoViewIfNeeded();
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

test('[toast.pause-on-hover-focus] hover and F6 focus pause the dismiss timer', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'toast.pause-on-hover-focus', () =>
    verifyPause(page),
  );
});

test('[toast.close-action-keyboard] F6, Action, Close and Escape', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'toast.close-action-keyboard', () =>
    verifyCloseAction(page),
  );
});

test('[toast.viewport-layout] tall stacks stay on screen and forced-colors focus', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'toast.viewport-layout', async () => {
    await verifyLayout(page);
    await page.reload();
    await verifyForced(page);
  });
});

test('Toast detector rejects an unbounded viewport', async ({ page }) => {
  await page.goto('/');
  timeout = 1000;
  await page.addStyleTag({
    content:
      '.ui-toast__viewport { max-block-size: none !important; overflow-y: visible !important; } .ui-toast { flex-shrink: 1 !important; }',
  });
  await expect(verifyLayout(page)).rejects.toThrow();
});

test('Toast detector rejects a toast that disappears while hovered', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  // The toast hides after 900ms whatever the pointer does, as a timer that
  // ignores hover would.
  await page.addStyleTag({
    content:
      '@keyframes ui-test-gone { to { visibility: hidden; } } .ui-toast { animation: ui-test-gone 1ms 900ms forwards; }',
  });
  await expect(verifyPause(page)).rejects.toThrow();
});

test('Toast detector rejects forced-colors focus that disappears', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.addStyleTag({
    content:
      '.ui-toast__action:focus-visible, .ui-toast__close:focus-visible { outline: none !important; box-shadow: none !important; }',
  });
  await expect(verifyForced(page)).rejects.toThrow();
});
