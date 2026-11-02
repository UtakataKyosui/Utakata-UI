import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';

async function verifyKeyboard(page: Page, timeout = 5000) {
  const section = page.getByRole('region', { name: 'RadioGroup input' });
  const radio = (name: string) =>
    section.getByRole('radio', { name, exact: true });
  const changes = section.getByLabel('RadioGroup changes');
  const options = { timeout };
  await section.getByRole('button', { name: 'Before radios' }).focus();
  await page.keyboard.press('Tab');
  await expect(radio('free')).toBeFocused(options);
  await expect(radio('free')).toHaveAttribute('aria-checked', 'false', options);
  await page.keyboard.press('ArrowDown');
  await expect(radio('pro')).toBeFocused(options);
  await expect(radio('pro')).toHaveAttribute('aria-checked', 'true', options);
  await expect(radio('team')).toHaveAttribute('aria-checked', 'false', options);
  await expect(changes).toHaveText('["pro"]', options);
  await page.keyboard.press('ArrowUp');
  await expect(radio('free')).toBeFocused(options);
  await expect(radio('free')).toHaveAttribute('aria-checked', 'true', options);
  await expect(changes).toHaveText('["pro","free"]', options);
  await page.keyboard.press('Tab');
  await expect(
    section.getByRole('button', { name: 'After radios' }),
  ).toBeFocused(options);
  await page.keyboard.press('Shift+Tab');
  await expect(radio('free')).toBeFocused(options);
  await radio('team').click({ force: true });
  await expect(radio('team')).toHaveAttribute('aria-checked', 'false', options);
  await expect(changes).toHaveText('["pro","free"]', options);
}

test('[radio-group.keyboard] real Tab and arrow keys move selection and skip disabled items', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  const rules = componentManifest.components.RadioGroup.qualityRules.filter(
    (rule) => rule.verification === 'browser',
  );
  const report = await evaluateQuality(rules, {
    'radio-group.keyboard': async () => {
      await verifyKeyboard(page);
      const axe = await new AxeBuilder({ page })
        .include('section[aria-label="RadioGroup input"]')
        .analyze();
      await test.info().attach('radio-group-axe', {
        body: JSON.stringify(axe),
        contentType: 'application/json',
      });
      expect(axe.violations).toEqual([]);
      expect(axe.incomplete).toEqual([]);
    },
  });
  await test.info().attach('radio-group-keyboard-evidence', {
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

test('RadioGroup detector catches suppressed arrow navigation', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('radiogroup', { name: 'Plan' })
    .evaluate((node: HTMLElement) =>
      node.addEventListener(
        'keydown',
        (event) => {
          if (event.key.startsWith('Arrow')) event.stopImmediatePropagation();
        },
        true,
      ),
    );
  await expect(verifyKeyboard(page, 1000)).rejects.toThrow();
});
