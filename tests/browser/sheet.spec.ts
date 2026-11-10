import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import { coverage } from './coverage.js';
import { measureRenderedColors } from './rendered-colors.js';

const section = 'section[aria-label="Sheet states"]';
const sides = componentManifest.components.Sheet.sides;
type Side = (typeof sides)[number];
const popupSelector = '.ui-sheet__popup';
// Known-invalid controls shorten this so detecting a failure stays cheap.
let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

function sheet(page: Page, side: Side) {
  const root = page.locator(section);
  const dialog = page.getByRole('dialog', { name: `Filters on the ${side}` });
  return {
    before: root.getByRole('button', { name: 'Before sheet' }),
    trigger: root.getByRole('button', {
      name: `Open ${side} sheet`,
      exact: true,
    }),
    dialog,
    close: dialog.getByRole('button', { name: `Close ${side} sheet` }),
    apply: dialog.getByRole('button', { name: `Apply ${side} filters` }),
    popup: page.locator(popupSelector),
  };
}

/** Waits until the slide transition has finished so geometry is final. */
async function settled(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate((selector) => {
          const popup = document.querySelector(selector);
          return (
            popup !== null &&
            !popup.hasAttribute('data-starting-style') &&
            popup.getAnimations().length === 0
          );
        }, popupSelector),
      { timeout },
    )
    .toBe(true);
}

/** Reaches the trigger with real Tab presses, then opens with a real Enter. */
async function open(page: Page, side: Side) {
  const { before, trigger, dialog } = sheet(page, side);
  await before.focus();
  for (let tab = 0; tab <= sides.indexOf(side); tab++)
    await page.keyboard.press('Tab');
  await expect(trigger).toBeFocused({ timeout });
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible({ timeout });
  await settled(page);
}

async function closeWithEscape(page: Page, side: Side) {
  const { dialog, trigger } = sheet(page, side);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0, { timeout });
  await expect(trigger).toBeFocused({ timeout });
}

const insideDialog = (page: Page) =>
  page.evaluate(
    () => document.activeElement?.closest('[role="dialog"]') !== null,
  );

async function verifyContainment(page: Page, targets: readonly Side[] = sides) {
  for (const side of targets) {
    const { dialog, close, apply } = sheet(page, side);
    await open(page, side);
    // Focus moves into the popup, onto its first control.
    await expect(close).toBeFocused({ timeout });
    await expect(dialog).toHaveAccessibleDescription(
      'Narrow the list of results.',
    );
    const axe = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .analyze();
    await test.info().attach(`sheet-${side}-dialog-axe`, {
      body: JSON.stringify(axe),
      contentType: 'application/json',
    });
    expect(axe.violations, `${side} axe violations`).toEqual([]);
    expect(axe.incomplete, `${side} axe incomplete`).toEqual([]);
    await page.keyboard.press('Tab');
    await expect(apply).toBeFocused({ timeout });
    // Base UI's focus guards briefly hold focus before redirecting it, so the
    // focus must settle back inside the popup rather than be sampled instantly.
    for (const key of [
      'Tab',
      'Tab',
      'Tab',
      'Shift+Tab',
      'Shift+Tab',
      'Shift+Tab',
    ]) {
      await page.keyboard.press(key);
      await expect
        .poll(() => insideDialog(page), { timeout, message: `${side} ${key}` })
        .toBe(true);
    }
    await closeWithEscape(page, side);
  }
}

async function verifyDismissal(page: Page) {
  const viewport = page.viewportSize();
  expect(viewport).toBeTruthy();
  const { width, height } = viewport ?? { width: 0, height: 0 };
  // A point on the backdrop, on the side opposite the attached edge.
  const backdrop: Record<Side, { x: number; y: number }> = {
    top: { x: width / 2, y: height - 4 },
    right: { x: 4, y: height / 2 },
    bottom: { x: width / 2, y: 4 },
    left: { x: width - 4, y: height / 2 },
  };
  for (const side of sides) {
    const { dialog, trigger, close } = sheet(page, side);
    await open(page, side);
    await closeWithEscape(page, side);
    await open(page, side);
    await close.click();
    await expect(dialog).toHaveCount(0, { timeout });
    await expect(trigger).toBeFocused({ timeout });
    await open(page, side);
    await page.mouse.click(backdrop[side].x, backdrop[side].y);
    await expect(dialog).toHaveCount(0, { timeout });
    await expect(trigger).toBeFocused({ timeout });
  }
}

type Rect = { left: number; top: number; right: number; bottom: number };

const rectOf = (locator: ReturnType<typeof sheet>['popup']) =>
  locator.evaluate((node): Rect => {
    const { left, top, right, bottom } = node.getBoundingClientRect();
    return { left, top, right, bottom };
  });

