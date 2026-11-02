import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import { measureRenderedColors } from './rendered-colors.js';

const section = 'section[aria-label="Avatar states"]';
const roots = `${section} .ui-avatar`;
const fallbacks = `${section} .ui-avatar__fallback`;
const sizeCount = componentManifest.components.Avatar.sizes.length;

async function verifyImages(page: Page) {
  await expect(page.locator(`${section} .ui-avatar__image`)).toHaveCount(
    sizeCount,
  );
  const images = await page.evaluate((selector) => {
    return [...document.querySelectorAll<HTMLImageElement>(selector)].map(
      (image) => {
        const box = image.getBoundingClientRect();
        const root = image.closest('.ui-avatar')?.getBoundingClientRect();
        return {
          objectFit: getComputedStyle(image).objectFit,
          width: box.width,
          height: box.height,
          rootWidth: root?.width ?? 0,
          rootHeight: root?.height ?? 0,
          naturalRatio: image.naturalWidth / image.naturalHeight,
          complete: image.complete && image.naturalWidth > 0,
        };
      },
    );
  }, `${section} .ui-avatar__image`);
  for (const image of images) {
    expect(image.complete, 'image loaded').toBe(true);
    // A non-square source only stays undistorted when it is cropped, not stretched.
    expect(image.naturalRatio, 'fixture source is wide').toBeGreaterThan(1.5);
    expect(image.objectFit, 'object-fit').toBe('cover');
    expect(
      Math.abs(image.width - image.height),
      'square image box',
    ).toBeLessThan(1);
    expect(
      Math.abs(image.width - image.rootWidth),
      'image fills avatar',
    ).toBeLessThan(1);
    expect(Math.abs(image.height - image.rootHeight)).toBeLessThan(1);
  }
}

async function verifyShapeAndSizes(page: Page) {
  const avatars = await measureRenderedColors(page, roots);
  expect(avatars).toHaveLength(sizeCount * 2);
  for (const group of [avatars.slice(0, sizeCount), avatars.slice(sizeCount)]) {
    const widths = group.map((item) => item.clientWidth);
    expect(widths, 'sizes increase').toEqual([...widths].sort((a, b) => a - b));
    expect(new Set(widths).size, 'distinct sizes').toBe(sizeCount);
  }
  for (const avatar of avatars)
    expect(Math.abs(avatar.width - avatar.height), 'circle').toBeLessThan(1);
}

async function verifyColors(page: Page, forcedColors: boolean) {
  const items = await measureRenderedColors(page, fallbacks);
  // Fallback text is mounted only while the image is not shown.
  expect(items.length).toBeGreaterThanOrEqual(sizeCount);
  for (const item of items)
    expect(item.text, 'fallback text contrast').toBeGreaterThanOrEqual(4.5);
  if (!forcedColors) return;
  for (const avatar of await measureRenderedColors(page, roots)) {
    expect(avatar.borderWidth, 'forced-colors border').toBeGreaterThanOrEqual(
      1,
    );
    expect(avatar.borderStyle).toBe('solid');
    expect(
      avatar.border,
      'forced-colors border contrast',
    ).toBeGreaterThanOrEqual(3);
  }
}

test('[avatar.visual-theme] image fit, sizes, fallback contrast and forced colors', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  const rules = componentManifest.components.Avatar.qualityRules.filter(
    (rule) => rule.verification === 'browser',
  );
  const report = await evaluateQuality(rules, {
    'avatar.visual-theme': async () => {
      await page.locator(section).scrollIntoViewIfNeeded();
      await verifyImages(page);
      await verifyShapeAndSizes(page);
      await verifyColors(page, false);
      const axe = await new AxeBuilder({ page }).include(section).analyze();
      await test.info().attach('avatar-axe', {
        body: JSON.stringify(axe),
        contentType: 'application/json',
      });
      expect(axe.violations).toEqual([]);
      expect(axe.incomplete).toEqual([]);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      await verifyColors(page, false);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '';
      });
      await page.emulateMedia({ forcedColors: 'active' });
      await verifyColors(page, true);
    },
  });
  await test.info().attach('avatar-evidence', {
    body: JSON.stringify({
      browser: browser.version(),
      platform: process.platform,
      project: test.info().project.name,
      report,
    }),
    contentType: 'application/json',
  });
  expect(report.automatedPassed, formatQualityReport(report.results)).toBe(
    true,
  );
});

test('Avatar detector rejects a stretched image', async ({ page }) => {
  await page.goto('/');
  await page.addStyleTag({
    content: '.ui-avatar__image { object-fit: fill !important; }',
  });
  await expect(verifyImages(page)).rejects.toThrow();
});

test('Avatar detector rejects low-contrast fallback text', async ({ page }) => {
  await page.goto('/');
  await page.addStyleTag({
    content:
      '.ui-avatar { color: #dddddd !important; --ui-avatar-background: #ffffff; background: #ffffff !important; }',
  });
  await expect(verifyColors(page, false)).rejects.toThrow();
});
