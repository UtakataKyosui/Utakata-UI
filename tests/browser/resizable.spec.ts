import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';

const section = 'section[aria-label="Resizable states"]';
// Known-invalid controls shorten this so detecting a failure stays cheap.
let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

function parts(page: Page) {
  const root = page.locator(section);
  const group = (name: string) => root.locator(`[data-case="${name}"]`);
  return {
    root,
    before: root.getByRole('button', { name: 'Before resizable' }),
    after: root.getByRole('button', { name: 'After resizable' }),
    group,
    handle: (name: string) =>
      root.getByRole('separator', { name, exact: true }),
    changes: root.getByLabel('Resizable layout changes'),
  };
}

const now = (handle: Locator, value: string) =>
  expect(handle).toHaveAttribute('aria-valuenow', value, { timeout });

async function width(locator: Locator, axis: 'width' | 'height' = 'width') {
  return locator.evaluate(
    (node, key) => node.getBoundingClientRect()[key as 'width' | 'height'],
    axis,
  );
}

/** The panel share of the rendered pair must match what the handle reports. */
async function expectRenderedValue(
  page: Page,
  caseName: string,
  handle: Locator,
  axis: 'width' | 'height' = 'width',
) {
  const panels = parts(page).group(caseName).locator('.ui-resizable__panel');
  const first = await width(panels.nth(0), axis);
  const second = await width(panels.nth(1), axis);
  // aria-valuenow is the first panel's share of the (two-panel) group in percent.
  const rendered = (first / (first + second)) * 100;
  const groupTotal =
    Number(await handle.getAttribute('aria-valuenow')) +
    (await handle.evaluate((node) => {
      const next = node.nextElementSibling as HTMLElement;
      return Number(next.style.getPropertyValue('--ui-resizable-panel-size'));
    }));
  expect(groupTotal, 'panel sizes add up').toBeCloseTo(100, 1);
  expect(
    Number(await handle.getAttribute('aria-valuenow')),
    'aria-valuenow follows the rendered size',
  ).toBeCloseTo(rendered, 0);
}

async function drag(
  page: Page,
  handle: Locator,
  delta: number,
  axis: 'x' | 'y' = 'x',
) {
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(
    axis === 'x' ? x + delta / 2 : x,
    axis === 'y' ? y + delta / 2 : y,
    { steps: 4 },
  );
  await page.mouse.move(
    axis === 'x' ? x + delta : x,
    axis === 'y' ? y + delta : y,
    {
      steps: 4,
    },
  );
  await page.mouse.up();
}

