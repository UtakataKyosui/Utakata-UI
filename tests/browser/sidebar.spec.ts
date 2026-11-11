import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import { measureOverflow } from './rendered-colors.js';

const section = 'section[aria-label="Sidebar states"]';
const wide = { width: 1280, height: 720 };
const narrow = { width: 600, height: 800 };
// Known-invalid controls shorten this so detecting a failure stays cheap.
let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

function parts(page: Page) {
  const root = page.locator(section);
  return {
    before: root.getByRole('button', { name: 'Before sidebar' }),
    after: root.getByRole('button', { name: 'After sidebar' }),
    // Not by role: the open modal hides the page behind it from the tree.
    trigger: root.locator('button[aria-label="Toggle navigation"]'),
    nav: page.getByRole('navigation', { name: 'Fixture navigation' }),
    link: (name: string) => page.getByRole('link', { name, exact: true }),
    dialog: page.getByRole('dialog', { name: 'Fixture navigation' }),
    close: page.getByRole('button', { name: 'Close menu' }),
  };
}

const linkNames = [
  'Overview',
  'Settings',
  'Internationalization_and_localization_configuration_overview',
  'アクセシビリティと多言語対応の設定をまとめて確認するページ',
  'Profile',
];

async function axeScan(
  page: Page,
  label: string,
  include = section,
  exclude: string[] = [],
) {
  const builder = new AxeBuilder({ page }).include(include);
  for (const selector of exclude) builder.exclude(selector);
  const axe = await builder.analyze();
  await test.info().attach(`sidebar-${label}-axe`, {
    body: JSON.stringify(axe),
    contentType: 'application/json',
  });
  expect(axe.violations, `${label} axe violations`).toEqual([]);
  expect(axe.incomplete, `${label} axe incomplete`).toEqual([]);
}

/** Waits until the sheet slide transition has finished so geometry is final. */
async function settled(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const popup = document.querySelector('.ui-sidebar__sheet');
          return (
            popup !== null &&
            !popup.hasAttribute('data-starting-style') &&
            popup.getAnimations().length === 0
          );
        }),
      { timeout },
    )
    .toBe(true);
}

async function verifyKeyboard(page: Page) {
  await page.setViewportSize(wide);
  const { before, trigger, nav, link, after } = parts(page);
  await expect(nav).toBeVisible({ timeout });
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(trigger).toHaveAttribute(
    'aria-controls',
    (await nav.getAttribute('id')) ?? 'missing',
  );
  await axeScan(page, 'expanded');
  await before.focus();
  for (const name of linkNames) {
    await page.keyboard.press('Tab');
    await expect(link(name), `${name} focus`).toBeFocused({ timeout });
  }
  await page.keyboard.press('Tab');
  await expect(trigger).toBeFocused({ timeout });
  // Collapse with Enter: links leave the tree and Tab order, focus stays.
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false', { timeout });
  await expect(nav).toHaveCount(0, { timeout });
  await expect(link('Overview')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(
    await page
      .locator('.ui-sidebar')
      .evaluate((node) => node.hasAttribute('hidden')),
    'collapsed sidebar is hidden',
  ).toBe(true);
  await axeScan(page, 'collapsed');
  await page.keyboard.press('Shift+Tab');
  await expect(before, 'collapsed links are skipped').toBeFocused({ timeout });
  await page.keyboard.press('Tab');
  await expect(trigger).toBeFocused({ timeout });
  await page.keyboard.press('Tab');
  await expect(after).toBeFocused({ timeout });
  await trigger.focus();
  await page.keyboard.press('Space');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true', { timeout });
  await expect(nav).toBeVisible({ timeout });
  // A link activates with Enter.
  await link('Settings').focus();
  await page.keyboard.press('Enter');
  await expect
    .poll(() => page.evaluate(() => location.hash), { timeout })
    .toBe('#sidebar-settings');
  await page.evaluate(() => {
    location.hash = '';
  });
}

async function verifyResponsive(page: Page) {
  const { trigger, nav, dialog, close, link } = parts(page);
  // Focus inside the persistent sidebar survives narrowing.
  await page.setViewportSize(wide);
  await link('Settings').focus();
  await page.setViewportSize(narrow);
  await expect(nav).toHaveCount(0, { timeout });
  await expect(trigger, 'focus moves to the trigger').toBeFocused({ timeout });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).not.toHaveAttribute('aria-controls');

  const backdrop = { x: narrow.width - 4, y: narrow.height / 2 };
  for (const how of ['Escape', 'Close', 'backdrop'] as const) {
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible({ timeout });
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect
      .poll(
        () =>
          page.evaluate(
            () => document.activeElement?.closest('[role="dialog"]') !== null,
          ),
        { timeout },
      )
      .toBe(true);
    if (how === 'Escape') {
      await settled(page);
      // axe reports color-contrast as incomplete (partially obscured) for text
      // that wraps over several lines inside the fixed, scrolling sheet, so the
      // two wrapping links are excluded here. They share the styles of the
      // scanned links, and the wide scan above covers them while wrapping.
      await axeScan(page, 'narrow-open', '[role="dialog"]', [
        'a[href$="#sidebar-long"]',
        'a[href$="#sidebar-japanese"]',
      ]);
      await page.keyboard.press('Escape');
    } else if (how === 'Close') await close.click();
    else await page.mouse.click(backdrop.x, backdrop.y);
    await expect(dialog, `${how} closes`).toHaveCount(0, { timeout });
    await expect(trigger, `${how} returns focus`).toBeFocused({ timeout });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  }

  // Widening while the sheet is open and focused returns to the inline sidebar.
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible({ timeout });
  await link('Profile').focus();
  await page.setViewportSize(wide);
  await expect(dialog).toHaveCount(0, { timeout });
  await expect(nav).toBeVisible({ timeout });
  await expect(trigger, 'focus moves to the trigger').toBeFocused({ timeout });
  // Narrowing again starts closed.
  await page.setViewportSize(narrow);
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await page.setViewportSize(wide);
}

