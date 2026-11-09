import { expect, type Page, test } from '@playwright/test';
import { measureOverflow, measureRenderedColors } from './rendered-colors.js';

async function verifyTargets(page: Page) {
  const measurements = [];
  for (const target of await page
    .locator('.layout-contract button, .layout-contract input')
    .all()) {
    await target.scrollIntoViewIfNeeded();
    const measurement = await target.evaluate((node) => {
      const box = node.getBoundingClientRect();
      const hit = document.elementFromPoint(
        box.x + box.width / 2,
        box.y + box.height / 2,
      );
      return {
        name: node.textContent || node.getAttribute('type'),
        width: box.width,
        height: box.height,
        hit: hit === node || (!!hit && node.contains(hit)),
      };
    });
    expect(measurement.width, 'target width').toBeGreaterThanOrEqual(24);
    expect(measurement.height, 'target height').toBeGreaterThanOrEqual(24);
    expect(measurement.hit, 'target is reachable').toBe(true);
    measurements.push(measurement);
  }
  expect(measurements.length).toBeGreaterThan(0);
  return measurements;
}

async function verifyReflow(page: Page) {
  const measurement = await measureOverflow(page, '.layout-contract');
  expect(measurement.clipped, 'text spacing/reflow clipping').toEqual([false]);
  expect(measurement.outside, 'text spacing/reflow outside viewport').toEqual([
    false,
  ]);
  await expect(
    page.getByLabel('Contact email / 連絡先', { exact: true }),
  ).toHaveAccessibleDescription(/メールアドレス/);
  await expect(
    page.getByText('Enter a valid email address / 入力を修正してください。'),
  ).toBeVisible();
  return measurement;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/?layout');
});

test('[theme.target-size] all Button variants/sizes and Field have reachable 24px targets', async ({
  page,
}) => {
  const measurements = await verifyTargets(page);
  await test.info().attach('target-evidence', {
    body: JSON.stringify(measurements),
    contentType: 'application/json',
  });
});

for (const [id, css] of [
  ['theme.reflow', ''],
  ['theme.text-size', 'html { font-size: 200%; }'],
  [
    'theme.text-spacing',
    '.layout-contract, .layout-contract * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } .layout-contract p { margin-block-end: 2em !important; }',
  ],
] as const) {
  test(`[${id}] content and operation remain available at 320 CSS px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    if (css) await page.addStyleTag({ content: css });
    const measurements = [{ condition: id, result: await verifyReflow(page) }];
    await page
      .getByRole('button', { name: 'Review / 確認', exact: true })
      .focus();
    await page.keyboard.press('Enter');
    const popup = page.getByRole('dialog', {
      name: 'Review settings / 設定確認',
    });
    await expect(popup).toBeVisible();
    const box = await popup.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.x).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);
    await page.keyboard.press('Escape');
    await expect(popup).toBeHidden();
    await expect(
      page.getByRole('button', { name: 'Review / 確認', exact: true }),
    ).toBeFocused();
    await test.info().attach('reflow-evidence', {
      body: JSON.stringify({
        measurements,
        dialog: box,
        limit: 'text scaling, not browser zoom',
      }),
      contentType: 'application/json',
    });
  });
}

async function verifyInteractionContrast(page: Page) {
  const measurements = [];
  for (const button of await page
    .locator('.layout-contract > .ui-button')
    .all()) {
    await button.hover();
    const selector = `.${(await button.getAttribute('class'))?.trim().split(/\s+/).join('.')}`;
    const hover = await measureRenderedColors(page, selector);
    for (const item of hover)
      expect(item.text, 'hover contrast').toBeGreaterThanOrEqual(4.5);
    await button.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(button).toBeFocused();
    const focus = await measureRenderedColors(page, selector);
    for (const item of focus)
      expect(item.text, 'focus contrast').toBeGreaterThanOrEqual(4.5);
    measurements.push({ selector, hover, focus });
  }
  await test.info().attach('interaction-contrast-evidence', {
    body: JSON.stringify(measurements),
    contentType: 'application/json',
  });
}

test('[theme.interaction-contrast] enabled Button variants/sizes retain rendered text contrast on hover and keyboard focus', async ({
  page,
}) => {
  await verifyInteractionContrast(page);
});

test('interaction contrast detector rejects unreadable text', async ({
  page,
}) => {
  await page.addStyleTag({
    content:
      '.layout-contract button { color: white !important; background: white !important; transition: none !important; }',
  });
  await expect(verifyInteractionContrast(page)).rejects.toThrow(
    /hover contrast/,
  );
});

async function verifyReducedMotion(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const values = await page
    .locator('.layout-contract > .ui-button')
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const style = getComputedStyle(node);
        return {
          animation: style.animationName,
          transition: style.transitionDuration,
        };
      }),
    );
  expect(values.length).toBeGreaterThan(0);
  for (const value of values) {
    expect(value.animation, 'reduced motion animation').toBe('none');
    expect(value.transition, 'reduced motion transition').toBe('0s');
  }
  return values;
}

test('[theme.reduced-motion] reducing motion removes Button animation and transitions', async ({
  page,
}) => {
  const measurements = await verifyReducedMotion(page);
  await page
    .getByRole('button', { name: 'Review / 確認', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await test.info().attach('reduced-motion-evidence', {
    body: JSON.stringify(measurements),
    contentType: 'application/json',
  });
});

test('reduced motion detector rejects retained transitions', async ({
  page,
}) => {
  await page.addStyleTag({
    content: '.layout-contract button { transition: color 10s !important; }',
  });
  await expect(verifyReducedMotion(page)).rejects.toThrow(
    /reduced motion transition/,
  );
});

test('target detector rejects an undersized control', async ({ page }) => {
  await page.addStyleTag({
    content:
      '.layout-contract button { min-height: 0 !important; width: 10px !important; height: 10px !important; padding: 0 !important; overflow: hidden !important; }',
  });
  await expect(verifyTargets(page)).rejects.toThrow(
    /target width|target height/,
  );
});

test('reflow detector rejects clipped long content', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addStyleTag({
    content:
      '.layout-contract p { width: 800px; white-space: nowrap; overflow: hidden; }',
  });
  await expect(verifyReflow(page)).rejects.toThrow(/clipping|outside viewport/);
});
