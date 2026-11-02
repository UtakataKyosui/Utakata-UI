import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';

test('[textarea.keyboard-input] Enter, maxLength, form values and Tab order', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  const rules = componentManifest.components.Textarea.qualityRules.filter(
    (rule) => rule.verification === 'browser',
  );
  const values: unknown[] = [];
  const report = await evaluateQuality(rules, {
    'textarea.keyboard-input': async () => {
      const section = page.getByRole('region', { name: 'Textarea states' });
      for (const size of componentManifest.components.Textarea.sizes) {
        const textarea = section.getByRole('textbox', {
          name: `Notes ${size}`,
          exact: true,
        });
        await expect(textarea).toHaveAccessibleDescription(
          'Up to 8 characters, including line breaks.',
        );
        await textarea.focus();
        await page.keyboard.type('abc');
        await page.keyboard.press('Enter');
        await page.keyboard.type('defghijkl');
        await expect(textarea).toHaveValue('abc\ndefg');
        const data = await textarea.evaluate((node: HTMLTextAreaElement) => {
          if (!node.form) throw new Error('Missing form association');
          return Object.fromEntries(new FormData(node.form));
        });
        values.push({ size, data });
        expect(data.notes).toBe('abc\ndefg');
        expect(data.readonly).toBe('Kept value');
        expect(data).not.toHaveProperty('disabled');
        await page.keyboard.press('Tab');
        const readonly = section.getByRole('textbox', {
          name: `Read only notes ${size}`,
          exact: true,
        });
        await expect(readonly).toBeFocused();
        await page.keyboard.type('ignored');
        await expect(readonly).toHaveValue('Kept value');
        await page.keyboard.press('Tab');
        const invalid = section.getByRole('textbox', {
          name: `Invalid notes ${size}`,
          exact: true,
        });
        await expect(invalid).toBeFocused();
        await expect(invalid).toHaveAttribute('aria-invalid', 'true');
        await expect(invalid).toHaveAccessibleDescription(
          'Enter a valid note.',
        );
      }
      const axe = await new AxeBuilder({ page })
        .include('section[aria-label="Textarea states"]')
        .analyze();
      await test.info().attach('textarea-axe', {
        body: JSON.stringify(axe),
        contentType: 'application/json',
      });
      expect(axe.violations).toEqual([]);
      expect(axe.incomplete).toEqual([]);
    },
  });
  await test.info().attach('textarea-evidence', {
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

test('Textarea maxLength detector catches a missing browser constraint', async ({
  page,
}) => {
  await page.goto('/');
  const textarea = page.getByRole('textbox', { name: 'Notes sm', exact: true });
  await textarea.evaluate((node) => node.removeAttribute('maxlength'));
  await textarea.focus();
  await page.keyboard.type('123456789');
  expect(await textarea.inputValue()).toHaveLength(9);
  expect((await textarea.inputValue()).length <= 8).toBe(false);
});
