import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import { measureOverflow } from './rendered-colors.js';

const section = 'section[aria-label="ButtonGroup states"]';
// Known-invalid controls shorten this so detecting a failure stays cheap.
let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

function groups(page: Page) {
  const root = page.locator(section);
  const button = (name: string) =>
    root.getByRole('button', { name, exact: true });
  return {
    before: root.getByRole('button', { name: 'Before button groups' }),
    after: root.getByRole('button', { name: 'After button groups' }),
    button,
  };
}

async function verifyKeyboard(page: Page) {
  const { before, after, button } = groups(page);
  await expect(button('Forward')).toBeDisabled();
  await expect(button('Up')).toBeDisabled();
  await before.focus();
  // Tab visits enabled buttons in visual order and skips disabled ones.
  const order = [
    'Back',
    'Copy',
    'Paste',
    'Top',
    'Down',
    'First',
    'Second',
    'Third',
    'Fourth',
    'Fifth',
    'Sixth',
  ];
  for (const name of order) {
    await page.keyboard.press('Tab');
    await expect(button(name)).toBeFocused({ timeout });
  }
  await page.keyboard.press('Tab');
  await expect(after).toBeFocused({ timeout });
  for (const name of [...order].reverse()) {
    await page.keyboard.press('Shift+Tab');
    await expect(button(name)).toBeFocused({ timeout });
  }
  // The focused button is stacked above its neighbors so its ring stays visible.
  for (const name of ['Copy', 'Down']) {
    await button(name).focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(button(name)).toBeFocused({ timeout });
    const stacking = await button(name).evaluate((node) => {
      const style = getComputedStyle(node);
      const siblings = [...(node.parentElement?.children ?? [])].filter(
        (item) => item !== node,
      );
      return {
        position: style.position,
        zIndex: Number.parseInt(style.zIndex, 10),
        siblingZ: siblings.map(
          (item) => Number.parseInt(getComputedStyle(item).zIndex, 10) || 0,
        ),
      };
    });
    expect(stacking.position, `${name} position`).not.toBe('static');
    expect(stacking.zIndex, `${name} z-index`).toBeGreaterThan(
      Math.max(0, ...stacking.siblingZ),
    );
  }
}

type Corners = { start: number; end: number; overlap: number };

async function readCorners(page: Page, caseName: string, vertical: boolean) {
  return page
    .locator(`${section} [data-case="${caseName}"] > .ui-button`)
    .evaluateAll(
      (nodes, isVertical) =>
        nodes.map((node, index) => {
          const style = getComputedStyle(node);
          const box = node.getBoundingClientRect();
          const previous = nodes[index - 1]?.getBoundingClientRect();
          const radius = (value: string) => Number.parseFloat(value);
          const start = isVertical
            ? Math.max(
                radius(style.borderTopLeftRadius),
                radius(style.borderTopRightRadius),
              )
            : Math.max(
                radius(style.borderTopLeftRadius),
                radius(style.borderBottomLeftRadius),
              );
          const end = isVertical
            ? Math.max(
                radius(style.borderBottomLeftRadius),
                radius(style.borderBottomRightRadius),
              )
            : Math.max(
                radius(style.borderTopRightRadius),
                radius(style.borderBottomRightRadius),
              );
          const overlap = previous
            ? isVertical
              ? previous.bottom - box.top
              : previous.right - box.left
            : 0;
          return { start, end, overlap };
        }),
      vertical,
    ) as Promise<Corners[]>;
}

function verifyJoined(corners: Corners[]) {
  expect(corners.length).toBeGreaterThanOrEqual(3);
  corners.forEach((item, index) => {
    const label = `button ${index}`;
    if (index === 0)
      expect(item.start, `${label} outer start`).toBeGreaterThan(0);
    else {
      expect(item.start, `${label} joined start`).toBe(0);
      // Neighbors overlap by one border so the seam is a single line.
      expect(item.overlap, `${label} shared border`).toBeCloseTo(1, 0);
    }
    if (index === corners.length - 1)
      expect(item.end, `${label} outer end`).toBeGreaterThan(0);
    else expect(item.end, `${label} joined end`).toBe(0);
  });
}

async function verifyJoinedGroups(page: Page) {
  // Joined geometry is only meaningful while a group stays on one row.
  verifyJoined(await readCorners(page, 'horizontal', false));
  verifyJoined(await readCorners(page, 'vertical', true));
}

async function verifyNoOverflow(page: Page) {
  const layout = await measureOverflow(
    page,
    `${section} .fixture-button-group-wrap`,
  );
  expect(layout.clipped, 'clipped content').toEqual([false]);
  expect(layout.outside, 'content outside group').toEqual([false]);
}

async function verifyLayout(page: Page) {
  await verifyJoinedGroups(page);
  await verifyNoOverflow(page);
}

async function verifyForcedFocus(page: Page) {
  const { before, button } = groups(page);
  await page.emulateMedia({ forcedColors: 'active' });
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(button('Back')).toBeFocused({ timeout });
  const style = await button('Back').evaluate((node) => {
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
  const rules = componentManifest.components.ButtonGroup.qualityRules.filter(
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

test('[button-group.keyboard] real Tab order and focus stacking in both orientations', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'button-group.keyboard', () =>
    verifyKeyboard(page),
  );
});

test('[button-group.visual-layout] joined borders, wrapping and forced-colors focus', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'button-group.visual-layout', async () => {
    await verifyLayout(page);
    // Narrow widths and enlarged text let groups wrap, so only overflow is checked.
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

test('ButtonGroup detector rejects a focus ring that is not stacked above neighbors', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.addStyleTag({
    content: `${section} .ui-button-group > .ui-button:focus-visible { position: static !important; z-index: auto !important; }`,
  });
  await expect(verifyKeyboard(page)).rejects.toThrow();
});

test('ButtonGroup detector rejects buttons that are not joined', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} .ui-button-group > .ui-button { border-radius: 8px !important; margin: 0 !important; }`,
  });
  await expect(verifyLayout(page)).rejects.toThrow();
});

test('ButtonGroup detector rejects a forced-colors focus ring that disappears', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.addStyleTag({
    content: `${section} .ui-button:focus-visible { outline: none !important; box-shadow: none !important; }`,
  });
  await expect(verifyForcedFocus(page)).rejects.toThrow();
});
