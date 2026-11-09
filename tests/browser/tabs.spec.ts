import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';

const section = 'section[aria-label="Tabs states"]';
let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

function tabs(page: Page) {
  const root = page.locator(section);
  const tab = (name: string) => root.getByRole('tab', { name, exact: true });
  return {
    root,
    before: root.getByRole('button', { name: 'Before tabs' }),
    after: root.getByRole('button', { name: 'After tabs' }),
    profile: tab('Profile'),
    billing: tab('Billing'),
    team: tab('Team'),
    security: tab('Security'),
    tab,
  };
}

async function verifyKeyboard(page: Page) {
  const { before, profile, billing, team, security } = tabs(page);
  await before.focus();
  await page.keyboard.press('Tab');
  // Tab enters the selected tab.
  await expect(profile).toBeFocused({ timeout });
  await expect(profile).toHaveAttribute('aria-selected', 'true', { timeout });
  await page.keyboard.press('ArrowRight');
  await expect(billing).toBeFocused({ timeout });
  // Manual activation: focus alone does not select.
  await expect(billing).toHaveAttribute('aria-selected', 'false', { timeout });
  await expect(profile).toHaveAttribute('aria-selected', 'true', { timeout });
  await page.keyboard.press('Enter');
  await expect(billing).toHaveAttribute('aria-selected', 'true', { timeout });
  // Disabled tabs stay focusable but cannot be selected.
  await page.keyboard.press('ArrowRight');
  await expect(team).toBeFocused({ timeout });
  await expect(team).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Enter');
  await expect(team).toHaveAttribute('aria-selected', 'false', { timeout });
  await expect(billing).toHaveAttribute('aria-selected', 'true', { timeout });
  await page.keyboard.press('End');
  await expect(security).toBeFocused({ timeout });
  await page.keyboard.press('Home');
  await expect(profile).toBeFocused({ timeout });
  // Space selects too, and Tab then moves into the active panel.
  await page.keyboard.press('ArrowRight');
  await expect(billing).toBeFocused({ timeout });
  await page.keyboard.press('Space');
  await expect(billing).toHaveAttribute('aria-selected', 'true', { timeout });
  await page.keyboard.press('Tab');
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            document.activeElement?.closest('[role="tabpanel"]')?.textContent ??
            '',
        ),
      { timeout },
    )
    .toContain('billing action');
}

async function geometry(page: Page, caseName: string, tabName: string) {
  const root = page.locator(`${section} [data-case="${caseName}"]`);
  const tab = root.getByRole('tab', { name: tabName, exact: true });
  const indicator = root.locator('.ui-tabs__indicator');
  await expect(indicator).toBeVisible({ timeout });
  return { tab, indicator };
}

async function expectAligned(
  page: Page,
  caseName: string,
  tabName: string,
  vertical: boolean,
) {
  const { tab, indicator } = await geometry(page, caseName, tabName);
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout });
  await expect
    .poll(
      async () => {
        const [a, b] = await Promise.all([
          tab.boundingBox(),
          indicator.boundingBox(),
        ]);
        if (!a || !b) return Number.POSITIVE_INFINITY;
        return vertical
          ? Math.max(
              Math.abs(b.y - a.y),
              Math.abs(b.height - a.height),
              Math.abs(b.x + b.width - (a.x + a.width)),
            )
          : Math.max(
              Math.abs(b.y + b.height - (a.y + a.height)),
              Math.abs(b.x - a.x),
              Math.abs(b.width - a.width),
            );
      },
      { timeout, message: `${tabName} indicator alignment` },
    )
    .toBeLessThanOrEqual(1.5);
}

async function verifyLayout(page: Page) {
  const wrap = page.locator(`${section} [data-case="wrap"]`);
  const tops = await wrap
    .getByRole('tab')
    .evaluateAll((nodes) => [
      ...new Set(
        nodes.map((node) => Math.round(node.getBoundingClientRect().top)),
      ),
    ]);
  // The fixture must wrap, otherwise the check proves nothing.
  expect(tops.length, 'tab list wraps').toBeGreaterThan(1);
  await expectAligned(page, 'wrap', 'overview', false);
  await expectAligned(page, 'wrap', 'billing', false);
  await expectAligned(page, 'wrap', 'activity', false);
  await expectAligned(page, 'vertical', 'one', true);
  await expectAligned(page, 'vertical', 'three', true);
  // The selected tab differs from the others without relying on color.
  const weights = await wrap.getByRole('tab').evaluateAll((nodes) =>
    nodes.map((node) => ({
      selected: node.getAttribute('aria-selected') === 'true',
      weight: Number.parseInt(getComputedStyle(node).fontWeight, 10),
      border: getComputedStyle(node).borderBlockEndWidth,
    })),
  );
  const selected = weights.filter((item) => item.selected);
  expect(selected).toHaveLength(1);
  for (const other of weights.filter((item) => !item.selected))
    expect(selected[0]?.weight, 'selected weight').toBeGreaterThan(
      other.weight,
    );
}

async function runRule(
  page: Page,
  browser: { version(): string },
  id: string,
  body: () => Promise<void>,
) {
  const rules = componentManifest.components.Tabs.qualityRules.filter(
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

test('[tabs.keyboard] real Tab, arrows, Home/End, Enter/Space and panel entry', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'tabs.keyboard', () => verifyKeyboard(page));
});

test('[tabs.indicator-layout] indicator follows the selected tab across wrapped rows and orientations', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'tabs.indicator-layout', () =>
    verifyLayout(page),
  );
});

test('Tabs detector rejects swallowed arrow navigation', async ({ page }) => {
  timeout = 1000;
  await page.goto('/');
  await page.evaluate(() => {
    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key.startsWith('Arrow')) event.stopImmediatePropagation();
      },
      true,
    );
  });
  await expect(verifyKeyboard(page)).rejects.toThrow();
});

test('Tabs detector rejects an indicator pinned to the bottom of the list', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} [data-case="wrap"] .ui-tabs__indicator { inset-block-start: auto !important; inset-block-end: -1px !important; translate: var(--active-tab-left) 0 !important; }`,
  });
  await expect(verifyLayout(page)).rejects.toThrow();
});