async function verifyReflowForced(page: Page) {
  const { trigger, dialog, link } = parts(page);
  // Wide layout with 200% root text and long English and Japanese labels.
  await page.setViewportSize(wide);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  const wideOverflow = await measureOverflow(page, `${section} .ui-sidebar`);
  expect(wideOverflow.clipped, 'wide clipped content').toEqual([false]);
  expect(await pageOverflow(page), 'wide page overflow').toBe(false);

  // Narrow sheet at 320 CSS px.
  await page.setViewportSize({ width: 320, height: 560 });
  const widthBefore = await pageScrollWidth(page);
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible({ timeout });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect(
    await pageScrollWidth(page),
    'narrow page overflow caused by the sheet',
  ).toBeLessThanOrEqual(widthBefore);
  const sheet = await measureOverflow(page, '[role="dialog"] nav');
  expect(sheet.clipped, 'sheet clipped content').toEqual([false]);
  const popup = await dialog.evaluate((node) => ({
    scrollWidth: node.scrollWidth,
    clientWidth: node.clientWidth,
  }));
  expect(popup.scrollWidth, 'sheet horizontal overflow').toBeLessThanOrEqual(
    popup.clientWidth + 1,
  );
  // The last link stays reachable by Tab inside the scrolling popup.
  const last = link(linkNames[linkNames.length - 1] as string);
  await last.focus();
  await expect(last).toBeInViewport({ timeout });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0, { timeout });
  await page.setViewportSize(wide);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '';
  });

  // The current link differs without color: bold with an inline-start bar.
  const marks = await page.evaluate(() => {
    const read = (name: string) => {
      const node = [
        ...document.querySelectorAll<HTMLElement>('.ui-sidebar__menu-button'),
      ].find((candidate) => candidate.textContent === name);
      if (!node) return null;
      const style = getComputedStyle(node);
      return {
        weight: Number.parseInt(style.fontWeight, 10),
        barWidth: Number.parseFloat(style.borderInlineStartWidth),
        barColor: style.borderInlineStartColor,
        current: node.getAttribute('aria-current'),
      };
    };
    return { current: read('Overview'), other: read('Settings') };
  });
  expect(marks.current?.current).toBe('page');
  expect(marks.other?.current).toBeNull();
  expect(marks.current?.weight).toBeGreaterThanOrEqual(700);
  expect(marks.other?.weight).toBeLessThan(600);
  expect(marks.current?.barWidth).toBeGreaterThanOrEqual(3);
  expect(marks.current?.barColor).not.toBe(marks.other?.barColor);

  // Forced colors: focused controls keep an outline and the marker stays.
  await page.emulateMedia({ forcedColors: 'active' });
  for (const target of [link('Overview'), link('Settings'), trigger]) {
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
    expect(style.outlineStyle, 'forced outline style').toBe('solid');
    expect(style.outlineWidth, 'forced outline width').toBeGreaterThanOrEqual(
      2,
    );
  }
  const forcedBar = await link('Overview').evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      style: style.borderInlineStartStyle,
      width: Number.parseFloat(style.borderInlineStartWidth),
    };
  });
  expect(forcedBar.style).toBe('solid');
  expect(forcedBar.width).toBeGreaterThanOrEqual(3);
}

function pageScrollWidth(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth);
}

function pageOverflow(page: Page) {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1,
  );
}

async function runRule(
  page: Page,
  browser: { version(): string },
  id: string,
  body: () => Promise<void>,
) {
  const rules = componentManifest.components.Sidebar.qualityRules.filter(
    (rule) => rule.id === id && rule.verification === 'browser',
  );
  expect(rules).toHaveLength(1);
  const report = await evaluateQuality(rules, {
    [id]: async () => {
      await page.locator(section).scrollIntoViewIfNeeded();
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

test('[sidebar.keyboard] real Tab, Enter and Space operate the expanded and collapsed sidebar', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'sidebar.keyboard', () => verifyKeyboard(page));
});

test('[sidebar.responsive-focus] the narrow sheet opens, dismisses and keeps focus across the breakpoint', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'sidebar.responsive-focus', () =>
    verifyResponsive(page),
  );
});

test('[sidebar.reflow-forced] reflow, current marker and forced-colors focus', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'sidebar.reflow-forced', () =>
    verifyReflowForced(page),
  );
});

test('Sidebar detector rejects a collapsed sidebar that stays in the Tab order', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.addStyleTag({
    content: '.ui-sidebar[hidden] { display: flex !important; }',
  });
  await expect(verifyKeyboard(page)).rejects.toThrow();
});

test('Sidebar detector rejects a sheet that Escape does not close', async ({
  page,
}) => {
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
  await expect(verifyResponsive(page)).rejects.toThrow();
});

test('Sidebar detector rejects a link without a forced-colors outline', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.addStyleTag({
    content:
      '@media (forced-colors: active) { .ui-sidebar__menu-button:focus-visible { outline: none !important; } }',
  });
  await expect(verifyReflowForced(page)).rejects.toThrow();
});

test('Sidebar detector rejects a current link marked by color alone', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.addStyleTag({
    content:
      '.ui-sidebar__menu-button[data-current] { border-inline-start-width: 0 !important; font-weight: 400 !important; }',
  });
  await expect(verifyReflowForced(page)).rejects.toThrow();
});
