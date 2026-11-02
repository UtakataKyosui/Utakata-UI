import { expect, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';

test('[checkbox.reset-browser] canceled reset preserves selection and form values', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  const values: unknown[] = [];
  const rules = componentManifest.components.Checkbox.qualityRules.filter(
    (rule) => rule.verification === 'browser',
  );
  const report = await evaluateQuality(rules, {
    'checkbox.reset-browser': async () => {
      for (const canceled of [false, true]) {
        for (const defaultChecked of [false, true]) {
          const name = `Reset ${canceled ? 'canceled' : 'allowed'} default ${defaultChecked}`;
          const checkbox = page.getByRole('checkbox', { name, exact: true });
          await checkbox.click();
          await expect(checkbox).toHaveAttribute(
            'aria-checked',
            String(!defaultChecked),
          );
          await page.getByRole('button', { name, exact: true }).click();
          // Cross the next browser task so the deferred reset handler has run.
          await page.evaluate(
            () => new Promise<void>((resolve) => setTimeout(resolve, 0)),
          );
          const checked = canceled ? !defaultChecked : defaultChecked;
          await expect(checkbox).toHaveAttribute(
            'aria-checked',
            String(checked),
          );
          const submitted = await checkbox.evaluate((node) => {
            const form = node.closest('form');
            if (!form) throw new Error('Missing form');
            return new FormData(form).get('choice');
          });
          expect(submitted).toBe(checked ? 'yes' : null);
          values.push({ canceled, defaultChecked, checked, submitted });
        }
      }
    },
  });
  await test.info().attach('checkbox-reset-evidence', {
    body: JSON.stringify({
      browser: browser.version(),
      platform: process.platform,
      project: test.info().project.name,
      report,
      values,
    }),
    contentType: 'application/json',
  });
  expect(report.automatedPassed, formatQualityReport(report.results)).toBe(
    true,
  );
});
