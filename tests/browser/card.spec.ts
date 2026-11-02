import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import { measureRenderedColors } from './rendered-colors.js';

const roots = 'section[aria-label="Card states"] .ui-card';
const texts = [
  'section[aria-label="Card states"] .ui-card__title',
  'section[aria-label="Card states"] .ui-card__description',
  'section[aria-label="Card states"] .ui-card__content',
  'section[aria-label="Card states"] .ui-card__footer',
].join(', ');

type Layout = {
  paddings: string[];
  clipped: boolean[];
  outside: boolean[];
  heights: number[];
};

async function measureLayout(page: Page): Promise<Layout> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  return page.evaluate((selector) => {
    const cards = [...document.querySelectorAll<HTMLElement>(selector)];
    return {
      paddings: cards.map((card) => {
        const style = getComputedStyle(card);
        return [
          style.paddingTop,
          style.paddingRight,
          style.paddingBottom,
          style.paddingLeft,
        ].join(' ');
      }),
      // Any descendant wider than the card means content overflows or is clipped.
      clipped: cards.map((card) =>
        [card, ...card.querySelectorAll<HTMLElement>('*')].some(
          (node) =>
            node.scrollWidth > node.clientWidth + 1 &&
            getComputedStyle(node).display !== 'inline',
        ),
      ),
      outside: cards.map((card) => {
        const box = card.getBoundingClientRect();
        const viewport = document.documentElement.clientWidth;
        return (
          box.right > viewport + 1 ||
          [...card.querySelectorAll<HTMLElement>('*')].some(
            (node) => node.getBoundingClientRect().right > box.right + 1,
          )
        );
      }),
      heights: cards.map((card) => card.getBoundingClientRect().height),
    };
  }, roots);
}

function verifyLayout(layout: Layout) {
  const count = 4;
  expect(layout.paddings).toHaveLength(count);
  expect(new Set(layout.paddings).size, 'padding per combination').toBe(1);
  expect(layout.clipped, 'clipped content').toEqual(Array(count).fill(false));
  expect(layout.outside, 'content outside card').toEqual(
    Array(count).fill(false),
  );
}

async function verifyColors(page: Page, forcedColors: boolean) {
  const cards = await measureRenderedColors(page, roots);
  expect(cards).toHaveLength(4);
  for (const card of cards) {
    if (forcedColors) {
      expect(card.borderWidth, 'forced-colors border').toBeGreaterThanOrEqual(
        1,
      );
      expect(card.borderStyle).toBe('solid');
      expect(
        card.border,
        'forced-colors border contrast',
      ).toBeGreaterThanOrEqual(3);
    }
  }
  const items = await measureRenderedColors(page, texts);
  expect(items.length).toBeGreaterThanOrEqual(8);
  for (const item of items)
    expect(item.text, 'text contrast').toBeGreaterThanOrEqual(4.5);
}

test('[card.layout-theme] padding, wrapping, contrast and forced colors', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  const measurements: unknown[] = [];
  const rules = componentManifest.components.Card.qualityRules.filter(
    (rule) => rule.verification === 'browser',
  );
  const report = await evaluateQuality(rules, {
    'card.layout-theme': async () => {
      await page
        .locator('section[aria-label="Card states"]')
        .scrollIntoViewIfNeeded();
      const normal = await measureLayout(page);
      measurements.push({ condition: 'default', normal });
      verifyLayout(normal);
      await verifyColors(page, false);
      const axe = await new AxeBuilder({ page })
        .include('section[aria-label="Card states"]')
        .analyze();
      await test.info().attach('card-axe', {
        body: JSON.stringify(axe),
        contentType: 'application/json',
      });
      expect(axe.violations).toEqual([]);
      expect(axe.incomplete).toEqual([]);
      await page.setViewportSize({ width: 320, height: 720 });
      const narrow = await measureLayout(page);
      measurements.push({ condition: '320px', narrow });
      verifyLayout(narrow);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      const large = await measureLayout(page);
      measurements.push({ condition: 'text-size-200', large });
      verifyLayout(large);
      await verifyColors(page, false);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '';
      });
      await page.emulateMedia({ forcedColors: 'active' });
      await verifyColors(page, true);
    },
  });
  await test.info().attach('card-evidence', {
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

test('Card detector rejects inconsistent padding and clipped content', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `section[aria-label="Card states"] .ui-card[data-case="content"] { padding: 0; }
section[aria-label="Card states"] .ui-card[data-case="long"] { overflow-wrap: normal; white-space: nowrap; }`,
  });
  const layout = await measureLayout(page);
  expect(() => verifyLayout(layout)).toThrow();
});

test('Card detector rejects low-contrast text', async ({ page }) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `.ui-card { --ui-card-background: #ffffff; color: #cccccc; }
.ui-card__description { color: #cccccc; }`,
  });
  await expect(verifyColors(page, false)).rejects.toThrow();
});