async function verifyPlacement(page: Page, targets: readonly Side[] = sides) {
  // The registry and the fixture must render every public side.
  expect([...coverage.Sheet.axes.sides]).toEqual([...sides]);
  for (const side of targets) {
    const { popup, close, apply } = sheet(page, side);
    await open(page, side);
    // Focusing the trigger may scroll the page; the baseline is the opened state.
    const scrollBefore = await page.evaluate(() => window.scrollY);
    const viewport = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      height: window.innerHeight,
    }));
    const box = await rectOf(popup);
    const near = (actual: number, expected: number, name: string) =>
      expect(
        Math.abs(actual - expected),
        `${side} ${name}`,
      ).toBeLessThanOrEqual(1);
    if (side === 'right') near(box.right, viewport.width, 'right edge');
    if (side === 'left') near(box.left, 0, 'left edge');
    if (side === 'top') near(box.top, 0, 'top edge');
    if (side === 'bottom') near(box.bottom, viewport.height, 'bottom edge');
    if (side === 'left' || side === 'right') {
      near(box.top, 0, 'top');
      near(box.bottom, viewport.height, 'bottom');
    } else {
      near(box.left, 0, 'left');
      near(box.right, viewport.width, 'right');
    }
    // Long content scrolls inside the popup, not the page behind it.
    const overflow = await popup.evaluate((node) => ({
      overflowY: getComputedStyle(node).overflowY,
      scrollable: node.scrollHeight > node.clientHeight + 1,
    }));
    expect(['auto', 'scroll'], `${side} overflow-y`).toContain(
      overflow.overflowY,
    );
    expect(overflow.scrollable, `${side} content overflows`).toBe(true);
    await page.mouse.move(
      (box.left + box.right) / 2,
      (box.top + box.bottom) / 2,
    );
    await page.mouse.wheel(0, 5000);
    await expect
      .poll(() => popup.evaluate((node) => node.scrollTop), { timeout })
      .toBeGreaterThan(0);
    expect(
      await page.evaluate(() => window.scrollY),
      `${side} page scroll`,
    ).toBe(scrollBefore);
    await popup.evaluate((node) => {
      node.scrollTop = 0;
    });
    // The last control stays reachable and unobscured when focused by Tab.
    await expect(close).toBeFocused({ timeout });
    await page.keyboard.press('Tab');
    await expect(apply).toBeFocused({ timeout });
    const applyBox = await rectOf(apply);
    const popupBox = await rectOf(popup);
    expect(applyBox.bottom, `${side} apply bottom`).toBeLessThanOrEqual(
      popupBox.bottom + 1,
    );
    expect(applyBox.top, `${side} apply top`).toBeGreaterThanOrEqual(
      popupBox.top - 1,
    );
    expect(await popup.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    await page.keyboard.press('Shift+Tab');
    await expect(close).toBeFocused({ timeout });
    expect(
      (await rectOf(close)).top,
      `${side} close top`,
    ).toBeGreaterThanOrEqual(popupBox.top - 1);
    await closeWithEscape(page, side);

    // Reflow: 320 CSS px wide with 200% root text size.
    await page.setViewportSize({ width: 320, height: 560 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    const widthBefore = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    await open(page, side);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      `${side} horizontal page overflow`,
    ).toBeLessThanOrEqual(widthBefore);
    const narrow = await rectOf(popup);
    expect(narrow.left, `${side} narrow left`).toBeGreaterThanOrEqual(-1);
    expect(narrow.right, `${side} narrow right`).toBeLessThanOrEqual(321);
    const inner = await popup.evaluate((node) => ({
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
    }));
    expect(
      inner.scrollWidth,
      `${side} popup horizontal overflow`,
    ).toBeLessThanOrEqual(inner.clientWidth + 1);
    await expect(close).toBeFocused({ timeout });
    await page.keyboard.press('Tab');
    await expect(apply).toBeFocused({ timeout });
    const reachable = await rectOf(apply);
    const narrowPopup = await rectOf(popup);
    expect(reachable.bottom, `${side} narrow apply bottom`).toBeLessThanOrEqual(
      narrowPopup.bottom + 1,
    );
    expect(reachable.top, `${side} narrow apply top`).toBeGreaterThanOrEqual(
      narrowPopup.top - 1,
    );
    await closeWithEscape(page, side);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '';
    });
  }
}

