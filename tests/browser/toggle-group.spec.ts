import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import { measureRenderedColors } from './rendered-colors.js';

const section = 'section[aria-label="ToggleGroup states"]';
const items = `${section} .ui-toggle-group__item`;
// Known-invalid controls shorten this so detecting a failure stays cheap.
let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

function groups(page: Page) {
  const root = page.locator(section);
  const item = (name: string) =>
    root.getByRole('button', { name, exact: true });
  return {
    before: root.getByRole('button', { name: 'Before groups' }),
    after: root.getByRole('button', { name: 'After groups' }),
    item,
    changes: root.getByLabel('Group changes'),
  };
}

async function verifyKeyboard(page: Page) {
  const { before, after, item, changes } = groups(page);
  await expect(item('Italic')).toBeDisabled();
  await before.focus();
  await page.keyboard.press('Tab');
  // A single Tab stop enters the group on its first enabled item.
  await expect(item('Bold')).toBeFocused({ timeout });
  // Horizontal: arrows skip the disabled item and focus does not toggle.
  await page.keyboard.press('ArrowRight');
  await expect(item('Underline')).toBeFocused({ timeout });
  await expect(item('Underline')).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('End');
  await expect(item('Strike')).toBeFocused({ timeout });
  await page.keyboard.press('Home');
  await expect(item('Bold')).toBeFocused({ timeout });
  await page.keyboard.press('Space');
  await expect(item('Bold')).toHaveAttribute('aria-pressed', 'true', {
    timeout,
  });
  await expect(changes).toHaveText('["format:bold"]', { timeout });
  await page.keyboard.press('ArrowRight');
  await expect(item('Underline')).toBeFocused({ timeout });
  await page.keyboard.press('Enter');
  await expect(item('Underline')).toHaveAttribute('aria-pressed', 'true', {
    timeout,
  });
  await expect(item('Bold')).toHaveAttribute('aria-pressed', 'true');
  // Tab leaves the group for the next one and enters on its first enabled item.
  await page.keyboard.press('Tab');
  await expect(item('Left')).toBeFocused({ timeout });
  // Vertical: Up and Down move focus and skip the disabled item.
  await page.keyboard.press('ArrowDown');
  await expect(item('Center')).toBeFocused({ timeout });
  await page.keyboard.press('ArrowDown');
  await expect(item('Justify')).toBeFocused({ timeout });
  await page.keyboard.press('ArrowUp');
  await expect(item('Center')).toBeFocused({ timeout });
  await page.keyboard.press('Home');
  await expect(item('Left')).toBeFocused({ timeout });
  await page.keyboard.press('End');
  await expect(item('Justify')).toBeFocused({ timeout });
  // Single mode: pressing another item replaces the selection.
  await page.keyboard.press('Space');
  await expect(item('Justify')).toHaveAttribute('aria-pressed', 'true', {
    timeout,
  });
  await expect(item('Center')).toHaveAttribute('aria-pressed', 'false', {
    timeout,
  });
  await page.keyboard.press('Tab');
  await expect(after).toBeFocused({ timeout });
}

async function verifyVisuals(page: Page, forcedColors: boolean) {
  await page
    .locator(items)
    .evaluateAll((nodes) =>
      Promise.all(
        nodes.flatMap((node) =>
          node.getAnimations().map((animation) => animation.finished),
        ),
      ),
    );
  const measured = await measureRenderedColors(page, items);
  const pressed = await page
    .locator(items)
    .evaluateAll((nodes) =>
      nodes.map((node) => node.hasAttribute('data-pressed')),
    );
  expect(measured).toHaveLength(8);
  // Pressed items exist in both groups (Center is pressed by default).
  expect(pressed.some(Boolean)).toBe(true);
  measured.forEach((item, index) => {
    if (!forcedColors)
      expect(item.text, `item ${index} text contrast`).toBeGreaterThanOrEqual(
        4.5,
      );
    if (pressed[index] && !forcedColors)
      expect(item.boxShadow, `item ${index} inset outline`).not.toBe('none');
    if (!pressed[index])
      expect(item.boxShadow, `item ${index} no outline`).toBe('none');
  });
  if (!forcedColors) return;
  const expected = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.backgroundColor = 'Highlight';
    probe.style.color = 'HighlightText';
    document.body.append(probe);
    const style = getComputedStyle(probe);
    const colors = { background: style.backgroundColor, color: style.color };
    probe.remove();
    return colors;
  });
  const pairs = await page
    .locator(`${items}[data-pressed]`)
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const style = getComputedStyle(node);
        return { background: style.backgroundColor, color: style.color };
      }),
    );
  expect(pairs.length).toBeGreaterThan(0);
  for (const pair of pairs) expect(pair).toEqual(expected);
}

async function verifyForcedFocus(page: Page) {
  const { before, item } = groups(page);
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(item('Bold')).toBeFocused({ timeout });
  const style = await item('Bold').evaluate((node) => {
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
  const rules = componentManifest.components.ToggleGroup.qualityRules.filter(
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

test('[toggle-group.keyboard] real arrows, Home/End, Space/Enter and Tab in both orientations', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'toggle-group.keyboard', () =>
    verifyKeyboard(page),
  );
});

test('[toggle-group.visual-states] pressed marks, contrast and forced colors', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'toggle-group.visual-states', async () => {
    await verifyVisuals(page, false);
    await page.emulateMedia({ forcedColors: 'active' });
    await verifyVisuals(page, true);
    await verifyForcedFocus(page);
  });
});

test('ToggleGroup detector rejects swallowed arrow navigation', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
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

test('ToggleGroup detector rejects a pressed state without its inset outline', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `${items}[data-pressed] { box-shadow: none !important; }`,
  });
  await expect(verifyVisuals(page, false)).rejects.toThrow();
});

test('ToggleGroup detector rejects a forced-colors focus ring that disappears', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.addStyleTag({
    content: `${items}:focus-visible { outline: none !important; box-shadow: none !important; }`,
  });
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(verifyForcedFocus(page)).rejects.toThrow();
});
