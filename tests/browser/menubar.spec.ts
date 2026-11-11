import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';

const ltr = 'section[aria-label="Menubar states"]';
const rtl = 'section[aria-label="Menubar rtl states"]';
const vertical = 'section[aria-label="Menubar vertical states"]';
// Known-invalid controls shorten this so detecting a failure stays cheap.
let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

function bar(page: Page, section: string) {
  const root = page.locator(section);
  const trigger = (name: string) =>
    root.getByRole('menuitem', { name, exact: true });
  return {
    before: root.getByRole('button', { name: 'Before menubar' }),
    after: root.getByRole('button', { name: 'After menubar' }),
    trigger,
    menu: (name: string) => page.getByRole('menu', { name, exact: true }),
    item: (name: string) => page.getByRole('menuitem', { name, exact: true }),
    actions: root.getByLabel('Menubar actions'),
  };
}

// In right-to-left layout the horizontal arrows swap meaning.
function keys(section: string, mirrored = section === rtl) {
  return mirrored
    ? { next: 'ArrowLeft', previous: 'ArrowRight' }
    : { next: 'ArrowRight', previous: 'ArrowLeft' };
}

async function focusFile(page: Page, section: string) {
  const { before, trigger } = bar(page, section);
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(trigger('File')).toBeFocused({ timeout });
}

async function openFileMenu(page: Page, section: string) {
  const { trigger, menu } = bar(page, section);
  await focusFile(page, section);
  await page.keyboard.press('ArrowDown');
  await expect(menu('File')).toBeVisible({ timeout });
  await expect(trigger('File')).toHaveAttribute('aria-expanded', 'true', {
    timeout,
  });
  await expect(bar(page, section).item('New')).toBeFocused({ timeout });
}

async function verifyKeyboard(
  page: Page,
  section: string,
  mirrored = section === rtl,
) {
  const { trigger, menu, item, after } = bar(page, section);
  const { next, previous } = keys(section, mirrored);
  await focusFile(page, section);
  await expect(page.getByRole('menubar').first()).toBeVisible();
  // The bar is one Tab stop: Tab leaves it, it does not visit each trigger.
  await page.keyboard.press('Tab');
  await expect(after).toBeFocused({ timeout });
  await page.keyboard.press('Shift+Tab');
  await expect(trigger('File')).toBeFocused({ timeout });
  // Arrow keys rove between triggers, End/Home jump, and focus loops.
  await page.keyboard.press(next);
  await expect(trigger('Format')).toBeFocused({ timeout });
  await page.keyboard.press(previous);
  await expect(trigger('File')).toBeFocused({ timeout });
  await page.keyboard.press('End');
  await expect(trigger('Help')).toBeFocused({ timeout });
  await page.keyboard.press(next);
  await expect(trigger('File')).toBeFocused({ timeout });
  await page.keyboard.press(previous);
  await expect(trigger('Help')).toBeFocused({ timeout });
  await page.keyboard.press('Home');
  await expect(trigger('File')).toBeFocused({ timeout });
  // The disabled menu's trigger is skipped and cannot open.
  await page.keyboard.press(next);
  await page.keyboard.press(next);
  await expect(trigger('View')).toHaveAttribute('aria-disabled', 'true');
  await expect(trigger('View')).not.toBeFocused();
  await page.keyboard.press('Home');
  await expect(trigger('File')).toBeFocused({ timeout });

  // Down opens the menu and highlights the first item.
  await page.keyboard.press('ArrowDown');
  await expect(menu('File')).toBeVisible({ timeout });
  await expect(item('New')).toBeFocused({ timeout });
  // Disabled items stay reachable with arrow keys but cannot be activated.
  await page.keyboard.press('ArrowDown');
  await expect(item('Print')).toBeFocused({ timeout });
  await expect(item('Print')).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Enter');
  await expect(menu('File')).toBeVisible();
  await expect(bar(page, section).actions).toHaveText('[]', { timeout });
  await page.keyboard.press('ArrowDown');
  await expect(item('Export')).toBeFocused({ timeout });
  await page.keyboard.press('Home');
  await expect(item('New')).toBeFocused({ timeout });
  await page.keyboard.press('End');
  await expect(item('Export')).toBeFocused({ timeout });

  // Submenu: the "next" arrow opens it, the "previous" arrow closes it.
  await page.keyboard.press(next);
  await expect(menu('Export')).toBeVisible({ timeout });
  await expect(item('Email')).toBeFocused({ timeout });
  await page.keyboard.press('ArrowDown');
  await expect(item('Link')).toBeFocused({ timeout });
  await page.keyboard.press(previous);
  await expect(menu('Export')).toHaveCount(0, { timeout });
  await expect(item('Export')).toBeFocused({ timeout });
  await expect(menu('File')).toBeVisible();

  // While a menu is open the horizontal arrow keys move to the next menu.
  await page.keyboard.press('Home');
  await expect(item('New')).toBeFocused({ timeout });
  await page.keyboard.press(next);
  await expect(menu('Format')).toBeVisible({ timeout });
  await expect(menu('File')).toHaveCount(0, { timeout });
  await expect(trigger('Format')).toHaveAttribute('aria-expanded', 'true', {
    timeout,
  });
  await page.keyboard.press(previous);
  await expect(menu('File')).toBeVisible({ timeout });
  await expect(menu('Format')).toHaveCount(0, { timeout });
  await page.keyboard.press('Escape');
  await expect(menu('File')).toHaveCount(0, { timeout });
  await expect(trigger('File')).toBeFocused({ timeout });
}