async function verifyKeyboardAndPointer(page: Page) {
  const { before, after, handle, changes } = parts(page);
  const horizontal = handle('Resize navigation');
  const vertical = handle('Resize top panel');
  const rtl = handle('Resize RTL navigation');
  await expect(horizontal).toHaveAttribute('aria-orientation', 'vertical');
  await expect(vertical).toHaveAttribute('aria-orientation', 'horizontal');
  await expect(horizontal).toHaveAttribute('aria-valuemin', '20');
  await expect(horizontal).toHaveAttribute('aria-valuemax', '50');
  await now(horizontal, '30');
  await expectRenderedValue(page, 'horizontal', horizontal);

  // Tab reaches each handle once, in DOM order.
  await before.focus();
  for (const item of [horizontal, vertical, rtl, after]) {
    await page.keyboard.press('Tab');
    await expect(item).toBeFocused({ timeout });
  }
  for (const item of [rtl, vertical, horizontal, before]) {
    await page.keyboard.press('Shift+Tab');
    await expect(item).toBeFocused({ timeout });
  }

  // Horizontal group: arrows, limits, Home and End.
  await page.keyboard.press('Tab');
  await expect(horizontal).toBeFocused({ timeout });
  const navBefore = await width(
    parts(page).group('horizontal').locator('.ui-resizable__panel').first(),
  );
  await page.keyboard.press('ArrowRight');
  await now(horizontal, '35');
  const navAfter = await width(
    parts(page).group('horizontal').locator('.ui-resizable__panel').first(),
  );
  expect(navAfter, 'ArrowRight widens the first panel').toBeGreaterThan(
    navBefore,
  );
  await page.keyboard.press('ArrowDown');
  await now(horizontal, '35');
  await page.keyboard.press('End');
  await now(horizontal, '50');
  await page.keyboard.press('ArrowRight');
  await now(horizontal, '50');
  await page.keyboard.press('Home');
  await now(horizontal, '20');
  await page.keyboard.press('ArrowLeft');
  await now(horizontal, '20');
  await page.keyboard.press('ArrowRight');
  await now(horizontal, '25');
  await expectRenderedValue(page, 'horizontal', horizontal);
  await expect(changes).toContainText('"nav":25', { timeout });

  // Vertical group uses the vertical arrows.
  await vertical.focus();
  await now(vertical, '40');
  await page.keyboard.press('ArrowRight');
  await now(vertical, '40');
  await page.keyboard.press('ArrowDown');
  await now(vertical, '45');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await now(vertical, '35');
  await page.keyboard.press('End');
  await now(vertical, '60');
  await expectRenderedValue(page, 'vertical', vertical, 'height');

  // Right-to-left: the first panel is on the right, so ArrowLeft grows it.
  await rtl.focus();
  const rtlFirst = parts(page)
    .group('rtl')
    .locator('.ui-resizable__panel')
    .first();
  const rtlBox = await rtlFirst.boundingBox();
  const rtlGroup = await parts(page).group('rtl').boundingBox();
  expect(rtlBox && rtlGroup && rtlBox.x > rtlGroup.x + rtlGroup.width / 2).toBe(
    true,
  );
  await page.keyboard.press('ArrowLeft');
  await now(rtl, '35');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await now(rtl, '25');
  await expectRenderedValue(page, 'rtl', rtl);

  // A real mouse drag resizes, keeps focus on the handle and honors limits.
  await now(horizontal, '25');
  await drag(page, horizontal, 60);
  await expect(horizontal).toBeFocused({ timeout });
  const afterDrag = Number(await horizontal.getAttribute('aria-valuenow'));
  expect(afterDrag, 'dragging right widens the first panel').toBeGreaterThan(
    25,
  );
  expect(afterDrag).toBeLessThanOrEqual(50);
  await expectRenderedValue(page, 'horizontal', horizontal);
  await drag(page, horizontal, 2000);
  await now(horizontal, '50');
  await drag(page, horizontal, -2000);
  await now(horizontal, '20');
  await expectRenderedValue(page, 'horizontal', horizontal);
  // Vertical drag.
  await drag(page, vertical, -30, 'y');
  expect(Number(await vertical.getAttribute('aria-valuenow'))).toBeLessThan(60);
  await expectRenderedValue(page, 'vertical', vertical, 'height');
  // RTL drag: moving the pointer left widens the first panel.
  await now(rtl, '25');
  await drag(page, rtl, -40);
  expect(Number(await rtl.getAttribute('aria-valuenow'))).toBeGreaterThan(25);
  await expectRenderedValue(page, 'rtl', rtl);
}

/** Gap between the two panels and how much of the group they use, on one axis. */
function measureSeam(group: Locator, axis: 'width' | 'height') {
  return group.evaluate((node, key) => {
    const [first, second] = [
      ...node.querySelectorAll('.ui-resizable__panel'),
    ].map((panel) => panel.getBoundingClientRect());
    if (!first || !second) throw new Error('Expected two panels');
    const horizontal = key === 'width';
    // The first panel is on the right in RTL, so take whichever gap is positive.
    const seam = horizontal
      ? Math.max(second.left - first.right, first.left - second.right)
      : second.top - first.bottom;
    const size = (box: DOMRect) => (horizontal ? box.width : box.height);
    return {
      seam,
      used: size(first) + size(second) + seam,
      container: size(node.getBoundingClientRect()),
    };
  }, axis);
}

