import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('docs theme keeps destructive Button text and background in the selected palette', async ({
  page,
}) => {
  const tokens = await readFile(
    new URL('../../packages/docs/site/theme-tokens.css', import.meta.url),
    'utf8',
  );

  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto('/?layout');
  await page.addStyleTag({ content: tokens });

  const button = page.getByRole('button', {
    name: 'destructive md 保存',
    exact: true,
  });
  await page.locator('html').evaluate((html) => {
    html.dataset.theme = 'dark';
  });
  await expect(button).toHaveCSS('background-color', 'rgb(255, 180, 171)');
  await expect(button).toHaveCSS('color', 'rgb(58, 10, 6)');

  await page.emulateMedia({ colorScheme: 'dark' });
  await page.locator('html').evaluate((html) => {
    html.dataset.theme = 'light';
  });
  await expect(button).toHaveCSS('background-color', 'rgb(180, 35, 24)');
  await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)');
});
