import { expect, test } from '@playwright/test';
import { coverage } from './coverage.js';

test('[coverage.public-configurations] every registered public axis is rendered, including variant × size', async ({
  page,
}) => {
  await page.goto('/');
  const measurements: unknown[] = [];
  for (const [component, entry] of Object.entries(coverage)) {
    const axes = Object.entries(entry.axes);
    // Full Cartesian product for visual axes. State transitions are separate
    // rule tests; this does not claim every state × axis combination was run.
    let selectors: string[] = [entry.selector];
    for (const [axis, values] of axes) {
      selectors = selectors.flatMap((selector) =>
        (values as readonly (string | number)[]).map((value) =>
          axis === 'headingLevels'
            ? `${selector} h${value}`
            : axis === 'orientations'
              ? `${selector}[data-orientation="${value}"]`
              : `${selector}${entry.selector}--${value}`,
        ),
      );
    }
    for (const selector of axes.length ? selectors : []) {
      const locator = page.locator(selector).first();
      await expect(locator, `${component}: ${selector}`).toBeVisible();
      measurements.push({
        component,
        selector,
        rectangle: await locator.boundingBox(),
      });
    }
  }
  await expect(
    page.getByRole('button', { name: 'Unavailable', exact: true }),
  ).toBeDisabled();
  await expect(page.locator('.ui-separator[aria-hidden="true"]')).toHaveCount(
    1,
  );
  await expect(page.getByRole('separator')).toHaveCount(1);
  await test.info().attach('public-configurations-evidence', {
    body: JSON.stringify({ registry: coverage, measurements }),
    contentType: 'application/json',
  });
});

test('public configuration detector rejects a removed fixture', async ({
  page,
}) => {
  await page.goto('/');
  const selector = '.ui-button.ui-button--solid.ui-button--lg';
  await expect(page.locator(selector).first()).toBeVisible();
  await page.locator(selector).evaluateAll((nodes) => {
    for (const node of nodes) node.remove();
  });
  async function verifyFixture() {
    await expect(page.locator(selector)).toBeVisible({ timeout: 500 });
  }
  await expect(verifyFixture()).rejects.toThrow(/toBeVisible/);
});
