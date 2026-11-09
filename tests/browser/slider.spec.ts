import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';

let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

function slider(page: Page) {
  const section = page.getByRole('region', { name: 'Slider input' });
  return {
    section,
    gain: section.getByRole('slider', { name: 'Gain' }),
    volume: section.getByRole('slider', { name: 'Volume' }),
    events: section.getByLabel('Slider events'),
  };
}

async function verifyKeyboard(page: Page) {
  const { section, gain } = slider(page);
  const now = (value: string) =>
    expect(gain).toHaveAttribute('aria-valuenow', value, { timeout });
  await section.getByRole('button', { name: 'Before slider' }).focus();
  await page.keyboard.press('Tab');
  await expect(gain).toBeFocused({ timeout });
  await now('0.5');
  await page.keyboard.press('ArrowRight');
  await now('0.6');
  await page.keyboard.press('ArrowDown');
  await now('0.5');
  await page.keyboard.press('PageUp');
  await now('1');
  await page.keyboard.press('ArrowRight');
  await now('1');
  await page.keyboard.press('Home');
  await now('0');
  await page.keyboard.press('ArrowLeft');
  await now('0');
  await page.keyboard.press('End');
  await now('1');
  await page.keyboard.press('PageDown');
  await now('0.5');
  await expect(gain).toHaveAttribute('aria-valuetext', '0.5 gain', { timeout });
}

async function verifyPointer(page: Page) {
  const { section, volume, events } = slider(page);
  // The second slider in the fixture is Volume.
  const control = section.locator('.ui-slider__control').nth(1);
  await control.scrollIntoViewIfNeeded();
  const box = await control.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  const at = (ratio: number) => ({
    x: box.x + box.width * ratio,
    y: box.y + box.height / 2,
  });
  // A track press moves the thumb to the pressed position.
  await page.mouse.click(at(0.75).x, at(0.75).y);
  await expect(volume).toHaveAttribute('aria-valuenow', '75', { timeout });
  await expect(events).toContainText('commit:75', { timeout });
  // Dragging the thumb changes the value and commits once on release.
  await page.mouse.move(at(0.75).x, at(0.75).y);
  await page.mouse.down();
  await page.mouse.move(at(0.5).x, at(0.5).y, { steps: 5 });
  await page.mouse.move(at(0.25).x, at(0.25).y, { steps: 5 });
  await page.mouse.up();
  await expect(volume).toHaveAttribute('aria-valuenow', '25', { timeout });
  const log: string[] = JSON.parse((await events.textContent()) ?? '[]');
  expect(log.filter((entry) => entry.startsWith('commit:'))).toEqual([
    'commit:75',
    'commit:25',
  ]);
  expect(log).toContain('change:25');
}

const verifiers = {
  'slider.keyboard': verifyKeyboard,
  'slider.pointer': verifyPointer,
} as const;

for (const [id, verify] of Object.entries(verifiers)) {
  test(`[${id}] real browser behavior`, async ({ page, browser }) => {
    await page.goto('/');
    const rules = componentManifest.components.Slider.qualityRules.filter(
      (rule) => rule.id === id && rule.verification === 'browser',
    );
    expect(rules).toHaveLength(1);
    const report = await evaluateQuality(rules, {
      [id]: async () => {
        await verify(page);
        const axe = await new AxeBuilder({ page })
          .include('section[aria-label="Slider input"]')
          .analyze();
        await test.info().attach(`${id}-axe`, {
          body: JSON.stringify(axe),
          contentType: 'application/json',
        });
        expect(axe.violations).toEqual([]);
        expect(axe.incomplete).toEqual([]);
      },
    });
    await test.info().attach(`${id}-evidence`, {
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
}

test('Slider detector catches swallowed keys and pointer presses', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/');
  await page.evaluate(() => {
    const block = (event: Event) => event.stopImmediatePropagation();
    document.addEventListener('keydown', block, true);
    document.addEventListener('pointerdown', block, true);
  });
  await expect(verifyKeyboard(page)).rejects.toThrow();
  await expect(verifyPointer(page)).rejects.toThrow();
});
