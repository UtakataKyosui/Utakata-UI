import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';

const ltr = 'section[aria-label="Navigation menu states"]';
const rtl = 'section[aria-label="Navigation menu states rtl"]';
const vertical = 'section[aria-label="Navigation menu vertical states"]';
// Known-invalid controls shorten this so detecting a failure stays cheap.
let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

function nav(page: Page, section: string) {
  const root = page.locator(section);
  return {
    before: root.getByRole('button', { name: 'Before navigation' }),
    after: root.getByRole('button', { name: 'After navigation' }),
    // Top-level links and triggers live in the section; panels are portaled.
    trigger: (name: string) => root.getByRole('button', { name, exact: true }),
    topLink: (name: string) => root.getByRole('link', { name, exact: true }),
    link: (name: string) => page.getByRole('link', { name, exact: true }),
    followed: root.getByLabel('Navigation followed'),
  };
}

async function expectClosed(page: Page, section: string, name: string) {
  const { trigger, link } = nav(page, section);
  await expect(trigger(name)).toHaveAttribute('aria-expanded', 'false', {
    timeout,
  });
  await expect(link('UI kit')).toHaveCount(0, { timeout });
  await expect(link('About')).toHaveCount(0, { timeout });
}

async function verifyKeyboard(page: Page, section: string) {
  const { before, after, trigger, topLink, link, followed } = nav(
    page,
    section,
  );
  await expect(
    page.getByRole('navigation', { name: /^Primary/ }).first(),
  ).toBeVisible();

  // Tab visits every link and trigger in order; none is skipped or roving.
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(topLink('Home')).toBeFocused({ timeout });
  await page.keyboard.press('Tab');
  await expect(trigger('Products')).toBeFocused({ timeout });
  await page.keyboard.press('Tab');
  await expect(trigger('Company')).toBeFocused({ timeout });
  await page.keyboard.press('Tab');
  await expect(trigger('Legacy')).toBeFocused({ timeout });
  await page.keyboard.press('Tab');
  await expect(topLink('Pricing')).toBeFocused({ timeout });
  await page.keyboard.press('Tab');
  await expect(after).toBeFocused({ timeout });
  await page.keyboard.press('Shift+Tab');
  await expect(topLink('Pricing')).toBeFocused({ timeout });

  // The disabled trigger exposes its state and never opens.
  await expect(trigger('Legacy')).toHaveAttribute('aria-disabled', 'true');
  await trigger('Legacy').focus();
  await page.keyboard.press('Enter');
  await expect(trigger('Legacy')).toHaveAttribute('aria-expanded', 'false', {
    timeout,
  });

  // Enter opens the panel and focus stays on the trigger.
  await trigger('Products').focus();
  await page.keyboard.press('Enter');
  await expect(trigger('Products')).toHaveAttribute('aria-expanded', 'true', {
    timeout,
  });
  await expect(link('UI kit')).toBeVisible({ timeout });
  await expect(trigger('Products')).toBeFocused();
  // Tab moves into the panel links and on to the next top-level trigger.
  await page.keyboard.press('Tab');
  await expect(link('UI kit')).toBeFocused({ timeout });
  await page.keyboard.press('Tab');
  await expect(link('Icons')).toBeFocused({ timeout });
  // Shift+Tab goes back through the panel to the trigger.
  await page.keyboard.press('Shift+Tab');
  await expect(link('UI kit')).toBeFocused({ timeout });
  await page.keyboard.press('Shift+Tab');
  await expect(trigger('Products')).toBeFocused({ timeout });
  // Escape closes the panel and keeps focus on the trigger.
  await page.keyboard.press('Escape');
  await expectClosed(page, section, 'Products');
  await expect(trigger('Products')).toBeFocused({ timeout });

  // Space opens too, and Escape from inside the panel restores trigger focus.
  await page.keyboard.press('Space');
  await expect(link('UI kit')).toBeVisible({ timeout });
  await page.keyboard.press('Tab');
  await expect(link('UI kit')).toBeFocused({ timeout });
  await page.keyboard.press('Escape');
  await expectClosed(page, section, 'Products');
  await expect(trigger('Products')).toBeFocused({ timeout });

  // Arrow keys move between triggers and Down opens a panel. Mirroring them
  // for right-to-left needs the Base UI DirectionProvider, which this
  // package does not re-export, so only the ltr fixture exercises them.
  if (section === ltr) {
    await page.keyboard.press('ArrowRight');
    await expect(trigger('Company')).toBeFocused({ timeout });
    await page.keyboard.press('ArrowDown');
    await expect(link('About')).toBeVisible({ timeout });
    await page.keyboard.press('ArrowLeft');
    await expect(trigger('Products')).toBeFocused({ timeout });
    await page.keyboard.press('Escape');
    await expectClosed(page, section, 'Company');
  }

  // Enter on a panel link follows it.
  await trigger('Products').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(link('UI kit')).toBeFocused({ timeout });
  await page.keyboard.press('Enter');
  await expect(followed).toHaveText('["UI kit"]', { timeout });
  await expect(page).toHaveURL(/#nav-ui$/, { timeout });
}

async function verifyDismiss(page: Page, section: string) {
  const { trigger, topLink, link, followed } = nav(page, section);
  // Clicking toggles the panel.
  await trigger('Company').click();
  await expect(link('About')).toBeVisible({ timeout });
  await expect(trigger('Company')).toHaveAttribute('aria-expanded', 'true', {
    timeout,
  });
  await trigger('Company').click();
  await expectClosed(page, section, 'Company');
  // An outside press closes without following any link.
  await trigger('Company').click();
  await expect(link('About')).toBeVisible({ timeout });
  await page.mouse.click(2, 2);
  await expectClosed(page, section, 'Company');
  await expect(followed).toHaveText('[]');
  // Escape after a click restores focus to the trigger.
  await trigger('Products').click();
  await expect(link('UI kit')).toBeVisible({ timeout });
  await page.keyboard.press('Escape');
  await expectClosed(page, section, 'Products');
  await expect(trigger('Products')).toBeFocused({ timeout });
  // A top-level link is followed directly and the current page is marked.
  await expect(topLink('Home')).toHaveAttribute('aria-current', 'page');
  await expect(topLink('Pricing')).not.toHaveAttribute('aria-current');
  await topLink('Pricing').click();
  await expect(followed).toHaveText('["Pricing"]', { timeout });
}

async function verifyPointer(page: Page, section: string) {
  const { trigger, link } = nav(page, section);
  // Hover opens the panel without a click.
  await trigger('Products').hover();
  await expect(link('UI kit')).toBeVisible({ timeout });
  await expect(trigger('Products')).toHaveAttribute('aria-expanded', 'true', {
    timeout,
  });
  // Moving the pointer from the trigger onto the panel keeps it open.
  const box = await link('UI kit').boundingBox();
  if (!box) throw new Error('The panel link has no box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: 12,
  });
  await page.waitForTimeout(400);
  await expect(link('UI kit')).toBeVisible({ timeout });
  await expect(trigger('Products')).toHaveAttribute('aria-expanded', 'true');
  // Moving to a neighbouring trigger switches the panel.
  await trigger('Company').hover();
  await expect(link('About')).toBeVisible({ timeout });
  await expect(link('UI kit')).toHaveCount(0, { timeout });
  // Leaving the navigation closes it.
  await page.mouse.move(2, 2, { steps: 8 });
  await expectClosed(page, section, 'Company');
}

