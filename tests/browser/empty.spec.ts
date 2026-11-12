import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const fixture = 'section[aria-label="Empty states"]';
const labels = ['作業記録を追加', 'Review reports'];

async function measureReflow(page: Page) {
  const measurements = await page
    .locator(`${fixture} .ui-empty`)
    .evaluateAll((roots) =>
      roots.map((root) => {
        const { left, right } = root.getBoundingClientRect();
        const clipped = [
          root,
          ...root.querySelectorAll<HTMLElement>('*'),
        ].filter((node) => {
          const rect = node.getBoundingClientRect();
          return (
            node.scrollWidth > node.clientWidth + 1 ||
            rect.left < left - 1 ||
            rect.right > right + 1
          );
        });
        return {
          language: root.getAttribute('lang'),
          width: root.clientWidth,
          outsideViewport:
            left < 0 || right > document.documentElement.clientWidth + 1,
          clipped: clipped.map((node) => node.className),
        };
      }),
    );
  expect(measurements.map(({ language }) => language)).toEqual(['ja', 'en']);
  expect(
    measurements.filter(
      ({ clipped, outsideViewport }) => clipped.length > 0 || outsideViewport,
    ),
    'empty state clipped or outside the viewport',
  ).toEqual([]);
  return measurements;
}

async function checkActions(page: Page, forcedColors: boolean) {
  const states = page.locator(fixture);
  await states.getByRole('button', { name: 'Before empty states' }).focus();
  const results = [];
  for (const label of labels) {
    await page.keyboard.press('Tab');
    const button = states.getByRole('button', { name: label, exact: true });
    await expect(button).toBeFocused({ timeout: 1_000 });
    const focus = await button.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        outline: style.outlineStyle,
        shadow: style.boxShadow,
        keyboard: node.matches(':focus-visible'),
      };
    });
    expect(focus.keyboard).toBe(true);
    if (forcedColors) expect(focus.outline).toBe('solid');
    else expect(focus.shadow).not.toBe('none');
    results.push({ label, focus });
  }
  return results;
}

test('[empty.reflow-actions] bilingual content reflows and named actions retain focus', async ({
  browser,
  page,
}) => {
  await page.goto('/');
  const normal = await measureReflow(page);
  const actions = await checkActions(page, false);
  const axe = await new AxeBuilder({ page }).include(fixture).analyze();
  await test.info().attach('empty-axe', {
    body: JSON.stringify(axe),
    contentType: 'application/json',
  });
  expect(axe.violations).toEqual([]);
  expect(axe.incomplete).toEqual([]);
  await page.setViewportSize({ width: 320, height: 720 });
  const narrow = await measureReflow(page);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  const enlarged = await measureReflow(page);
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  const forcedActions = await checkActions(page, true);
  await test.info().attach('empty-evidence', {
    body: JSON.stringify({
      browser: browser.version(),
      platform: process.platform,
      project: test.info().project.name,
      normal,
      narrow,
      enlarged,
      actions,
      forcedActions,
    }),
    contentType: 'application/json',
  });
});

test('Empty reflow detector rejects nowrap text at narrow width', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/');
  await page.addStyleTag({
    content: '.ui-empty__description { white-space: nowrap; }',
  });
  await expect(measureReflow(page)).rejects.toThrow(
    'empty state clipped or outside the viewport',
  );
});

test('Empty action detector rejects a button without an accessible name', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: '作業記録を追加' })
    .evaluate((button) => {
      button.textContent = '';
    });
  await expect(checkActions(page, false)).rejects.toThrow(/作業記録を追加/);
});
