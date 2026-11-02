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

const selector = 'section[aria-label="Spinner states"] .ui-spinner__ring';
const sizeCount = componentManifest.components.Spinner.sizes.length;

function verifyMotion(items: RenderedColors[], reduced: boolean) {
  expect(items).toHaveLength(sizeCount);
  for (const item of items) {
    if (reduced) {
      expect(item.animationName, 'reduced motion').toBe('none');
    } else {
      expect(item.animationName, 'default motion').toBe('ui-spinner-rotate');
      expect(item.animationPlayState).toBe('running');
      expect(Number.parseFloat(item.animationDuration)).toBeGreaterThan(0);
    }
  }
}

function verifyRing(items: RenderedColors[]) {
  expect(items).toHaveLength(sizeCount);
  // clientWidth ignores the rotation transform that changes bounding boxes.
  const widths = items.map((item) => item.clientWidth);
  expect(widths, 'sizes increase').toEqual([...widths].sort((a, b) => a - b));
  expect(new Set(widths).size, 'distinct sizes').toBe(sizeCount);
  for (const item of items) {
    expect(item.borderWidth, 'ring thickness').toBeGreaterThanOrEqual(2);
    expect(item.border, 'arc contrast').toBeGreaterThanOrEqual(3);
    // The partial ring only reads as a ring when the arc differs from its
    // track by luminance or by line style, not by hue alone.
    expect(
      item.arcVsTrack >= 1.5 || item.borderStyle !== item.trackBorderStyle,
      'arc versus track',
    ).toBe(true);
  }
}

test('[spinner.motion-theme] rotation, reduced motion, static ring, theme and forced colors', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  const measurements: unknown[] = [];
  const rules = componentManifest.components.Spinner.qualityRules.filter(
    (rule) => rule.verification === 'browser',
  );
  const report = await evaluateQuality(rules, {
    'spinner.motion-theme': async () => {
      await page
        .locator('section[aria-label="Spinner states"]')
        .scrollIntoViewIfNeeded();
      const normal = await measureRenderedColors(page, selector);
      measurements.push({ condition: 'default', normal });
      verifyMotion(normal, false);
      verifyRing(normal);
      const axe = await new AxeBuilder({ page })
        .include('section[aria-label="Spinner states"]')
        .analyze();
      await test.info().attach('spinner-axe', {
        body: JSON.stringify(axe),
        contentType: 'application/json',
      });
      expect(axe.violations).toEqual([]);
      expect(axe.incomplete).toEqual([]);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const reduced = await measureRenderedColors(page, selector);
      measurements.push({ condition: 'reduced-motion', reduced });
      verifyMotion(reduced, true);
      verifyRing(reduced);
      await page.emulateMedia({
        reducedMotion: 'no-preference',
        forcedColors: 'active',
      });
      const forced = await measureRenderedColors(page, selector);
      measurements.push({ condition: 'forced-colors', forced });
      verifyRing(forced);
    },
  });
  await test.info().attach('spinner-evidence', {
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

test('Spinner detector rejects animation under reduced motion', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content:
      '.ui-spinner__ring { animation: ui-spinner-rotate 0.8s linear infinite !important; }',
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const items = await measureRenderedColors(page, selector);
  expect(() => verifyMotion(items, true)).toThrow();
});

test('Spinner detector rejects an arc that matches its track', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content:
      '.ui-spinner__ring { border-block-start-color: color-mix(in srgb, currentColor 25%, transparent) !important; }',
  });
  const items = await measureRenderedColors(page, selector);
  expect(() => verifyRing(items)).toThrow();
});
