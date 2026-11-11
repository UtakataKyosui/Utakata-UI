import AxeBuilder from '@axe-core/playwright';
import { type CDPSession, expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import { coverage } from './coverage.js';
import { measureRenderedColors } from './rendered-colors.js';

const section = 'section[aria-label="Drawer states"]';
const sides = componentManifest.components.Drawer.sides;
type Side = (typeof sides)[number];
const popupSelector = '.ui-drawer__popup';
const contentSelector = '.ui-drawer__content';
// Known-invalid controls shorten this so detecting a failure stays cheap.
let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

function drawer(page: Page, side: Side) {
  const root = page.locator(section);
  const dialog = page.getByRole('dialog', { name: `Filters on the ${side}` });
  return {
    before: root.getByRole('button', { name: 'Before drawer' }),
    trigger: root.getByRole('button', {
      name: `Open ${side} drawer`,
      exact: true,
    }),
    dialog,
    close: dialog.getByRole('button', { name: `Close ${side} drawer` }),
    apply: dialog.getByRole('button', { name: `Apply ${side} filters` }),
    popup: page.locator(popupSelector),
    content: page.locator(contentSelector),
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
  const { before, trigger, dialog } = drawer(page, side);
  await before.focus();
  for (let tab = 0; tab <= sides.indexOf(side); tab++)
    await page.keyboard.press('Tab');
  await expect(trigger).toBeFocused({ timeout });
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible({ timeout });
  await settled(page);
}

async function closeWithEscape(page: Page, side: Side) {
  const { dialog, trigger } = drawer(page, side);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0, { timeout });
  await expect(trigger).toBeFocused({ timeout });
}

const insideDialog = (page: Page) =>
  page.evaluate(
    () => document.activeElement?.closest('[role="dialog"]') !== null,
  );

/**
 * Base UI Drawer moves focus onto the popup itself when it opens; the first
 * Tab then reaches the first control, which is Close in the fixture.
 */
async function reachClose(
  page: Page,
  close: ReturnType<typeof drawer>['close'],
) {
  await expect.poll(() => insideDialog(page), { timeout }).toBe(true);
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused({ timeout });
}

async function verifyContainment(page: Page, targets: readonly Side[] = sides) {
  for (const side of targets) {
    const { dialog, close, apply } = drawer(page, side);
    await open(page, side);
    // Focus moves into the popup; the first Tab reaches Close.
    await reachClose(page, close);
    await expect(dialog).toHaveAccessibleDescription(
      'Narrow the list of results.',
    );
    const axe = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .analyze();
    await test.info().attach(`drawer-${side}-dialog-axe`, {
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
    const { dialog, trigger, close } = drawer(page, side);
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

const rectOf = (locator: ReturnType<typeof drawer>['popup']) =>
  locator.evaluate((node): Rect => {
    const { left, top, right, bottom } = node.getBoundingClientRect();
    return { left, top, right, bottom };
  });

async function verifyPlacement(page: Page, targets: readonly Side[] = sides) {
  // The registry and the fixture must render every public side.
  expect([...coverage.Drawer.axes.sides]).toEqual([...sides]);
  for (const side of targets) {
    const { popup, content, close, apply } = drawer(page, side);
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
    const overflow = await content.evaluate((node) => ({
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
      .poll(() => content.evaluate((node) => node.scrollTop), { timeout })
      .toBeGreaterThan(0);
    expect(
      await page.evaluate(() => window.scrollY),
      `${side} page scroll`,
    ).toBe(scrollBefore);
    await content.evaluate((node) => {
      node.scrollTop = 0;
    });
    // The last control stays reachable and unobscured when focused by Tab.
    await reachClose(page, close);
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
    expect(await content.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
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
    const inner = await content.evaluate((node) => ({
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
    }));
    expect(
      inner.scrollWidth,
      `${side} popup horizontal overflow`,
    ).toBeLessThanOrEqual(inner.clientWidth + 1);
    await reachClose(page, close);
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

const toward: Record<Side, { x: number; y: number }> = {
  top: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

type Point = { x: number; y: number };

/**
 * Chromium touch input through the DevTools protocol: pointer type "touch"
 * with touch events, which Base UI swipe handling requires (a mouse drag does
 * not swipe). It is emulated input, not a physical device.
 */
function touchInput(cdp: CDPSession) {
  const send = (
    type: 'touchStart' | 'touchMove' | 'touchEnd',
    touchPoints: Point[],
  ) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
  return {
    start: (point: Point) => send('touchStart', [point]),
    move: (point: Point) => send('touchMove', [point]),
    end: () => send('touchEnd', []),
    async drag(from: Point, side: Side, distance: number) {
      const { x, y } = toward[side];
      await send('touchStart', [from]);
      for (let step = 1; step <= 12; step++)
        await send('touchMove', [
          {
            x: from.x + (x * distance * step) / 12,
            y: from.y + (y * distance * step) / 12,
          },
        ]);
      await send('touchEnd', []);
    },
  };
}

const centerOf = (box: {
  x: number;
  y: number;
  width: number;
  height: number;
}) => ({
  x: box.x + box.width / 2,
  y: box.y + box.height / 2,
});

async function verifySwipe(page: Page, targets: readonly Side[] = sides) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled', {
    enabled: true,
    maxTouchPoints: 1,
  });
  const touch = touchInput(cdp);
  try {
    for (const side of targets) {
      const { dialog, trigger, popup, content, apply } = drawer(page, side);
      const applied = page.getByLabel('Applied filters');
      const heading = dialog.getByRole('heading');
      await open(page, side);
      const home = await rectOf(popup);
      const extent =
        side === 'left' || side === 'right'
          ? home.right - home.left
          : home.bottom - home.top;
      const headingBox = await heading.boundingBox();
      expect(headingBox, `${side} heading`).toBeTruthy();
      const grip = centerOf(headingBox ?? { x: 0, y: 0, width: 0, height: 0 });
      // A short drag springs back and keeps the drawer open.
      await touch.drag(grip, side, extent * 0.1);
      await expect(dialog).toBeVisible({ timeout });
      await settled(page);
      const back = await rectOf(popup);
      expect(
        Math.abs(back.left - home.left),
        `${side} spring left`,
      ).toBeLessThan(2);
      expect(Math.abs(back.top - home.top), `${side} spring top`).toBeLessThan(
        2,
      );
      // Scrolling long content never dismisses it.
      await page.mouse.move(
        (home.left + home.right) / 2,
        (home.top + home.bottom) / 2,
      );
      await page.mouse.wheel(0, 5000);
      await expect
        .poll(() => content.evaluate((node) => node.scrollTop), { timeout })
        .toBeGreaterThan(0);
      await expect(dialog).toBeVisible();
      // Pressing the action without releasing on it does not run it, and
      // moving off before release cancels it.
      const before = Number(await applied.textContent());
      await apply.scrollIntoViewIfNeeded();
      const target = await apply.boundingBox();
      expect(target, `${side} action`).toBeTruthy();
      const actionPoint = centerOf(
        target ?? { x: 0, y: 0, width: 0, height: 0 },
      );
      await touch.start(actionPoint);
      expect(Number(await applied.textContent()), `${side} on press`).toBe(
        before,
      );
      await touch.move({ x: actionPoint.x + 4, y: actionPoint.y - 60 });
      await touch.end();
      expect(
        Number(await applied.textContent()),
        `${side} after dragging off`,
      ).toBe(before);
      // Keyboard activation still runs it.
      if ((await dialog.count()) === 0) await open(page, side);
      await apply.focus();
      await page.keyboard.press('Enter');
      await expect(applied).toHaveText(String(before + 1), { timeout });
      // A long drag toward the attached edge dismisses and returns focus.
      await content.evaluate((node) => {
        node.scrollTop = 0;
      });
      const headingAgain = await heading.boundingBox();
      expect(headingAgain, `${side} heading again`).toBeTruthy();
      await touch.drag(
        centerOf(headingAgain ?? { x: 0, y: 0, width: 0, height: 0 }),
        side,
        extent * 0.95,
      );
      await expect(dialog).toHaveCount(0, { timeout });
      await expect(trigger).toBeFocused({ timeout });
    }
  } finally {
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await cdp.detach();
  }
}

async function verifyReducedMotion(page: Page) {
  const transition = (side: Side) =>
    drawer(page, side).popup.evaluate((node) => {
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
    const { dialog } = drawer(page, side);
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
  const side: Side = 'bottom';
  const { close, apply } = drawer(page, side);
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
  await reachClose(page, close);
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
  const rules = componentManifest.components.Drawer.qualityRules.filter(
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

test('[drawer.focus-containment] real Tab keeps focus inside every side and reaches Close first', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'drawer.focus-containment', () =>
    verifyContainment(page),
  );
});

test('[drawer.dismissal-focus-return] Escape, Close and a backdrop press close every side and return focus', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'drawer.dismissal-focus-return', () =>
    verifyDismissal(page),
  );
});

test('[drawer.placement-scroll] each side sits on its edge, reflows and scrolls its long content', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'drawer.placement-scroll', () =>
    verifyPlacement(page),
  );
});

test('[drawer.swipe-scroll] a touch drag toward the edge dismisses, a short drag springs back and scrolling or pressing never dismisses or acts', async ({
  page,
  browser,
}) => {
  // Four sides with several drags each; leave room when workers share a CPU.
  test.setTimeout(90_000);
  await page.goto('/');
  await runRule(page, browser, 'drawer.swipe-scroll', () => verifySwipe(page));
});

test('[drawer.reduced-motion] the slide transition is removed for reduced motion on every side', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'drawer.reduced-motion', () =>
    verifyReducedMotion(page),
  );
});

test('[drawer.forced-focus] popup border and focus outlines in forced colors', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'drawer.forced-focus', () => verifyForced(page));
});

test('Drawer detector rejects a focus trap that lets Tab escape', async ({
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
  await expect(verifyContainment(page, ['bottom'])).rejects.toThrow();
});

test('Drawer detector rejects an Escape key that does not close', async ({
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

test('Drawer detector rejects content that no longer scrolls its content', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.addStyleTag({
    content: `${contentSelector} { overflow: visible !important; }`,
  });
  await expect(verifyPlacement(page, ['bottom'])).rejects.toThrow();
});

test('Drawer detector rejects a popup that is not attached to its edge', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.addStyleTag({
    content: `${popupSelector}--bottom { margin-bottom: 4rem !important; }`,
  });
  await expect(verifyPlacement(page, ['bottom'])).rejects.toThrow();
});

test('Drawer detector rejects a drawer that ignores pointer swipes', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.evaluate(() => {
    for (const type of ['pointerdown', 'touchstart']) {
      document.addEventListener(
        type,
        (event) => {
          if ((event.target as Element).closest('.ui-drawer__popup'))
            event.stopImmediatePropagation();
        },
        true,
      );
    }
  });
  await expect(verifySwipe(page, ['bottom'])).rejects.toThrow();
});

test('Drawer detector rejects a transition that ignores reduced motion', async ({
  page,
}) => {
  await page.goto('/');
  timeout = 1000;
  await page.addStyleTag({
    content: `${popupSelector} { transition: transform 200ms ease !important; }`,
  });
  await expect(verifyReducedMotion(page)).rejects.toThrow();
});

test('Drawer detector rejects forced-colors focus that disappears', async ({
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
