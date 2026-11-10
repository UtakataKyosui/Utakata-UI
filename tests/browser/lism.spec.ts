import { expect, type Page, test } from '@playwright/test';

async function verifyResponsiveProps(page: Page) {
  const card = page.getByTestId('lism-card');
  const padding = () =>
    card.evaluate((node) => getComputedStyle(node).paddingTop);
  await page.setViewportSize({ width: 320, height: 800 });
  await expect.poll(padding).toBe('16px');
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect.poll(padding).toBe('32px');
  await expect(card).not.toHaveAttribute('p');
  return { narrowPadding: '16px', widePadding: await padding() };
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
  await expect(verifyResponsiveProps(page)).rejects.toThrow();
});
