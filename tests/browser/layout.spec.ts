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

async function verifyOpenDialog(page: Page, timeout = 5000) {
  const popup = page.getByRole('dialog', {
    name: 'Review settings / 設定確認',
  });
  await expect(popup).toBeVisible({ timeout });
  const overflow = await measureOverflow(page, '.ui-dialog__popup');
  expect(overflow.clipped, 'Dialog horizontal clipping').toEqual([false]);
  expect(overflow.outside, 'Dialog content outside bounds').toEqual([false]);
  const verticalClipping = await popup.evaluate((root) =>
    [root, ...root.querySelectorAll<HTMLElement>('*')].some((node) => {
      const style = getComputedStyle(node);
      return (
        style.display !== 'inline' &&
        ['hidden', 'clip'].includes(style.overflowY) &&
        node.scrollHeight > node.clientHeight + 1
      );
    }),
  );
  expect(verticalClipping, 'Dialog vertical clipping').toBe(false);
  const content = [];
  for (const locator of [
    popup.getByRole('heading'),
    popup.locator('.ui-dialog__description'),
    popup.getByRole('button', { name: 'Close / 閉じる' }),
  ]) {
    await expect(locator, 'Dialog content is visible').toBeVisible({ timeout });
    await locator.scrollIntoViewIfNeeded();
    await expect(locator, 'Dialog content reaches viewport').toBeInViewport({
      ratio: 1,
      timeout,
    });
    const bounds = await locator.evaluate((node) => {
      const box = node.getBoundingClientRect();
      const root = node.closest('[role="dialog"]');
      if (!root) throw new Error('Missing Dialog');
      const parent = root.getBoundingClientRect();
      const hit = document.elementFromPoint(
        box.x + box.width / 2,
        box.y + box.height / 2,
      );
      return {
        top: box.top,
        bottom: box.bottom,
        parentTop: parent.top,
        parentBottom: parent.bottom,
        reachable: !!hit && (hit === node || node.contains(hit)),
      };
    });
    expect(bounds.top, 'Dialog content top').toBeGreaterThanOrEqual(
      bounds.parentTop,
    );
    expect(bounds.bottom, 'Dialog content bottom').toBeLessThanOrEqual(
      bounds.parentBottom,
    );
    expect(bounds.reachable, 'Dialog content is unobscured').toBe(true);
    content.push(bounds);
  }
  return { overflow, verticalClipping, content };
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
    '.layout-contract, .layout-contract *, .ui-dialog__popup, .ui-dialog__popup * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } .layout-contract p, .ui-dialog__popup p { margin-block-end: 2em !important; }',
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
    const dialogContent = await verifyOpenDialog(page);
    // The fixture has one action. Real Tab must reach it, and Enter must close
    // the popup; Escape alone would not prove the Close action is available.
    await page.keyboard.press('Tab');
    await expect(
      popup.getByRole('button', { name: 'Close / 閉じる' }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(popup).toBeHidden();
    await expect(
      page.getByRole('button', { name: 'Review / 確認', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(popup).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(popup).toBeHidden();
    await expect(
      page.getByRole('button', { name: 'Review / 確認', exact: true }),
    ).toBeFocused();
    await test.info().attach('reflow-evidence', {
      body: JSON.stringify({
        measurements,
        dialog: box,
        dialogContent,
        limit: 'text scaling, not browser zoom',
      }),
      contentType: 'application/json',
    });
  });
}

for (const [name, css, error] of [
  [
    'fixed-height popup',
    '.ui-dialog__popup { height: 40px !important; overflow: hidden !important; }',
    /Dialog vertical clipping/,
  ],
  [
    'clipped description',
    '.ui-dialog__description { height: 10px !important; overflow: hidden !important; }',
    /Dialog vertical clipping/,
  ],
  [
    'hidden Close action',
    '.ui-dialog__popup button { visibility: hidden !important; }',
    /Dialog content is visible/,
  ],
] as const) {
  test(`Dialog content detector rejects ${name}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page
      .getByRole('button', { name: 'Review / 確認', exact: true })
      .focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.addStyleTag({ content: css });
    await expect(verifyOpenDialog(page, 500)).rejects.toThrow(error);
  });
}

async function verifyInteractionContrast(page: Page) {
  const measurements = [];
  for (const [index, button] of (
    await page.locator('.layout-contract > .ui-button').all()
  ).entries()) {
    await button.hover();
    const selector = `.${(await button.getAttribute('class'))?.trim().split(/\s+/).join('.')}`;
    const hover = await measureRenderedColors(page, selector);
    for (const item of hover)
      expect(item.text, 'hover contrast').toBeGreaterThanOrEqual(4.5);
    await button.focus();
    // Keep the round trip inside the document. Shift+Tab from its first
    // control enters browser chrome, whose return path differs by engine.
    for (const key of index === 0 ? ['Tab', 'Shift+Tab'] : ['Shift+Tab', 'Tab'])
      await page.keyboard.press(key);
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
