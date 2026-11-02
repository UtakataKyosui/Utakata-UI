import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import { measureRenderedColors } from './rendered-colors.js';

const section = 'section[aria-label="Tooltip states"]';
// Known-invalid controls shorten this so detecting a failure stays cheap.
let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

function tooltip(page: Page) {
  const root = page.locator(section);
  return {
    before: root.getByRole('button', { name: 'Before tooltip' }),
    after: root.getByRole('button', { name: 'After tooltip' }),
    save: root.getByRole('button', { name: 'Save', exact: true }),
    plain: root.getByRole('button', { name: 'Not hoverable', exact: true }),
    popup: page.getByRole('tooltip'),
  };
}

async function verifyFocusHoverEscape(page: Page) {
  const { before, save, popup, after } = tooltip(page);
  await expect(popup).toHaveCount(0);
  // Real keyboard focus opens the tooltip and describes the trigger.
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(save).toBeFocused({ timeout });
  await expect(popup).toBeVisible({ timeout });
  await expect(save).toHaveAccessibleDescription(/Saves the draft/, {
    timeout,
  });
  // Escape closes it without moving focus.
  await page.keyboard.press('Escape');
  await expect(popup).toHaveCount(0, { timeout });
  await expect(save).toBeFocused({ timeout });
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(after).toBeFocused({ timeout });
  // Real pointer hover opens it too, and leaving closes it.
  await page.mouse.move(0, 0);
  await save.hover();
  await expect(popup).toBeVisible({ timeout });
  await page.mouse.move(0, 0);
  await expect(popup).toHaveCount(0, { timeout });
}

async function travelOntoPopup(
  page: Page,
  trigger: ReturnType<typeof tooltip>['save'],
) {
  const { popup } = tooltip(page);
  await page.mouse.move(0, 0);
  await trigger.hover();
  await expect(popup).toBeVisible({ timeout });
  const from = await trigger.boundingBox();
  const to = await popup.boundingBox();
  expect(from && to).toBeTruthy();
  if (!from || !to) return false;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
    steps: 10,
  });
  // Give a non-hoverable popup time to close before sampling.
  await page.waitForTimeout(400);
  return (await popup.count()) > 0;
}

async function verifyHoverable(page: Page) {
  const { save, plain } = tooltip(page);
  expect(await travelOntoPopup(page, save), 'hoverable popup stays open').toBe(
    true,
  );
  await page.mouse.move(0, 0);
  await expect(tooltip(page).popup).toHaveCount(0, { timeout });
  // Known-invalid control: the omitted Base UI prop closes on the same input.
  expect(
    await travelOntoPopup(page, plain),
    'control closes when popup is not hoverable',
  ).toBe(false);
}

async function verifyVisuals(page: Page) {
  const { before, save, popup } = tooltip(page);
  await page.setViewportSize({ width: 320, height: 720 });
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(save).toBeFocused({ timeout });
  await expect(popup).toBeVisible({ timeout });
  const [item] = await measureRenderedColors(page, '[role="tooltip"]');
  expect(item).toBeTruthy();
  if (item) {
    expect(item.text, 'popup text contrast').toBeGreaterThanOrEqual(4.5);
    expect(item.left, 'popup left edge').toBeGreaterThanOrEqual(0);
    expect(item.right, 'popup right edge').toBeLessThanOrEqual(320);
  }
}

async function verifyForced(page: Page) {
  const { before, save, popup } = tooltip(page);
  await page.emulateMedia({ forcedColors: 'active' });
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(save).toBeFocused({ timeout });
  await expect(popup).toBeVisible({ timeout });
  const [item] = await measureRenderedColors(page, '[role="tooltip"]');
  expect(item).toBeTruthy();
  if (item) {
    expect(
      item.borderWidth,
      'forced-colors popup border',
    ).toBeGreaterThanOrEqual(1);
    expect(item.borderStyle).toBe('solid');
  }
  const style = await save.evaluate((node) => {
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
  const rules = componentManifest.components.Tooltip.qualityRules.filter(
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

test('[tooltip.focus-hover-escape] real focus, hover and Escape', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'tooltip.focus-hover-escape', () =>
    verifyFocusHoverEscape(page),
  );
});

test('[tooltip.hoverable] pointer travel onto the popup keeps it open', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'tooltip.hoverable', () =>
    verifyHoverable(page),
  );
});

test('[tooltip.visual-position] contrast, narrow viewport and forced colors', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'tooltip.visual-position', async () => {
    await verifyVisuals(page);
    await page.keyboard.press('Escape');
    await verifyForced(page);
  });
});

test('Tooltip detector rejects a swallowed Escape', async ({ page }) => {
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
  await expect(verifyFocusHoverEscape(page)).rejects.toThrow();
});

test('Tooltip detector rejects a forced-colors focus ring that disappears', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} .ui-tooltip__trigger:focus-visible { outline: none !important; box-shadow: none !important; }`,
  });
  await expect(verifyForced(page)).rejects.toThrow();
});
