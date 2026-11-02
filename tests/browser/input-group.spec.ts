import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import { measureOverflow, measureRenderedColors } from './rendered-colors.js';

const section = 'section[aria-label="InputGroup states"]';
const frames = `${section} .ui-input-group`;
// Known-invalid controls shorten this so detecting a failure stays cheap.
let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

function group(page: Page) {
  const root = page.locator(section);
  return {
    root,
    query: root.getByRole('searchbox', { name: 'Search docs' }),
    run: root.getByRole('button', { name: 'Run search' }),
    count: root.getByLabel('Search count'),
    form: root.locator('form'),
    frame: (name: string) => root.locator(`[data-case="${name}"]`),
  };
}

async function verifyKeyboard(page: Page) {
  const { query, run, count, form, frame } = group(page);
  await form.evaluate((node) => {
    node.dataset.submits = '0';
    node.addEventListener('submit', (event) => {
      event.preventDefault();
      node.dataset.submits = String(Number(node.dataset.submits) + 1);
    });
  });
  await query.focus();
  // The frame shows the focus of its control.
  await expect
    .poll(
      () => frame('search').evaluate((n) => getComputedStyle(n).boxShadow),
      {
        timeout,
      },
    )
    .not.toBe('none');
  await page.keyboard.type('focus');
  await expect(query).toHaveValue('focus', { timeout });
  // Enter in the input is native implicit submission, never the addon button.
  await page.keyboard.press('Enter');
  await expect(form).toHaveAttribute('data-submits', '1', { timeout });
  await expect(count).toHaveText('0');
  await page.keyboard.press('Tab');
  await expect(run).toBeFocused({ timeout });
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expect(count).toHaveText('2', { timeout });
  // Activating the button never submits the form.
  await expect(form).toHaveAttribute('data-submits', '1');
  // DOM order equals reading and Tab order: the button follows the input.
  const follows = await run.evaluate((node) => {
    const input = node.closest('.ui-input-group')?.querySelector('input');
    if (!input) return false;
    return (
      (input.compareDocumentPosition(node) &
        Node.DOCUMENT_POSITION_FOLLOWING) !==
      0
    );
  });
  expect(follows, 'button follows the input in the DOM').toBe(true);
}

async function verifyStates(page: Page) {
  const { frame } = group(page);
  const read = (name: string) =>
    frame(name).evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        border: style.borderTopColor,
        borderStyle: style.borderTopStyle,
        cursor: style.cursor,
      };
    });
  const [search, invalid, disabled, readonly] = await Promise.all(
    ['search', 'invalid', 'disabled', 'readonly'].map(read),
  );
  expect(invalid?.border, 'invalid differs from valid').not.toBe(
    search?.border,
  );
  expect(readonly?.borderStyle, 'read-only border style').toBe('dashed');
  expect(disabled?.cursor, 'disabled cursor').toBe('not-allowed');
  // Invalid frames are paired with error text, not color alone.
  await expect(
    page.locator(section).getByText('Enter the weight as a number.'),
  ).toBeVisible();
  // Addons never overlap the control's text.
  const overlaps = await page.locator(frames).evaluateAll((nodes) =>
    nodes.map((node) => {
      const control = node.querySelector<HTMLElement>('input, textarea');
      if (!control) return false;
      const box = control.getBoundingClientRect();
      return [...node.querySelectorAll<HTMLElement>('.ui-input-group__addon')]
        .map((addon) => addon.getBoundingClientRect())
        .some(
          (item) =>
            item.left < box.right - 0.5 &&
            item.right > box.left + 0.5 &&
            item.top < box.bottom - 0.5 &&
            item.bottom > box.top + 0.5,
        );
    }),
  );
  expect(overlaps, 'addon overlaps control').toEqual(
    Array(overlaps.length).fill(false),
  );
  for (const item of await measureRenderedColors(
    page,
    `${section} .ui-input-group__text`,
  ))
    expect(item.text, 'addon text contrast').toBeGreaterThanOrEqual(4.5);
}

async function verifyNoOverflow(page: Page) {
  const layout = await measureOverflow(page, frames);
  expect(layout.clipped, 'clipped content').not.toContain(true);
  expect(layout.outside, 'content outside frame').not.toContain(true);
}

async function verifyForcedFocus(page: Page) {
  const { query, frame } = group(page);
  await page.emulateMedia({ forcedColors: 'active' });
  await query.focus();
  const style = await frame('search').evaluate((node) => {
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
  const rules = componentManifest.components.InputGroup.qualityRules.filter(
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

test('[input-group.keyboard] real Tab, typing, Enter and addon button', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'input-group.keyboard', () =>
    verifyKeyboard(page),
  );
});

test('[input-group.visual-states] states, overlap, reflow and forced-colors focus', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'input-group.visual-states', async () => {
    await verifyStates(page);
    await page.setViewportSize({ width: 320, height: 720 });
    await verifyNoOverflow(page);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await verifyNoOverflow(page);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '';
    });
    await verifyForcedFocus(page);
  });
});

test('InputGroup detector rejects an addon button that ignores the keyboard', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.evaluate(() => {
    document.addEventListener(
      'keydown',
      (event) => {
        if (
          (event.key === 'Enter' || event.key === ' ') &&
          (event.target as HTMLElement).closest('.ui-input-group__button')
        )
          event.preventDefault();
      },
      true,
    );
  });
  await expect(verifyKeyboard(page)).rejects.toThrow();
});

test('InputGroup detector rejects overlapping addons', async ({ page }) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `${frames} .ui-input-group__addon { position: absolute !important; inset-inline-start: 0; } ${frames} { position: relative; }`,
  });
  await expect(verifyStates(page)).rejects.toThrow();
});

test('InputGroup detector rejects a forced-colors focus frame that disappears', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `${frames} { outline: none !important; box-shadow: none !important; }`,
  });
  await expect(verifyForcedFocus(page)).rejects.toThrow();
});
