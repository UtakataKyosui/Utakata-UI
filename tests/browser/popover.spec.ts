import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import { measureRenderedColors } from './rendered-colors.js';

const section = 'section[aria-label="Popover states"]';
// Known-invalid controls shorten this so detecting a failure stays cheap.
let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

function popover(page: Page) {
  const root = page.locator(section);
  return {
    before: root.getByRole('button', { name: 'Before popover' }),
    after: root.getByRole('button', { name: 'After popover' }),
    trigger: root.getByRole('button', { name: 'Open options' }),
    dialog: page.getByRole('dialog', { name: 'Options' }),
    input: page.getByRole('textbox', { name: 'Name' }),
    close: page.getByRole('button', { name: 'Close options' }),
  };
}

async function openWithKeyboard(page: Page) {
  const { before, trigger, dialog } = popover(page);
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(trigger).toBeFocused({ timeout });
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true', { timeout });
  await expect(dialog).toBeVisible({ timeout });
  // Focus moves into the popup.
  await expect
    .poll(
      () =>
        page.evaluate(
          () => document.activeElement?.closest('[role="dialog"]') !== null,
        ),
      { timeout },
    )
    .toBe(true);
}

async function verifyOpenDismissFocus(page: Page) {
  const { trigger, dialog, input, close } = popover(page);
  await openWithKeyboard(page);
  // Pressing and typing inside does not close it.
  await input.click();
  await page.keyboard.type('x');
  await expect(input).toHaveValue('Ayax', { timeout });
  await expect(dialog).toBeVisible();
  // Close button closes it and restores focus.
  await close.click();
  await expect(dialog).toHaveCount(0, { timeout });
  await expect(trigger).toBeFocused({ timeout });
  // Escape closes it and restores focus.
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible({ timeout });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0, { timeout });
  await expect(trigger).toBeFocused({ timeout });
  // An outside press closes it and restores focus.
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible({ timeout });
  // The popup can overlap nearby controls, so press a fixed point outside it.
  await page.mouse.click(2, 2);
  await expect(dialog).toHaveCount(0, { timeout });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false', { timeout });
}

async function outline(locator: ReturnType<Page['locator']>) {
  return locator.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      style: style.outlineStyle,
      width: Number.parseFloat(style.outlineWidth),
    };
  });
}

async function verifyForcedFocus(page: Page) {
  const { trigger, dialog, input, close } = popover(page);
  await page.emulateMedia({ forcedColors: 'active' });
  await openWithKeyboard(page);
  const [popup] = await measureRenderedColors(page, '.ui-popover__popup');
  expect(popup).toBeTruthy();
  if (popup) {
    expect(
      popup.borderWidth,
      'forced-colors popup border',
    ).toBeGreaterThanOrEqual(1);
    expect(popup.borderStyle).toBe('solid');
  }
  // Focus moves with Tab through descendants; each must keep an outline.
  await input.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(input).toBeFocused({ timeout });
  for (const target of [input]) {
    const result = await outline(target);
    expect(result.style, 'popup descendant outline').toBe('solid');
    expect(
      result.width,
      'popup descendant outline width',
    ).toBeGreaterThanOrEqual(2);
  }
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused({ timeout });
  const closeOutline = await outline(close);
  expect(closeOutline.style, 'close outline').toBe('solid');
  expect(closeOutline.width).toBeGreaterThanOrEqual(2);
  // The popup itself can take focus (for example after a pointer press).
  await dialog.focus();
  const popupOutline = await outline(dialog);
  expect(popupOutline.style, 'popup outline').toBe('solid');
  expect(popupOutline.width).toBeGreaterThanOrEqual(2);
  // The trigger keeps its outline after the popup is dismissed.
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0, { timeout });
  await expect(trigger).toBeFocused({ timeout });
  const triggerOutline = await outline(trigger);
  expect(triggerOutline.style, 'trigger outline').toBe('solid');
  expect(triggerOutline.width).toBeGreaterThanOrEqual(2);
}

async function runRule(
  page: Page,
  browser: { version(): string },
  id: string,
  body: () => Promise<void>,
) {
  const rules = componentManifest.components.Popover.qualityRules.filter(
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

test('[popover.open-dismiss-focus] real Enter, Close, Escape and outside press', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'popover.open-dismiss-focus', () =>
    verifyOpenDismissFocus(page),
  );
});

test('[popover.forced-focus] focus outlines for trigger, popup and descendants in forced colors', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'popover.forced-focus', () =>
    verifyForcedFocus(page),
  );
});

test('Popover detector rejects a swallowed Escape', async ({ page }) => {
  await page.goto('/');
  timeout = 1000;
  await page.evaluate(() => {
    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape') event.stopImmediatePropagation();
      },
      true,
    );
  });
  await expect(verifyOpenDismissFocus(page)).rejects.toThrow();
});

test('Popover detector rejects forced-colors focus that disappears', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.addStyleTag({
    content: `.ui-popover__trigger:focus-visible, .ui-popover__popup :focus-visible, .ui-popover__popup:focus-visible { outline: none !important; box-shadow: none !important; }`,
  });
  await expect(verifyForcedFocus(page)).rejects.toThrow();
});
