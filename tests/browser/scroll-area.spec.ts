import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, test } from '@playwright/test';
import { contrast } from './color-contrast.js';

const fixture = 'section[aria-label="Scroll Area states"]';

function scrollGeometry(region: Locator) {
  return region.evaluate((node) => ({
    x: node.scrollLeft,
    y: node.scrollTop,
    overflowX: getComputedStyle(node).overflowX,
    overflowY: getComputedStyle(node).overflowY,
    availableX: node.scrollWidth - node.clientWidth,
    availableY: node.scrollHeight - node.clientHeight,
  }));
}

async function verifyOverflow(region: Locator) {
  const geometry = await scrollGeometry(region);
  expect(geometry.overflowX, 'horizontal overflow').toBe('auto');
  expect(geometry.overflowY, 'vertical overflow').toBe('auto');
  expect(geometry.availableX).toBeGreaterThan(0);
  expect(geometry.availableY).toBeGreaterThan(0);
  return geometry;
}

async function verifyFocus(region: Locator, forcedColors = false) {
  const style = await region.evaluate((node) => {
    const computed = getComputedStyle(node);
    return {
      outlineColor: computed.outlineColor,
      outlineStyle: computed.outlineStyle,
      outlineWidth: Number.parseFloat(computed.outlineWidth),
      backgroundColor: computed.backgroundColor,
      scrollBehavior: computed.scrollBehavior,
    };
  });
  expect(style.outlineStyle, 'focus outline').toBe('solid');
  expect(style.outlineWidth).toBeGreaterThanOrEqual(2);
  if (!forcedColors) {
    expect(
      contrast(style.outlineColor, style.backgroundColor),
    ).toBeGreaterThanOrEqual(3);
  }
  expect(style.scrollBehavior).toBe('auto');
  return style;
}

test.use({ hasTouch: true });

test('[scroll-area.native-scroll] native overflow, keyboard, touch and focus', async ({
  page,
  context,
  browser,
}) => {
  await page.goto('/?scroll-area');
  await page.setViewportSize({ width: 320, height: 720 });
  const root = page.locator(fixture);
  const region = root.getByRole('region', { name: 'Updates' });
  const initial = await verifyOverflow(region);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBe(0);

  const axe = await new AxeBuilder({ page }).include(fixture).analyze();
  await test.info().attach('scroll-area-axe', {
    body: JSON.stringify(axe),
    contentType: 'application/json',
  });
  expect(axe.violations).toEqual([]);
  expect(axe.incomplete).toEqual([]);

  await root.getByRole('button', { name: 'Before scroll area' }).focus();
  await page.keyboard.press('Tab');
  await expect(region).toBeFocused();
  const focus = await verifyFocus(region);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await expect
    .poll(async () => (await scrollGeometry(region)).x)
    .toBeGreaterThan(initial.x);
  await expect
    .poll(async () => (await scrollGeometry(region)).y)
    .toBeGreaterThan(initial.y);
  const keyboard = await scrollGeometry(region);
  await page.keyboard.press('Tab');
  await expect(
    region.getByRole('button', { name: 'Read update' }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    root.getByRole('button', { name: 'After scroll area' }),
  ).toBeFocused();

  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await root.getByRole('button', { name: 'Before scroll area' }).focus();
  await page.keyboard.press('Tab');
  await expect(region).toBeFocused();
  const forced = await verifyFocus(region, true);

  await region.evaluate((node) => node.scrollTo(0, 0));
  await region.scrollIntoViewIfNeeded();
  const box = await region.boundingBox();
  if (!box) throw new Error('Missing ScrollArea bounds');
  const session = await context.newCDPSession(page);
  const start = { x: box.x + box.width - 25, y: box.y + box.height - 25 };
  try {
    for (const axis of ['x', 'y'] as const) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [start],
      });
      for (const distance of [24, 48, 72]) {
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ ...start, [axis]: start[axis] - distance }],
        });
      }
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
      await expect
        .poll(async () => (await scrollGeometry(region))[axis])
        .toBeGreaterThan(0);
    }
  } finally {
    await session.detach();
  }
  const touch = await scrollGeometry(region);

  await test.info().attach('scroll-area-evidence', {
    body: JSON.stringify({
      browser: browser.version(),
      platform: process.platform,
      project: test.info().project.name,
      initial,
      focus,
      forced,
      keyboard,
      touch,
    }),
    contentType: 'application/json',
  });
});

test('ScrollArea detector rejects disabled overflow and a hidden focus outline', async ({
  page,
}) => {
  await page.goto('/?scroll-area');
  const root = page.locator(fixture);
  const region = root.getByRole('region', { name: 'Updates' });
  await expect(region).toBeVisible();
  await page.addStyleTag({
    content:
      '.ui-scroll-area { overflow: hidden !important; } .ui-scroll-area:focus-visible { outline: none !important; }',
  });
  await expect(verifyOverflow(region)).rejects.toThrow(/horizontal overflow/);
  await root.getByRole('button', { name: 'Before scroll area' }).focus();
  await page.keyboard.press('Tab');
  await expect(region).toBeFocused();
  await expect(verifyFocus(region)).rejects.toThrow(/focus outline/);
});
