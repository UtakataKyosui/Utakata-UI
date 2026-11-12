import { expect, type Page, test } from '@playwright/test';

async function verifyResponsiveProps(page: Page, timeout = 5000) {
  const card = page.getByTestId('lism-card');
  const padding = () =>
    card.evaluate((node) => getComputedStyle(node).paddingTop);
  await page.setViewportSize({ width: 320, height: 800 });
  await expect
    .poll(padding, { timeout, message: 'base card padding' })
    .toBe('16px');
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect.poll(padding).toBe('32px');
  // Lism breakpoints are container queries. A narrow ancestor at the same
  // wide viewport must return to the base value.
  const container = page.getByTestId('lism-container');
  await container.evaluate((node) => {
    node.style.width = '320px';
  });
  await expect.poll(padding).toBe('16px');
  await container.evaluate((node) => {
    node.style.removeProperty('width');
  });
  await expect.poll(padding).toBe('32px');
  await expect(card).not.toHaveAttribute('p');
  return {
    narrowPadding: '16px',
    widePadding: await padding(),
    narrowContainerAtWideViewport: '16px',
  };
}

test.beforeEach(async ({ page }) => {
  await page.goto('/?lism');
});

test('[lism.rendered-props] responsive styling retains actions and modal keyboard behavior', async ({
  page,
  browser,
}) => {
  const measurements = await verifyResponsiveProps(page);
  const button = page.getByRole('button', { name: 'Save account' });
  await button.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('status', { name: 'Saved count' })).toHaveText(
    '1',
  );
  await page.keyboard.press('Tab');
  const trigger = page.getByRole('button', { name: 'Review account' });
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Enter');
  const popup = page.getByRole('dialog', { name: 'Review account' });
  await expect(popup).toBeVisible();
  await expect
    .poll(() => popup.evaluate((node) => getComputedStyle(node).paddingTop))
    .toBe('32px');
  await page.keyboard.press('Escape');
  await expect(popup).toBeHidden();
  await expect(trigger).toBeFocused();
  await test.info().attach('lism-style-evidence', {
    body: JSON.stringify({ browser: browser.version(), measurements }),
    contentType: 'application/json',
  });
});

test('responsive styling detector rejects an overridden padding contract', async ({
  page,
}) => {
  await page.addStyleTag({
    content: '[data-testid="lism-card"] { padding: 0 !important; }',
  });
  await expect(verifyResponsiveProps(page, 1000)).rejects.toThrow(
    /base card padding/,
  );
});

const wideImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='100'%3E%3Crect width='400' height='100' fill='%23557'/%3E%3C/svg%3E";

async function verifyAspectRatios(page: Page, timeout = 5000) {
  const size = (testId: string) =>
    page.getByTestId(testId).evaluate((node) => {
      const { width, height } = node.getBoundingClientRect();
      return { width, height, ratio: width / height };
    });
  const close = (actual: number, expected: number) =>
    Math.abs(actual - expected) < 0.02;
  // Before the image has a source, the frame already reserves its ratio.
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect
    .poll(async () => close((await size('aspect-media')).ratio, 16 / 9), {
      timeout,
      message: 'ratio before image load',
    })
    .toBe(true);
  const before = await size('aspect-media');
  // Load an image with a different intrinsic ratio; the frame must not follow it.
  const image = page.getByTestId('aspect-image');
  await image.evaluate(
    (node, src) =>
      new Promise<void>((resolve) => {
        node.addEventListener('load', () => resolve(), { once: true });
        node.setAttribute('src', src);
      }),
    wideImage,
  );
  const after = await size('aspect-media');
  expect(close(after.ratio, 16 / 9), 'ratio after image load').toBe(true);
  expect(Math.abs(after.height - before.height)).toBeLessThan(1);
  // The image fills the frame (object-fit: cover) rather than using its own size.
  const imageHeight = await image.evaluate(
    (node) => node.getBoundingClientRect().height,
  );
  expect(Math.abs(imageHeight - after.height)).toBeLessThan(1);
  // A narrower ancestor changes the width; the ratio is retained.
  const container = page.getByTestId('lism-container');
  await container.evaluate((node) => {
    node.style.width = '320px';
  });
  await expect
    .poll(async () => (await size('aspect-media')).width, { timeout })
    .toBeLessThanOrEqual(320);
  const narrow = await size('aspect-media');
  expect(close(narrow.ratio, 16 / 9), 'ratio at narrow width').toBe(true);
  // Responsive ratios follow the container width, not the viewport.
  expect(close((await size('aspect-responsive')).ratio, 1), 'base ratio').toBe(
    true,
  );
  await container.evaluate((node) => {
    node.style.removeProperty('width');
  });
  await expect
    .poll(async () => close((await size('aspect-responsive')).ratio, 16 / 9), {
      timeout,
    })
    .toBe(true);
  // Overflowing content is clipped by the frame instead of stretching it.
  const long = await size('aspect-long');
  expect(close(long.ratio, 4 / 3), 'ratio with long content').toBe(true);
  const clipped = await page.getByTestId('aspect-long').evaluate((node) => ({
    overflow: getComputedStyle(node).overflow,
    scrollHeight: node.scrollHeight,
    clientHeight: node.clientHeight,
  }));
  expect(clipped.overflow).toBe('hidden');
  expect(clipped.scrollHeight).toBeGreaterThan(clipped.clientHeight);
  return {
    beforeLoad: before,
    afterLoad: after,
    narrowContainer: narrow,
    longContent: long,
    longContentClipped: clipped,
  };
}

test('[lism.aspect-ratio-frame] frames keep their ratio across width, image load and long content', async ({
  page,
  browser,
}) => {
  const measurements = await verifyAspectRatios(page);
  await test.info().attach('aspect-ratio-evidence', {
    body: JSON.stringify({ browser: browser.version(), measurements }),
    contentType: 'application/json',
  });
});

test('aspect ratio detector rejects a frame whose ratio is overridden', async ({
  page,
}) => {
  await page.addStyleTag({
    content: '[data-testid="aspect-media"] { aspect-ratio: auto !important; }',
  });
  await expect(verifyAspectRatios(page, 1000)).rejects.toThrow(
    /ratio before image load/,
  );
});