async function verifyTouch(page: Page, section: string) {
  const { trigger, link, topLink, followed } = nav(page, section);
  const tap = async (locator: ReturnType<typeof trigger>) => {
    const box = await locator.boundingBox();
    if (!box) throw new Error('The target has no box');
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  };
  // The 2.5rem target stays at least 24 CSS px tall for touch.
  const height = (await trigger('Products').boundingBox())?.height ?? 0;
  expect(height).toBeGreaterThanOrEqual(24);
  await tap(trigger('Products'));
  await expect(link('UI kit')).toBeVisible({ timeout });
  await expect(trigger('Products')).toHaveAttribute('aria-expanded', 'true', {
    timeout,
  });
  // A second tap closes it.
  await tap(trigger('Products'));
  await expectClosed(page, section, 'Products');
  // A tap outside closes it.
  await tap(trigger('Company'));
  await expect(link('About')).toBeVisible({ timeout });
  await page.touchscreen.tap(2, 2);
  await expectClosed(page, section, 'Company');
  await expect(followed).toHaveText('[]');
  // A tap on a panel link follows it.
  await tap(trigger('Products'));
  await expect(link('Icons')).toBeVisible({ timeout });
  await tap(link('Icons'));
  await expect(followed).toHaveText('["Icons"]', { timeout });
  await expect(page).toHaveURL(/#nav-icons$/, { timeout });
  await tap(topLink('Pricing'));
  await expect(followed).toHaveText('["Icons","Pricing"]', { timeout });
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
  const { trigger, topLink, link } = nav(page, section);
  await page.emulateMedia({ forcedColors: 'active' });
  const expected = await systemColors(page);
  const read = (locator: ReturnType<typeof trigger>) =>
    locator.evaluate((node) => {
      const style = getComputedStyle(node);
      return { background: style.backgroundColor, color: style.color };
    });
  // The open trigger uses the Highlight system colors.
  await trigger('Products').focus();
  await page.keyboard.press('Enter');
  await expect(link('UI kit')).toBeVisible({ timeout });
  await expect
    .poll(() => read(trigger('Products')), { timeout })
    .toEqual(expected);
  await page.keyboard.press('Escape');
  await expectClosed(page, section, 'Products');
  // A focused trigger and a focused link keep a system-color outline.
  for (const target of [trigger('Products'), topLink('Pricing')]) {
    await target.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(target).toBeFocused({ timeout });
    const style = await target.evaluate((node) => {
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
  // The current page differs from other links without color.
  const decoration = (locator: ReturnType<typeof trigger>) =>
    locator.evaluate((node) => getComputedStyle(node).textDecorationLine);
  expect(await decoration(topLink('Home'))).toContain('underline');
  expect(await decoration(topLink('Pricing'))).not.toContain('underline');
}

async function runRule(
  page: Page,
  browser: { version(): string },
  id: string,
  body: () => Promise<void>,
) {
  const rules = componentManifest.components.NavigationMenu.qualityRules.filter(
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

test('[navigation-menu.keyboard] real Tab order, Enter/Space, Escape, arrows and link activation in ltr and rtl', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'navigation-menu.keyboard', async () => {
    await verifyKeyboard(page, ltr);
    // Reset focus, open state and the URL hash before the mirrored layout.
    await page.goto('/');
    await verifyKeyboard(page, rtl);
  });
});

test('[navigation-menu.pointer] hover, pointer path onto the panel, click toggle and outside press', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'navigation-menu.pointer', async () => {
    await verifyPointer(page, ltr);
    await verifyDismiss(page, ltr);
    await page.goto('/');
    await verifyPointer(page, rtl);
  });
});

test.describe('touch input', () => {
  test.use({ hasTouch: true });
  test('[navigation-menu.touch] tap opens, second tap and outside tap close, panel links follow', async ({
    page,
    browser,
  }) => {
    await page.goto('/');
    await runRule(page, browser, 'navigation-menu.touch', async () => {
      await verifyTouch(page, ltr);
    });
  });
});

test('[navigation-menu.forced-colors] open trigger, focus outline and current page in forced colors', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'navigation-menu.forced-colors', () =>
    verifyForced(page, ltr),
  );
});

