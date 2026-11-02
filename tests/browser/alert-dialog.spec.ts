import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import { measureRenderedColors } from './rendered-colors.js';

const section = 'section[aria-label="AlertDialog states"]';
// Known-invalid controls shorten this so detecting a failure stays cheap.
let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

function alertDialog(page: Page) {
  const root = page.locator(section);
  return {
    before: root.getByRole('button', { name: 'Before alert dialog' }),
    trigger: root.getByRole('button', { name: 'Delete file' }),
    dialog: page.getByRole('alertdialog', { name: 'Delete file?' }),
    cancel: page.getByRole('button', { name: 'Cancel', exact: true }),
    confirm: page.getByRole('button', { name: 'Delete permanently' }),
    deletions: root.getByLabel('Deletions'),
  };
}

async function open(page: Page) {
  const { before, trigger, dialog } = alertDialog(page);
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(trigger).toBeFocused({ timeout });
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible({ timeout });
}

const insideDialog = (page: Page) =>
  page.evaluate(
    () => document.activeElement?.closest('[role="alertdialog"]') !== null,
  );

async function verifyContainment(page: Page) {
  const { dialog, cancel, confirm } = alertDialog(page);
  await open(page);
  // Focus starts on the least destructive action.
  await expect(cancel).toBeFocused({ timeout });
  await expect(dialog).toHaveAccessibleDescription('This cannot be undone.');
  await page.keyboard.press('Tab');
  await expect(confirm).toBeFocused({ timeout });
  // Tab at the end of the popup wraps inside it, never to the page behind.
  // Base UI's focus guards briefly hold focus before redirecting it, so the
  // focus must settle back inside the popup rather than be sampled instantly.
  for (const key of [
    'Tab',
    'Tab',
    'Tab',
    'Shift+Tab',
    'Shift+Tab',
    'Shift+Tab',
  ]) {
    await page.keyboard.press(key);
    await expect
      .poll(() => insideDialog(page), { timeout, message: key })
      .toBe(true);
  }
}

async function verifyDismissal(page: Page) {
  const { dialog, cancel, trigger, deletions } = alertDialog(page);
  await open(page);
  // A pointer press outside the popup does not close it.
  await page.mouse.click(2, 2);
  await expect(dialog).toBeVisible();
  await expect(deletions).toHaveText('0');
  // Cancel closes it and restores focus.
  await cancel.click();
  await expect(dialog).toHaveCount(0, { timeout });
  await expect(trigger).toBeFocused({ timeout });
  // Escape closes it and restores focus.
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible({ timeout });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0, { timeout });
  await expect(trigger).toBeFocused({ timeout });
  await expect(deletions).toHaveText('0');
}

async function verifyForced(page: Page) {
  const { cancel, confirm } = alertDialog(page);
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const [popup] = await measureRenderedColors(page, '.ui-alert-dialog__popup');
  expect(popup).toBeTruthy();
  if (popup) {
    expect(
      popup.borderWidth,
      'forced-colors popup border',
    ).toBeGreaterThanOrEqual(1);
    expect(popup.borderStyle).toBe('solid');
  }
  await expect(cancel).toBeFocused({ timeout });
  for (const [name, locator] of [
    ['Cancel', cancel],
    ['Delete permanently', confirm],
  ] as const) {
    if (name === 'Delete permanently') await page.keyboard.press('Tab');
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
  const rules = componentManifest.components.AlertDialog.qualityRules.filter(
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

test('[alert-dialog.initial-focus-containment] real Tab keeps focus inside and starts on Cancel', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'alert-dialog.initial-focus-containment', () =>
    verifyContainment(page),
  );
});

test('[alert-dialog.dismissal-focus-return] Cancel and Escape close, outside press does not', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'alert-dialog.dismissal-focus-return', () =>
    verifyDismissal(page),
  );
});

test('[alert-dialog.forced-focus] popup border and focus outlines in forced colors', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'alert-dialog.forced-focus', () =>
    verifyForced(page),
  );
});

test('AlertDialog detector rejects a focus trap that lets Tab escape', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  // Make the page behind the popup focusable and reachable again.
  await page.evaluate(() => {
    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key !== 'Tab') return;
        event.preventDefault();
        event.stopImmediatePropagation();
        (document.querySelector('main button') as HTMLElement | null)?.focus();
      },
      true,
    );
  });
  await expect(verifyContainment(page)).rejects.toThrow();
});

test('AlertDialog detector rejects forced-colors focus that disappears', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.addStyleTag({
    content:
      '.ui-dialog__popup :focus-visible { outline: none !important; box-shadow: none !important; }',
  });
  await expect(verifyForced(page)).rejects.toThrow();
});
