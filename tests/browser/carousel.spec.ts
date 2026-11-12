import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { measureRenderedColors } from './rendered-colors.js';

test.use({ hasTouch: true });

const section = '.ui-carousel';

function carousel(page: Page) {
  const root = page.getByRole('region', { name: 'Featured exhibits' });
  return {
    root,
    viewport: root.getByRole('group', { name: 'Exhibit slides' }),
    previous: root.getByRole('button', { name: 'Previous exhibit' }),
    next: root.getByRole('button', { name: 'Next exhibit' }),
    status: root.getByRole('status'),
  };
}

async function expectPosition(page: Page, position: number, timeout = 5000) {
  const { viewport, status } = carousel(page);
  await expect(status).toHaveText(`Exhibit ${position} of 3`, { timeout });
  const slide = viewport.locator('.ui-carousel__slide').nth(position - 1);
  await expect(slide).not.toHaveAttribute('aria-hidden');
  const delta = await slide.evaluate((node) => {
    const viewport = node.parentElement?.getBoundingClientRect();
    const { x, width } = node.getBoundingClientRect();
    return viewport
      ? Math.abs(x + width / 2 - viewport.x - viewport.width / 2)
      : Infinity;
  });
  expect(delta).toBeLessThanOrEqual(1);
}

async function expectDisabledWithoutActivation(
  page: Page,
  button: Locator,
  position: number,
  timeout = 5000,
) {
  await expect(button).toBeDisabled({ timeout });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(button).toBeFocused({ timeout });
  await expectPosition(page, position, timeout);
}

test('[carousel.navigation] button, keyboard, boundary and content behavior', async ({
  page,
}) => {
  await page.goto('/');
  const { viewport, previous, next } = carousel(page);
  await expectPosition(page, 1);
  await expectDisabledWithoutActivation(page, previous, 1);
  await next.click();
  await expectPosition(page, 2);
  await viewport.focus();
  await page.keyboard.press('Tab');
  const notes = page.getByRole('textbox', { name: 'Forest notes' });
  await expect(notes).toBeFocused();
  await page.keyboard.press('Home');
  await expectPosition(page, 2);
  await viewport.focus();
  await page.keyboard.press('ArrowRight');
  await expectPosition(page, 3);
  await expectDisabledWithoutActivation(page, next, 3);
  await previous.focus();
  await page.keyboard.press('Space');
  await expectPosition(page, 2);
  await expect(previous).toBeFocused();
  await viewport.focus();
  await page.keyboard.press('Home');
  await expectPosition(page, 1);
  await page.keyboard.press('End');
  await expectPosition(page, 3);
  await expect(viewport).toBeFocused();

  // Direction is inherited from HTML, not a separate JS direction provider.
  await viewport.evaluate((node) => {
    node.closest('section')?.setAttribute('dir', 'rtl');
  });
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowLeft');
  await expectPosition(page, 2);
  await test.info().attach('carousel-keyboard-and-pointer', {
    body: JSON.stringify({
      states: ['initial', 'first', 'last', 'disabled'],
      inputs: [
        'click',
        'Tab',
        'Enter',
        'Space',
        'ArrowRight',
        'Home',
        'End',
        'RTL ArrowLeft',
      ],
      position: await carousel(page).status.textContent(),
    }),
    contentType: 'application/json',
  });
});

test('[carousel.navigation] native touch swipe updates the status and endpoints', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.setViewportSize({ width: 400, height: 720 });
  const { viewport, previous } = carousel(page);
  await viewport.scrollIntoViewIfNeeded();
  const box = await viewport.boundingBox();
  if (!box) throw new Error('The carousel viewport has no box');
  const client = await context.newCDPSession(page);
  const y = Math.round(box.y + box.height / 2);
  const x = Math.round(box.x + box.width * 0.85);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y }],
  });
  for (let step = 1; step <= 10; step++) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: Math.round(x - step * box.width * 0.07), y }],
    });
  }
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await expectPosition(page, 2);
  await expect(previous).toBeEnabled();
  await test.info().attach('carousel-native-touch', {
    body: JSON.stringify({
      input: 'Chromium CDP touch',
      viewportWidth: box.width,
      position: await carousel(page).status.textContent(),
    }),
    contentType: 'application/json',
  });
});

async function expectViewportOutline(viewport: Locator) {
  const outline = await viewport.evaluate((node) => {
    const style = getComputedStyle(node);
    return { width: parseFloat(style.outlineWidth), style: style.outlineStyle };
  });
  expect(outline.style).toBe('solid');
  expect(outline.width).toBeGreaterThanOrEqual(2);
}

test('[carousel.visual] contrast, targets, reflow, forced colors and reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/');
  const { root, viewport, next, previous } = carousel(page);
  await root.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  // Enlarging the text reflows the page; bring the carousel back into view so
  // axe does not treat off-screen slides as partially obscured.
  await root.scrollIntoViewIfNeeded();
  const controlLayout = await root
    .locator('.ui-carousel__controls')
    .evaluate((node) => ({
      scrollWidth: node.scrollWidth,
      clientWidth: node.clientWidth,
    }));
  expect(controlLayout.scrollWidth).toBe(controlLayout.clientWidth);
  for (const button of [previous, next]) {
    const target = await button.boundingBox();
    expect(target?.width).toBeGreaterThanOrEqual(24);
    expect(target?.height).toBeGreaterThanOrEqual(24);
  }

  for (const sample of await measureRenderedColors(
    page,
    `${section} [role="status"]`,
  )) {
    expect(sample.text).toBeGreaterThanOrEqual(4.5);
  }

  const axe = await new AxeBuilder({ page }).include(section).analyze();
  await test.info().attach('carousel-axe', {
    body: JSON.stringify(axe),
    contentType: 'application/json',
  });
  expect(axe.violations).toEqual([]);
  expect(axe.incomplete).toEqual([]);

  await expectPosition(page, 1);
  await next.click();
  await expectPosition(page, 2);
  await page.emulateMedia({ forcedColors: 'active' });
  await next.focus();
  await page.keyboard.press('Tab');
  await expect(viewport).toBeFocused();
  await expectViewportOutline(viewport);
});

test('Carousel detectors reject an enabled boundary and a missing focus indicator', async ({
  page,
}) => {
  await page.goto('/');
  const { viewport, previous, next } = carousel(page);
  await previous.evaluate((button) => button.removeAttribute('aria-disabled'));
  await expect(
    expectDisabledWithoutActivation(page, previous, 1, 1000),
  ).rejects.toThrow();
  await page.emulateMedia({ forcedColors: 'active' });
  await page.addStyleTag({
    content: `${section} .ui-carousel__viewport:focus-visible { outline: none !important; }`,
  });
  await next.focus();
  await page.keyboard.press('Tab');
  await expect(viewport).toBeFocused();
  await expect(expectViewportOutline(viewport)).rejects.toThrow();
});