async function verifyTargetsAndLayout(page: Page) {
  const { handle, group } = parts(page);
  for (const [name, caseName, axis] of [
    ['Resize navigation', 'horizontal', 'width'],
    ['Resize top panel', 'vertical', 'height'],
    ['Resize RTL navigation', 'rtl', 'width'],
  ] as const) {
    const box = await handle(name).boundingBox();
    expect(box?.width, `${name} target width`).toBeGreaterThanOrEqual(24);
    expect(box?.height, `${name} target height`).toBeGreaterThanOrEqual(24);
    // The target is larger than the line, but layout only spends the line.
    const layout = await measureSeam(group(caseName), axis);
    expect(layout.seam, `${name} layout space`).toBeCloseTo(1, 0);
    expect(layout.used, `${name} fills the group`).toBeCloseTo(
      layout.container,
      0,
    );
  }
}

async function verifyFocusRing(page: Page, forced = false) {
  const { before, handle } = parts(page);
  await before.focus();
  await page.keyboard.press('Tab');
  const horizontal = handle('Resize navigation');
  await expect(horizontal).toBeFocused({ timeout });
  const style = await horizontal.evaluate((node) => {
    const computed = getComputedStyle(node);
    return {
      outlineStyle: computed.outlineStyle,
      outlineWidth: Number.parseFloat(computed.outlineWidth),
      line: getComputedStyle(node, '::before').backgroundColor,
    };
  });
  expect(style.outlineStyle, 'focus outline style').toBe('solid');
  expect(style.outlineWidth, 'focus outline width').toBeGreaterThanOrEqual(2);
  // The handle line stays drawn (also in forced colors, where it is a system color).
  expect(style.line, `${forced ? 'forced-colors ' : ''}line`).not.toBe(
    'rgba(0, 0, 0, 0)',
  );
}

async function verifyReflow(page: Page) {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const layout = await page.evaluate((query) => {
    const root = document.querySelector(query) as HTMLElement;
    const viewport = document.documentElement.clientWidth;
    return {
      pageScroll:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
      outside: [
        ...root.querySelectorAll('.ui-resizable, .ui-resizable__handle'),
      ].map((node) => {
        const box = node.getBoundingClientRect();
        return box.right > viewport + 1 || box.left < -1;
      }),
    };
  }, section);
  expect(layout.pageScroll, 'horizontal page scroll').toBeLessThanOrEqual(0);
  expect(layout.outside.some(Boolean), 'content outside viewport').toBe(false);
}

async function runRule(
  page: Page,
  browser: { version(): string },
  id: string,
  body: () => Promise<void>,
) {
  const rules = componentManifest.components.Resizable.qualityRules.filter(
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

test('[resizable.keyboard-pointer-browser] real keys and mouse in both orientations and RTL', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'resizable.keyboard-pointer-browser', () =>
    verifyKeyboardAndPointer(page),
  );
});

test('[resizable.visual-layout] target size, focus ring, reflow and forced colors', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'resizable.visual-layout', async () => {
    await verifyTargetsAndLayout(page);
    await verifyFocusRing(page);
    await verifyReflow(page);
    await verifyTargetsAndLayout(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.emulateMedia({ forcedColors: 'active' });
    await verifyFocusRing(page, true);
  });
});

test('Resizable detector rejects swallowed keys and pointer presses', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/');
  await page.evaluate(() => {
    const block = (event: Event) => event.stopImmediatePropagation();
    document.addEventListener('keydown', block, true);
    document.addEventListener('pointerdown', block, true);
  });
  await expect(verifyKeyboardAndPointer(page)).rejects.toThrow();
});

test('Resizable detector rejects a handle shrunk below the target size', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} .ui-resizable--horizontal > .ui-resizable__handle { inline-size: 8px !important; }`,
  });
  await expect(verifyTargetsAndLayout(page)).rejects.toThrow();
});

test('Resizable detector rejects a handle that takes layout space', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} .ui-resizable__handle { margin: 0 !important; }`,
  });
  await expect(verifyTargetsAndLayout(page)).rejects.toThrow();
});

test('Resizable detector rejects a removed focus outline', async ({ page }) => {
  timeout = 1000;
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} .ui-resizable__handle:focus-visible { outline: none !important; }`,
  });
  await expect(verifyFocusRing(page)).rejects.toThrow();
});

test('Resizable detector rejects layout wider than a 320px viewport', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `${section} .ui-resizable { inline-size: 600px !important; max-inline-size: none !important; }`,
  });
  await expect(verifyReflow(page)).rejects.toThrow();
});
