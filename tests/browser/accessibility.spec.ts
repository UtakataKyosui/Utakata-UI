import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';

async function audit(page: Page, name: string, selector?: string) {
  const builder = new AxeBuilder({ page });
  if (selector) builder.include(selector);
  const results = await builder.analyze();
  await test.info().attach(name, {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  });
  expect(results.violations).toEqual([]);
  expect(
    results.incomplete,
    'Axe checks requiring review remain unverified',
  ).toEqual([]);
}

test.beforeEach(async ({ page, browser }) => {
  await test.info().attach('environment', {
    body: JSON.stringify({
      browser: browser.version(),
      platform: process.platform,
      node: process.version,
      project: test.info().project.name,
    }),
    contentType: 'application/json',
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Accessibility fixtures' }),
  ).toBeVisible();
});

test('all button variants/sizes and field pass rendered axe checks', async ({
  page,
}) => {
  for (const variant of componentManifest.components.Button.variants) {
    for (const size of componentManifest.components.Button.sizes) {
      await expect(
        page.getByRole('button', { name: `${variant} ${size}`, exact: true }),
      ).toBeVisible();
    }
  }
  await expect(
    page.getByRole('textbox', { name: 'Email' }),
  ).toHaveAccessibleDescription('Enter your contact email.');
  await audit(page, 'default-axe');
});

test('keyboard activates buttons and dialog traps and restores focus', async ({
  page,
}) => {
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'solid sm', exact: true }),
  ).toBeFocused();
  const trigger = page.getByRole('button', { name: 'Open settings' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleDescription('Update your preferences.');
  for (const key of ['Tab', 'Shift+Tab', 'Tab']) {
    await page.keyboard.press(key);
    await expect
      .poll(() =>
        dialog.evaluate((node) => node.contains(document.activeElement)),
      )
      .toBe(true);
  }
  // Audit the visible popup; background inertness is checked by keyboard above.
  await audit(page, 'dialog-axe', '[role="dialog"]');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Space');
  await expect(dialog).toBeVisible();
  await page.getByRole('button', { name: 'Close settings' }).focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('audit harness detects missing names and low contrast', async ({
  page,
}) => {
  // Deliberately invalid DOM is isolated from valid component fixtures and source lint.
  await page.evaluate(() => {
    const button = document.createElement('button');
    document.querySelector('main')?.append(button);
    const text = document.createElement('p');
    text.textContent = 'Unreadable example';
    text.style.cssText = 'color:#eee;background:#fff';
    document.querySelector('main')?.append(text);
  });
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map(({ id }) => id)).toEqual(
    expect.arrayContaining(['button-name', 'color-contrast']),
  );
});
