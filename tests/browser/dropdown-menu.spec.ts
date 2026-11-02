import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';

const section = 'section[aria-label="Menu states"]';
// Known-invalid controls shorten this so detecting a failure stays cheap.
let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

function menu(page: Page) {
  const root = page.locator(section);
  const item = (name: string) =>
    page.getByRole('menuitem', { name, exact: true });
  return {
    before: root.getByRole('button', { name: 'Before menu' }),
    after: root.getByRole('button', { name: 'After menu' }),
    trigger: root.getByRole('button', { name: 'Actions' }),
    menu: page.getByRole('menu', { name: 'Actions' }),
    item,
    actions: root.getByLabel('Menu actions'),
  };
}

async function openWithKeyboard(page: Page) {
  const { before, trigger, menu: popup } = menu(page);
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(trigger).toBeFocused({ timeout });
  await page.keyboard.press('Enter');
  await expect(popup).toBeVisible({ timeout });
  await expect(trigger).toHaveAttribute('aria-expanded', 'true', { timeout });
}

async function verifyKeyboard(page: Page) {
  const { item, actions, menu: popup } = menu(page);
  await openWithKeyboard(page);
  // Opening may or may not pre-highlight, so anchor the highlight with Home.
  await page.keyboard.press('Home');
  await expect(item('Edit')).toBeFocused({ timeout });
  await page.keyboard.press('ArrowDown');
  await expect(item('Duplicate')).toBeFocused({ timeout });
  // Disabled items stay discoverable with arrow keys but cannot be activated.
  await page.keyboard.press('ArrowDown');
  await expect(item('Delete')).toBeFocused({ timeout });
  await expect(item('Delete')).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Enter');
  await expect(popup).toBeVisible();
  await expect(actions).toHaveText('[]', { timeout });
  await page.keyboard.press('End');
  await expect(item('Share')).toBeFocused({ timeout });
  await page.keyboard.press('Home');
  await expect(item('Edit')).toBeFocused({ timeout });
  await page.keyboard.type('s');
  await expect(item('Share')).toBeFocused({ timeout });
}

async function verifyActivateDismiss(page: Page) {
  const { item, actions, menu: popup, trigger, after } = menu(page);
  await openWithKeyboard(page);
  await page.keyboard.press('Home');
  await expect(item('Edit')).toBeFocused({ timeout });
  await page.keyboard.press('Enter');
  await expect(popup).toHaveCount(0, { timeout });
  await expect(actions).toHaveText('["Edit"]', { timeout });
  await expect(trigger).toBeFocused({ timeout });
  // Space activates too, exactly once.
  await page.keyboard.press('Enter');
  await expect(popup).toBeVisible({ timeout });
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowDown');
  await expect(item('Duplicate')).toBeFocused({ timeout });
  await page.keyboard.press('Space');
  await expect(popup).toHaveCount(0, { timeout });
  await expect(actions).toHaveText('["Edit","Duplicate"]', { timeout });
  await expect(trigger).toBeFocused({ timeout });
  // Escape closes it without an action.
  await page.keyboard.press('Enter');
  await expect(popup).toBeVisible({ timeout });
  await page.keyboard.press('Escape');
  await expect(popup).toHaveCount(0, { timeout });
  await expect(trigger).toBeFocused({ timeout });
  await expect(actions).toHaveText('["Edit","Duplicate"]');
  // An outside press closes it without an action.
  await page.keyboard.press('Enter');
  await expect(popup).toBeVisible({ timeout });
  await after.click();
  await expect(popup).toHaveCount(0, { timeout });
  await expect(actions).toHaveText('["Edit","Duplicate"]');
}

async function systemColors(page: Page) {
  return page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.backgroundColor = 'Highlight';
    probe.style.color = 'HighlightText';
    document.body.append(probe);
    const style = getComputedStyle(probe);
    const colors = { background: style.backgroundColor, color: style.color };
    probe.remove();
    return colors;
  });
}

async function verifyForced(page: Page) {
  const { trigger, item } = menu(page);
  await page.emulateMedia({ forcedColors: 'active' });
  await openWithKeyboard(page);
  const expected = await systemColors(page);
  const read = (name: string) =>
    item(name).evaluate((node) => {
      const style = getComputedStyle(node);
      return { background: style.backgroundColor, color: style.color };
    });
  // Highlighted item and highlighted disabled item both use the system pair.
  await page.keyboard.press('Home');
  await expect(item('Edit')).toBeFocused({ timeout });
  await expect.poll(() => read('Edit'), { timeout }).toEqual(expected);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(item('Delete')).toBeFocused({ timeout });
  await expect.poll(() => read('Delete'), { timeout }).toEqual(expected);
  // The trigger (a Button) keeps a visible outline in forced colors.
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused({ timeout });
  const style = await trigger.evaluate((node) => {
    const computed = getComputedStyle(node);
    return {
      outlineStyle: computed.outlineStyle,
      outlineWidth: Number.parseFloat(computed.outlineWidth),
    };
  });
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
  const rules = componentManifest.components.DropdownMenu.qualityRules.filter(
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

test('[dropdown-menu.keyboard] real arrows, Home/End, typeahead and disabled items', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'dropdown-menu.keyboard', () =>
    verifyKeyboard(page),
  );
});

test('[dropdown-menu.activate-dismiss] Enter/Space run once, Escape and outside press dismiss', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'dropdown-menu.activate-dismiss', () =>
    verifyActivateDismiss(page),
  );
});

test('[dropdown-menu.forced-highlight] highlighted and disabled-highlighted items and trigger in forced colors', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'dropdown-menu.forced-highlight', () =>
    verifyForced(page),
  );
});

test('Menu detector rejects a swallowed Escape', async ({ page }) => {
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
  await expect(verifyActivateDismiss(page)).rejects.toThrow();
});

test('Menu detector rejects an overridden disabled-highlighted color', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.addStyleTag({
    content:
      '.ui-dropdown-menu__item[data-disabled][data-highlighted] { background: Canvas !important; color: GrayText !important; }',
  });
  await expect(verifyForced(page)).rejects.toThrow();
});
