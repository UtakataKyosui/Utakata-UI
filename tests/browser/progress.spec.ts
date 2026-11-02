import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import { measureRenderedColors } from './rendered-colors.js';

const section = 'section[aria-label="Progress states"]';
const tracks = `${section} .ui-progress__track`;
const indicators = `${section} .ui-progress__indicator`;
const values = `${section} .ui-progress__value`;
const labels = `${section} .ui-progress__label`;
// Three determinate bars (0, 50, 100) and one indeterminate bar.
const determinate = [0, 50, 100];

async function verifyWidths(page: Page) {
  const tracksBox = await measureRenderedColors(page, tracks);
  const bars = await measureRenderedColors(page, indicators);
  expect(bars).toHaveLength(4);
  determinate.forEach((value, index) => {
    const track = tracksBox[index];
    const bar = bars[index];
    expect(track && bar).toBeTruthy();
    if (!track || !bar) return;
    // The track border is 1px on both sides.
    const inner = track.width - track.borderWidth * 2;
    expect(
      Math.abs(bar.width - (inner * value) / 100),
      `indicator width for ${value}`,
    ).toBeLessThanOrEqual(1);
  });
}

async function verifyContrast(page: Page, forcedColors: boolean) {
  const bars = await measureRenderedColors(page, indicators);
  // The 50% and 100% bars carry a solid fill; 0% has no fill and the
  // indeterminate bar is covered by verifyIndeterminate.
  for (const bar of bars.slice(1, 3)) {
    // The fill is compared with the track and surface it sits on.
    expect(bar.fill, 'fill contrast').toBeGreaterThanOrEqual(3);
  }
  const tracksBox = await measureRenderedColors(page, tracks);
  for (const track of tracksBox) {
    expect(track.borderWidth).toBeGreaterThanOrEqual(1);
    expect(track.border, 'track boundary contrast').toBeGreaterThanOrEqual(3);
  }
  if (forcedColors) return;
  for (const text of [
    ...(await measureRenderedColors(page, values)),
    ...(await measureRenderedColors(page, labels)),
  ])
    expect(text.text, 'text contrast').toBeGreaterThanOrEqual(4.5);
}

async function verifyIndeterminate(page: Page, reduced: boolean) {
  const [bar] = (await measureRenderedColors(page, indicators)).slice(3);
  expect(bar).toBeTruthy();
  if (!bar) return;
  if (reduced) {
    expect(bar.animationName, 'reduced motion').toBe('none');
    expect(bar.backgroundImage, 'static pattern').toContain('gradient');
  } else {
    expect(bar.animationName, 'default motion').toBe(
      'ui-progress-indeterminate',
    );
    expect(bar.animationPlayState).toBe('running');
    expect(Number.parseFloat(bar.animationDuration)).toBeGreaterThan(0);
  }
}

test('[progress.visual-motion] widths, contrast, indeterminate motion and forced colors', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  const rules = componentManifest.components.Progress.qualityRules.filter(
    (rule) => rule.verification === 'browser',
  );
  const report = await evaluateQuality(rules, {
    'progress.visual-motion': async () => {
      await page.locator(section).scrollIntoViewIfNeeded();
      await verifyWidths(page);
      await verifyContrast(page, false);
      await verifyIndeterminate(page, false);
      const axe = await new AxeBuilder({ page }).include(section).analyze();
      await test.info().attach('progress-axe', {
        body: JSON.stringify(axe),
        contentType: 'application/json',
      });
      expect(axe.violations).toEqual([]);
      expect(axe.incomplete).toEqual([]);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await verifyIndeterminate(page, true);
      await verifyContrast(page, false);
      await page.emulateMedia({
        reducedMotion: 'no-preference',
        forcedColors: 'active',
      });
      await verifyWidths(page);
      await verifyContrast(page, true);
    },
  });
  await test.info().attach('progress-evidence', {
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

test('Progress detector rejects a wrong indicator width', async ({ page }) => {
  await page.goto('/');
  await page.addStyleTag({
    content: '.ui-progress__indicator { inline-size: 10% !important; }',
  });
  await expect(verifyWidths(page)).rejects.toThrow();
});

test('Progress detector rejects a fill that matches the track', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content:
      '.ui-progress { --ui-progress-color: #eeeeee !important; } .ui-progress__track { background: #eeeeee !important; }',
  });
  await expect(verifyContrast(page, false)).rejects.toThrow();
});

test('Progress detector rejects indeterminate motion under reduced motion', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content:
      '.ui-progress[data-indeterminate] .ui-progress__indicator { animation: ui-progress-indeterminate 1.5s ease-in-out infinite !important; }',
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(verifyIndeterminate(page, true)).rejects.toThrow();
});
