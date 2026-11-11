import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';

const section = 'section[aria-label="Context menu states"]';
// Known-invalid controls shorten this so detecting a failure stays cheap.
let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

function menu(page: Page) {
  const root = page.locator(section);
  return {
    before: root.getByRole('button', { name: 'Before context menu' }),
    target: root.getByRole('button', { name: 'File area' }),
    menu: page.getByRole('menu', { name: 'File actions' }),
    item: (name: string) => page.getByRole('menuitem', { name, exact: true }),
    actions: root.getByLabel('Context menu actions'),
  };
}

type OpenKey = 'Shift+F10' | 'ContextMenu';

// Real keyboard: Tab to the focusable element inside the trigger area, then
// the platform keys that make the browser dispatch a contextmenu event.
async function openWithKeyboard(page: Page, key: OpenKey = 'Shift+F10') {
  const { before, target, menu: popup } = menu(page);
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(target).toBeFocused({ timeout });
  await page.keyboard.press(key);
  await expect(popup).toBeVisible({ timeout });
}

async function verifyKeyboardOpen(page: Page) {
  const { target, popup } = { ...menu(page), popup: menu(page).menu };
  for (const key of ['Shift+F10', 'ContextMenu'] as const) {
    await openWithKeyboard(page, key);
    await expect(
      popup.getByRole('menuitem').first(),
      `${key} opens a menu with items`,
    ).toBeVisible({ timeout });
    await page.keyboard.press('Escape');
    await expect(popup).toHaveCount(0, { timeout });
    await expect(target).toBeFocused({ timeout });
  }
}

async function verifyKeyboard(page: Page) {
  const { item, actions, menu: popup } = menu(page);
  await openWithKeyboard(page);
  await page.keyboard.press('ArrowDown');
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
  const { item, actions, menu: popup, target } = menu(page);
  await openWithKeyboard(page);
  await page.keyboard.press('Home');
  await expect(item('Edit')).toBeFocused({ timeout });
  await page.keyboard.press('Enter');
  await expect(popup).toHaveCount(0, { timeout });
  await expect(actions).toHaveText('["Edit"]', { timeout });
  await expect(target).toBeFocused({ timeout });
  // Space activates too, exactly once.
  await page.keyboard.press('Shift+F10');
  await expect(popup).toBeVisible({ timeout });
  await page.keyboard.press('Home');
  await expect(item('Edit')).toBeFocused({ timeout });
  await page.keyboard.press('ArrowDown');
  await expect(item('Duplicate')).toBeFocused({ timeout });
  await page.keyboard.press('Space');
  await expect(popup).toHaveCount(0, { timeout });
  await expect(actions).toHaveText('["Edit","Duplicate"]', { timeout });
  await expect(target).toBeFocused({ timeout });
  // Escape closes it without an action and restores focus.
  await page.keyboard.press('Shift+F10');
  await expect(popup).toBeVisible({ timeout });
  await page.keyboard.press('Escape');
  await expect(popup).toHaveCount(0, { timeout });
  await expect(target).toBeFocused({ timeout });
  await expect(actions).toHaveText('["Edit","Duplicate"]');
  // The pointer path (right click) opens the same menu.
  await target.click({ button: 'right' });
  await expect(popup).toBeVisible({ timeout });
  await page.keyboard.press('Escape');
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
  const { item } = menu(page);
  await page.emulateMedia({ forcedColors: 'active' });
  await openWithKeyboard(page);
  const expected = await systemColors(page);
  const read = (name: string) =>
    item(name).evaluate((node) => {
      const style = getComputedStyle(node);
      return { background: style.backgroundColor, color: style.color };
    });
  await page.keyboard.press('Home');
  await expect(item('Edit')).toBeFocused({ timeout });
  await expect.poll(() => read('Edit'), { timeout }).toEqual(expected);
  await page.keyboard.press('ArrowDown');
  await expect(item('Duplicate')).toBeFocused({ timeout });
  await page.keyboard.press('ArrowDown');
  await expect(item('Delete')).toBeFocused({ timeout });
  await expect.poll(() => read('Delete'), { timeout }).toEqual(expected);
}

async function runRule(
  page: Page,
  browser: { version(): string },
  id: string,
  body: () => Promise<void>,
) {
  const rules = componentManifest.components.ContextMenu.qualityRules.filter(
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

test('[context-menu.keyboard-open] Shift+F10 and the ContextMenu key open the menu from a focused element', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'context-menu.keyboard-open', () =>
    verifyKeyboardOpen(page),
  );
});

test('[context-menu.keyboard] real arrows, Home/End, typeahead and disabled items', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'context-menu.keyboard', () =>
    verifyKeyboard(page),
  );
});

test('[context-menu.activate-dismiss] Enter/Space run once, Escape dismisses and focus returns', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'context-menu.activate-dismiss', () =>
    verifyActivateDismiss(page),
  );
});

test('[context-menu.forced-highlight] highlighted and disabled-highlighted items in forced colors', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'context-menu.forced-highlight', () =>
    verifyForced(page),
  );
});

test('Context menu detector rejects a suppressed contextmenu event', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.evaluate(() => {
    document.addEventListener(
      'contextmenu',
      (event) => event.stopImmediatePropagation(),
      true,
    );
  });
  await expect(verifyKeyboardOpen(page)).rejects.toThrow();
});

test('Context menu detector rejects a swallowed Escape', async ({ page }) => {
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

test('Context menu detector rejects an overridden disabled-highlighted color', async ({
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