async function verifyActivateDismiss(page: Page, section: string) {
  const { trigger, menu, item, actions } = bar(page, section);
  const { next } = keys(section);
  await openFileMenu(page, section);
  await page.keyboard.press('Enter');
  await expect(menu('File')).toHaveCount(0, { timeout });
  await expect(actions).toHaveText('["New"]', { timeout });
  await expect(trigger('File')).toBeFocused({ timeout });
  // Space on an item in another menu runs it once too.
  await page.keyboard.press(next);
  await expect(trigger('Format')).toBeFocused({ timeout });
  await page.keyboard.press('Enter');
  await expect(menu('Format')).toBeVisible({ timeout });
  await expect(item('Undo')).toBeFocused({ timeout });
  await page.keyboard.press('ArrowDown');
  await expect(item('Redo')).toBeFocused({ timeout });
  await page.keyboard.press('Space');
  await expect(menu('Format')).toHaveCount(0, { timeout });
  await expect(actions).toHaveText('["New","Redo"]', { timeout });
  await expect(trigger('Format')).toBeFocused({ timeout });
  // A submenu item closes every menu and returns focus to the top trigger.
  await page.keyboard.press('Home');
  await expect(trigger('File')).toBeFocused({ timeout });
  await page.keyboard.press('ArrowDown');
  await expect(item('New')).toBeFocused({ timeout });
  await page.keyboard.press('End');
  await expect(item('Export')).toBeFocused({ timeout });
  await page.keyboard.press(next);
  await expect(item('Email')).toBeFocused({ timeout });
  // Escape closes only the submenu and keeps focus in the parent menu.
  await page.keyboard.press('Escape');
  await expect(menu('Export')).toHaveCount(0, { timeout });
  await expect(menu('File')).toBeVisible();
  await expect(item('Export')).toBeFocused({ timeout });
  await page.keyboard.press(next);
  await expect(item('Email')).toBeFocused({ timeout });
  await page.keyboard.press('Enter');
  await expect(menu('Export')).toHaveCount(0, { timeout });
  await expect(menu('File')).toHaveCount(0, { timeout });
  await expect(actions).toHaveText('["New","Redo","Email"]', { timeout });
  await expect(trigger('File')).toBeFocused({ timeout });
  // Escape closes a menu without an action and restores focus to its trigger.
  await page.keyboard.press('ArrowDown');
  await expect(menu('File')).toBeVisible({ timeout });
  await page.keyboard.press('Escape');
  await expect(menu('File')).toHaveCount(0, { timeout });
  await expect(trigger('File')).toBeFocused({ timeout });
  await expect(actions).toHaveText('["New","Redo","Email"]');
  // An outside press closes it without an action.
  await page.keyboard.press('ArrowDown');
  await expect(menu('File')).toBeVisible({ timeout });
  await page.mouse.click(2, 2);
  await expect(menu('File')).toHaveCount(0, { timeout });
  await expect(actions).toHaveText('["New","Redo","Email"]');
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

async function verifyForced(page: Page, section: string) {
  const { trigger, item } = bar(page, section);
  await page.emulateMedia({ forcedColors: 'active' });
  await openFileMenu(page, section);
  const expected = await systemColors(page);
  const read = (locator: ReturnType<typeof item>) =>
    locator.evaluate((node) => {
      const style = getComputedStyle(node);
      return { background: style.backgroundColor, color: style.color };
    });
  // The highlighted item, highlighted disabled item and open trigger.
  await expect(item('New')).toBeFocused({ timeout });
  await expect.poll(() => read(item('New')), { timeout }).toEqual(expected);
  await page.keyboard.press('ArrowDown');
  await expect(item('Print')).toBeFocused({ timeout });
  await expect.poll(() => read(item('Print')), { timeout }).toEqual(expected);
  await expect.poll(() => read(trigger('File')), { timeout }).toEqual(expected);
  // The trigger keeps a visible outline in forced colors.
  await page.keyboard.press('Escape');
  await expect(trigger('File')).toBeFocused({ timeout });
  const style = await trigger('File').evaluate((node) => {
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
  const rules = componentManifest.components.Menubar.qualityRules.filter(
    (rule) => rule.id === id && rule.verification === 'browser',
  );
  expect(rules).toHaveLength(1);
  const report = await evaluateQuality(rules, {
    [id]: async () => {
      for (const section of [ltr, rtl, vertical]) {
        await page.locator(section).scrollIntoViewIfNeeded();
        const axe = await new AxeBuilder({ page }).include(section).analyze();
        await test.info().attach(`${id}-axe`, {
          body: JSON.stringify(axe),
          contentType: 'application/json',
        });
        expect(axe.violations).toEqual([]);
        expect(axe.incomplete).toEqual([]);
      }
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

test('[menubar.keyboard] real arrows, Home/End, submenu, disabled items in ltr and rtl', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'menubar.keyboard', async () => {
    await verifyKeyboard(page, ltr);
    // Reset focus and open state before the mirrored layout.
    await page.reload();
    await verifyKeyboard(page, rtl);
  });
});

test('[menubar.activate-dismiss] Enter/Space run once, Escape and outside press dismiss', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'menubar.activate-dismiss', async () => {
    await verifyActivateDismiss(page, ltr);
    await page.reload();
    await verifyActivateDismiss(page, rtl);
  });
});

test('[menubar.forced-highlight] highlighted items, open trigger and focused trigger in forced colors', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'menubar.forced-highlight', () =>
    verifyForced(page, ltr),
  );
});

test('Menubar detector rejects swallowed arrow navigation', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.evaluate(() => {
    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'ArrowRight') event.stopImmediatePropagation();
      },
      true,
    );
  });
  await expect(verifyKeyboard(page, ltr)).rejects.toThrow();
});

test('Menubar detector rejects a swallowed Escape', async ({ page }) => {
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
  await expect(verifyActivateDismiss(page, ltr)).rejects.toThrow();
});

test('Menubar detector rejects an overridden highlighted color', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.addStyleTag({
    content:
      '.ui-menubar__trigger[data-popup-open], .ui-menubar__trigger[data-highlighted] { background: Canvas !important; color: GrayText !important; }',
  });
  await expect(verifyForced(page, ltr)).rejects.toThrow();
});

test('Menubar detector rejects a reversed rtl arrow expectation', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  // The mirrored section must not behave like ltr: using ltr keys must fail.
  await expect(verifyKeyboard(page, rtl, false)).rejects.toThrow();
});
