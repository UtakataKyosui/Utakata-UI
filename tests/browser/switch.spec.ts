import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';

test('[switch.keyboard-pointer] real Space toggles once and respects locked states', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  const rules = componentManifest.components.Switch.qualityRules.filter(
    (rule) => rule.verification === 'browser',
  );
  const report = await evaluateQuality(rules, {
    'switch.keyboard-pointer': async () => {
      const section = page.getByRole('region', { name: 'Switch input' });
      const enabled = section.getByRole('switch', {
        name: 'Enabled switch',
        exact: true,
      });
      const readonly = section.getByRole('switch', {
        name: 'Read only switch',
        exact: true,
      });
      const disabled = section.getByRole('switch', {
        name: 'Disabled switch',
        exact: true,
      });
      const changes = section.getByLabel('Switch changes');
      await section.getByRole('button', { name: 'Before switches' }).focus();
      await page.keyboard.press('Tab');
      await expect(enabled).toBeFocused();
      await page.keyboard.press('Space');
      await expect(enabled).toHaveAttribute('aria-checked', 'true');
      await expect(changes).toHaveText('["Enabled:true"]');
      await section
        .locator('label')
        .filter({ hasText: 'Enabled switch' })
        .click();
      await expect(enabled).toHaveAttribute('aria-checked', 'false');
      await expect(changes).toHaveText('["Enabled:true","Enabled:false"]');
      await enabled.click();
      await expect(enabled).toHaveAttribute('aria-checked', 'true');
      await expect(changes).toHaveText(
        '["Enabled:true","Enabled:false","Enabled:true"]',
      );
      await page.keyboard.press('Tab');
      await expect(readonly).toBeFocused();
      await page.keyboard.press('Space');
      await readonly.click();
      await section
        .getByText('Disabled switch', { exact: true })
        .click({ force: true });
      await expect(readonly).toHaveAttribute('aria-checked', 'false');
      await expect(disabled).toHaveAttribute('aria-checked', 'false');
      await expect(changes).toHaveText(
        '["Enabled:true","Enabled:false","Enabled:true"]',
      );
      const axe = await new AxeBuilder({ page })
        .include('section[aria-label="Switch input"]')
        .analyze();
      await test.info().attach('switch-axe', {
        body: JSON.stringify(axe),
        contentType: 'application/json',
      });
      expect(axe.violations).toEqual([]);
      expect(axe.incomplete).toEqual([]);
    },
  });
  await test.info().attach('switch-keyboard-evidence', {
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

test('Switch detector catches duplicate Space activation', async ({ page }) => {
  await page.goto('/');
  const enabled = page.getByRole('switch', {
    name: 'Enabled switch',
    exact: true,
  });
  await enabled.evaluate((node: HTMLElement) =>
    node.addEventListener('keyup', (event) => {
      if (event.code === 'Space') node.click();
    }),
  );
  await enabled.focus();
  await page.keyboard.press('Space');
  await expect(page.getByLabel('Switch changes')).toHaveText(
    '["Enabled:true","Enabled:false"]',
  );
  await expect(enabled).toHaveAttribute('aria-checked', 'false');
});
