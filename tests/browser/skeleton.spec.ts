import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import {
  measureRenderedColors,
  type RenderedColors,
} from './rendered-colors.js';

const selector = 'section[aria-label="Skeleton states"] .ui-skeleton';

function verifyMotion(items: RenderedColors[], reduced: boolean) {
  expect(items).toHaveLength(2);
  for (const item of items) {
    if (reduced) {
      expect(item.animationName, 'reduced motion').toBe('none');
    } else {
      expect(item.animationName, 'default motion').toBe('ui-skeleton-pulse');
      expect(item.animationPlayState).toBe('running');
      expect(Number.parseFloat(item.animationDuration)).toBeGreaterThan(0);
    }
  }
}

function verifyVisible(items: RenderedColors[], forcedColors: boolean) {
  for (const item of items) {
    expect(item.width).toBeGreaterThan(0);
    expect(item.height).toBeGreaterThan(0);
    if (forcedColors) {
      expect(item.borderWidth, 'forced-colors border').toBeGreaterThanOrEqual(
        1,
      );
      expect(item.borderStyle).toBe('solid');
      expect(
        item.border,
        'forced-colors border contrast',
      ).toBeGreaterThanOrEqual(3);
    } else {
      // The placeholder fill must be distinguishable from its surface.
      expect(item.fill, 'placeholder fill').toBeGreaterThanOrEqual(1.1);
    }
  }
}

test('[skeleton.motion-theme] animation, reduced motion, theme and forced colors', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  const measurements: unknown[] = [];
  const rules = componentManifest.components.Skeleton.qualityRules.filter(
    (rule) => rule.verification === 'browser',
  );
  const report = await evaluateQuality(rules, {
    'skeleton.motion-theme': async () => {
      await page
        .locator('section[aria-label="Skeleton states"]')
        .scrollIntoViewIfNeeded();
      const normal = await measureRenderedColors(page, selector);
      measurements.push({ condition: 'default', normal });
      verifyMotion(normal, false);
      verifyVisible(normal, false);
      const axe = await new AxeBuilder({ page })
        .include('section[aria-label="Skeleton states"]')
        .analyze();
      await test.info().attach('skeleton-axe', {
        body: JSON.stringify(axe),
        contentType: 'application/json',
      });
      expect(axe.violations).toEqual([]);
      expect(axe.incomplete).toEqual([]);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const reduced = await measureRenderedColors(page, selector);
      measurements.push({ condition: 'reduced-motion', reduced });
      verifyMotion(reduced, true);
      verifyVisible(reduced, false);
      await page.emulateMedia({
        reducedMotion: 'no-preference',
        forcedColors: 'active',
      });
      const forced = await measureRenderedColors(page, selector);
      measurements.push({ condition: 'forced-colors', forced });
      verifyVisible(forced, true);
    },
  });
  await test.info().attach('skeleton-evidence', {
    body: JSON.stringify({
      browser: browser.version(),
      platform: process.platform,
      project: test.info().project.name,
      report,
      measurements,
    }),
    contentType: 'application/json',
  });
  expect(report.automatedPassed, formatQualityReport(report.results)).toBe(
    true,
  );
});

test('Skeleton detector rejects animation under reduced motion', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `.ui-skeleton { animation: ui-skeleton-pulse 1.5s ease-in-out infinite !important; }`,
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const items = await measureRenderedColors(page, selector);
  expect(() => verifyMotion(items, true)).toThrow();
});

test('Skeleton detector rejects an invisible placeholder', async ({ page }) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `.ui-skeleton { background: transparent !important; }`,
  });
  const items = await measureRenderedColors(page, selector);
  expect(() => verifyVisible(items, false)).toThrow();
});