test('NavigationMenu detector rejects a swallowed Escape', async ({ page }) => {
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
  await expect(verifyKeyboard(page, ltr)).rejects.toThrow();
});

test('NavigationMenu detector rejects swallowed trigger activation', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.evaluate(() => {
    document.addEventListener(
      'click',
      (event) => event.stopImmediatePropagation(),
      true,
    );
  });
  await expect(verifyKeyboard(page, ltr)).rejects.toThrow();
});

test('NavigationMenu detector rejects swallowed arrow navigation', async ({
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

test('NavigationMenu detector rejects a panel the pointer cannot enter', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  // A panel that cannot receive the pointer must not count as reachable.
  await page.addStyleTag({
    content:
      '.ui-navigation-menu__positioner { pointer-events: none !important; }',
  });
  await expect(verifyPointer(page, ltr)).rejects.toThrow();
});

test('NavigationMenu detector rejects an overridden open-trigger color', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.addStyleTag({
    content:
      '.ui-navigation-menu__trigger[data-popup-open] { background: Canvas !important; color: GrayText !important; }',
  });
  await expect(verifyForced(page, ltr)).rejects.toThrow();
});

test('NavigationMenu detector rejects a removed current-page cue', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.addStyleTag({
    content:
      '.ui-navigation-menu__link[data-active] { text-decoration: none !important; }',
  });
  await expect(verifyForced(page, ltr)).rejects.toThrow();
});