async function verifyReducedMotion(page: Page) {
  const transition = (side: Side) =>
    sheet(page, side).popup.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        property: style.transitionProperty,
        seconds: style.transitionDuration
          .split(',')
          .map((value) => Number.parseFloat(value)),
        animations: node.getAnimations().length,
      };
    });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const side of sides) {
    await open(page, side);
    const motion = await transition(side);
    expect(motion.property, `${side} transition property`).toContain(
      'transform',
    );
    expect(Math.max(...motion.seconds), `${side} transition`).toBeGreaterThan(
      0,
    );
    await closeWithEscape(page, side);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const side of sides) {
    const { dialog } = sheet(page, side);
    await open(page, side);
    const motion = await transition(side);
    expect(Math.max(...motion.seconds), `${side} reduced transition`).toBe(0);
    expect(motion.animations, `${side} running animations`).toBe(0);
    // Still operable without motion.
    await expect(dialog).toBeVisible();
    await closeWithEscape(page, side);
  }
}

async function verifyForced(page: Page) {
  const side: Side = 'right';
  const { close, apply } = sheet(page, side);
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page, side);
  const [popup] = await measureRenderedColors(page, popupSelector);
  expect(popup).toBeTruthy();
  if (popup) {
    expect(
      popup.borderWidth,
      'forced-colors popup border',
    ).toBeGreaterThanOrEqual(1);
    expect(popup.borderStyle).toBe('solid');
  }
  await expect(close).toBeFocused({ timeout });
  for (const [name, locator] of [
    ['Close', close],
    ['Apply', apply],
  ] as const) {
    if (name === 'Apply') await page.keyboard.press('Tab');
    await expect(locator).toBeFocused({ timeout });
    const style = await locator.evaluate((node) => {
      const computed = getComputedStyle(node);
      return {
        outlineStyle: computed.outlineStyle,
        outlineWidth: Number.parseFloat(computed.outlineWidth),
      };
    });
    // Forced colors suppress box shadows, so an outline must remain.
    expect(style.outlineStyle, `${name} outline`).toBe('solid');
    expect(style.outlineWidth, `${name} outline width`).toBeGreaterThanOrEqual(
      2,
    );
  }
}

async function runRule(
  page: Page,
  browser: { version(): string },
  id: string,
  body: () => Promise<void>,
) {
  const rules = componentManifest.components.Sheet.qualityRules.filter(
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
      sides,
      report,
    }),
    contentType: 'application/json',
  });
  expect(report.automatedPassed, formatQualityReport(report.results)).toBe(
    true,
  );
}

test('[sheet.focus-containment] real Tab keeps focus inside every side and starts on Close', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'sheet.focus-containment', () =>
    verifyContainment(page),
  );
});

test('[sheet.dismissal-focus-return] Escape, Close and a backdrop press close every side and return focus', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'sheet.dismissal-focus-return', () =>
    verifyDismissal(page),
  );
});

test('[sheet.placement-scroll] each side sits on its edge, reflows and scrolls its long content', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'sheet.placement-scroll', () =>
    verifyPlacement(page),
  );
});

test('[sheet.reduced-motion] the slide transition is removed for reduced motion on every side', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'sheet.reduced-motion', () =>
    verifyReducedMotion(page),
  );
});

test('[sheet.forced-focus] popup border and focus outlines in forced colors', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'sheet.forced-focus', () => verifyForced(page));
});

test('Sheet detector rejects a focus trap that lets Tab escape', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  // Make the page behind the popup focusable and reachable again.
  await page.evaluate(() => {
    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key !== 'Tab') return;
        event.preventDefault();
        event.stopImmediatePropagation();
        (document.querySelector('main button') as HTMLElement | null)?.focus();
      },
      true,
    );
  });
  await expect(verifyContainment(page, ['right'])).rejects.toThrow();
});

test('Sheet detector rejects an Escape key that does not close', async ({
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
  await expect(verifyDismissal(page)).rejects.toThrow();
});

test('Sheet detector rejects a popup that no longer scrolls its content', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.addStyleTag({
    content: `${popupSelector} { overflow: visible !important; }`,
  });
  await expect(verifyPlacement(page, ['right'])).rejects.toThrow();
});

test('Sheet detector rejects a popup that is not attached to its edge', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.addStyleTag({
    content: `${popupSelector}--right { right: auto !important; left: 4rem !important; }`,
  });
  await expect(verifyPlacement(page, ['right'])).rejects.toThrow();
});

test('Sheet detector rejects a transition that ignores reduced motion', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.addStyleTag({
    content: `${popupSelector} { transition: transform 200ms ease !important; }`,
  });
  await expect(verifyReducedMotion(page)).rejects.toThrow();
});

test('Sheet detector rejects forced-colors focus that disappears', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.addStyleTag({
    content:
      '.ui-dialog__popup :focus-visible { outline: none !important; box-shadow: none !important; }',
  });
  await expect(verifyForced(page)).rejects.toThrow();
});
