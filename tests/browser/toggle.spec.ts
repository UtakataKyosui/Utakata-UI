import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import { measureRenderedColors } from './rendered-colors.js';

const section = 'section[aria-label="Toggle states"]';
const visual = `${section} [data-case="visual"]`;
let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});
const { sizes, variants } = componentManifest.components.Toggle;

function toggles(page: Page) {
  const root = page.locator(section);
  return {
    before: root.getByRole('button', { name: 'Before toggle' }),
    after: root.getByRole('button', { name: 'After toggle' }),
    italic: root.getByRole('button', { name: 'Italic', exact: true }),
    underline: root.getByRole('button', { name: 'Underline', exact: true }),
    changes: root.getByLabel('Toggle changes'),
  };
}

async function verifyKeyboard(page: Page) {
  const { before, after, italic, underline, changes } = toggles(page);
  await expect(underline).toBeDisabled();
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(italic).toBeFocused({ timeout });
  await expect(italic).toHaveAttribute('aria-pressed', 'false', { timeout });
  await page.keyboard.press('Enter');
  await expect(italic).toHaveAttribute('aria-pressed', 'true', { timeout });
  await expect(changes).toHaveText('["Italic:true"]', { timeout });
  await page.keyboard.press('Space');
  await expect(italic).toHaveAttribute('aria-pressed', 'false', { timeout });
  await expect(changes).toHaveText('["Italic:true","Italic:false"]', {
    timeout,
  });
  await expect(italic).toBeFocused({ timeout });
  // The disabled toggle is skipped by the real Tab order.
  await page.keyboard.press('Tab');
  await expect(after).toBeFocused({ timeout });
}

async function settleTransitions(page: Page) {
  // Colors change over a transition; measure only after it has finished.
  await page
    .locator(visual)
    .evaluateAll((nodes) =>
      Promise.all(
        nodes.flatMap((node) =>
          node.getAnimations().map((animation) => animation.finished),
        ),
      ),
    );
}

async function verifyVisuals(page: Page, forcedColors: boolean) {
  await settleTransitions(page);
  const items = await measureRenderedColors(page, visual);
  const count = sizes.length * variants.length * 2;
  expect(items).toHaveLength(count);
  const pressedFlags = await page
    .locator(visual)
    .evaluateAll((nodes) =>
      nodes.map((node) => node.hasAttribute('data-pressed')),
    );
  items.forEach((item, index) => {
    const pressed = pressedFlags[index];
    const label = `${index} ${pressed ? 'pressed' : 'unpressed'}`;
    expect(item.height, `${label} height`).toBeGreaterThanOrEqual(24);
    expect(item.width, `${label} width`).toBeGreaterThanOrEqual(24);
    if (!forcedColors)
      expect(item.text, `${label} text contrast`).toBeGreaterThanOrEqual(4.5);
    if (pressed && !forcedColors)
      expect(item.boxShadow, `${label} inset outline`).not.toBe('none');
    if (!pressed) expect(item.boxShadow, `${label} no outline`).toBe('none');
  });
  expect(pressedFlags.filter(Boolean)).toHaveLength(count / 2);
  if (forcedColors) {
    // Pressed toggles must use the Highlight/HighlightText system pair. The pair's
    // own contrast is guaranteed by the operating system, so it is resolved
    // and compared instead of judging the emulated palette.
    const pairs = await page.locator(visual).evaluateAll((nodes) => {
      const probe = document.createElement('span');
      probe.style.backgroundColor = 'Highlight';
      probe.style.color = 'HighlightText';
      document.body.append(probe);
      const expected = getComputedStyle(probe);
      const resolved = {
        background: expected.backgroundColor,
        color: expected.color,
      };
      probe.remove();
      return nodes
        .filter((node) => node.hasAttribute('data-pressed'))
        .map((node) => ({
          background: getComputedStyle(node).backgroundColor,
          color: getComputedStyle(node).color,
          resolved,
        }));
    });
    expect(pairs).toHaveLength(count / 2);
    for (const pair of pairs) {
      expect(pair.background, 'forced-colors pressed background').toBe(
        pair.resolved.background,
      );
      expect(pair.color, 'forced-colors pressed text').toBe(
        pair.resolved.color,
      );
    }
  }
}

async function verifyForcedFocus(page: Page) {
  const { before, italic } = toggles(page);
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(italic).toBeFocused({ timeout });
  await settleTransitions(page);
  const style = await italic.evaluate((node) => {
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
  const rules = componentManifest.components.Toggle.qualityRules.filter(
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

test('[toggle.keyboard] real Tab, Enter and Space toggle once and skip disabled', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'toggle.keyboard', () => verifyKeyboard(page));
});

test('[toggle.visual-theme] contrast, targets, pressed marks and forced colors', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'toggle.visual-theme', async () => {
    await verifyVisuals(page, false);
    await page.emulateMedia({ forcedColors: 'active' });
    await verifyVisuals(page, true);
    await verifyForcedFocus(page);
  });
});

test('Toggle detector rejects a swallowed Enter activation', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/');
  await page.evaluate(() => {
    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Enter') event.preventDefault();
      },
      true,
    );
  });
  await expect(verifyKeyboard(page)).rejects.toThrow();
});

test('Toggle detector rejects a pressed state without its inset outline', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} .ui-toggle[data-pressed] { box-shadow: none !important; }`,
  });
  await expect(verifyVisuals(page, false)).rejects.toThrow();
});

test('Toggle detector rejects a forced-colors focus ring that disappears', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} .ui-toggle:focus-visible { outline: none !important; box-shadow: none !important; }`,
  });
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(verifyForcedFocus(page)).rejects.toThrow();
});
