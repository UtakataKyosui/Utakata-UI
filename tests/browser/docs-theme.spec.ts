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

test('docs header icons stay transparent over the selected theme', async ({
  page,
}) => {
  const theme = await readFile(
    new URL('../../packages/docs/theme.css', import.meta.url),
    'utf8',
  );
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/?layout');
  await page.locator('html').evaluate((html) => {
    html.dataset.theme = 'dark';
    document.body.insertAdjacentHTML(
      'afterbegin',
      '<header data-blume-header><button data-blume-nav-toggle>Menu</button><button data-blume-search-open>Search</button><button data-blume-theme-toggle>Theme</button></header>',
    );
  });
  await page.addStyleTag({ content: theme.replace(/^@import .*;$/gm, '') });

  for (const name of ['Menu', 'Search', 'Theme']) {
    const button = page
      .locator('[data-blume-header]')
      .getByRole('button', { name, exact: true });
    await expect(button).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(button).toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)');
  }
});
