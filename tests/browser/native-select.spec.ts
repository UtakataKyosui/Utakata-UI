import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import { contrast } from './color-contrast.js';

test('[native-select.browser-behavior] keyboard, labels, disabled and rendered themes', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  const measurements: unknown[] = [];
  const rules = componentManifest.components.NativeSelect.qualityRules.filter(
    (rule) => rule.verification === 'browser',
  );
  const report = await evaluateQuality(rules, {
    'native-select.browser-behavior': async () => {
      const section = page.getByRole('region', { name: 'NativeSelect states' });
      for (const size of componentManifest.components.NativeSelect.sizes) {
        const select = section.getByRole('combobox', {
          name: `Country ${size}`,
          exact: true,
        });
        await expect(select).toHaveAccessibleDescription('Used for shipping.');
        await select.focus();
        // Native type-ahead selects without relying on OS popup automation.
        await page.keyboard.press('u');
        await expect(select).toHaveValue('us');
        const data = await select.evaluate((node: HTMLSelectElement) => {
          if (!node.form) throw new Error('Missing form');
          return Object.fromEntries(new FormData(node.form));
        });
        expect(data.country).toBe('us');
        expect(data).not.toHaveProperty('disabled');
        await page.keyboard.press('Tab');
        const invalid = section.getByRole('combobox', {
          name: `Invalid country ${size}`,
          exact: true,
        });
        await expect(invalid).toBeFocused();
        await expect(invalid).toHaveAttribute('aria-invalid', 'true');
        await expect(invalid).toHaveAccessibleDescription(
          'Choose a valid country.',
        );
        for (const control of [
          select,
          invalid,
          section.getByRole('combobox', { name: `Disabled country ${size}` }),
        ]) {
          const disabled = await control.isDisabled();
          if (!disabled) {
            await control.focus();
            await page.keyboard.press('Shift');
          }
          const style = await control.evaluate((node) => {
            const css = getComputedStyle(node);
            const box = node.getBoundingClientRect();
            const icon = node.parentElement?.querySelector(
              '.ui-native-select__icon',
            );
            if (!icon) throw new Error('Missing decorative arrow');
            return {
              width: box.width,
              height: box.height,
              text: css.color,
              background: css.backgroundColor,
              border: css.borderTopColor,
              outline: css.outlineColor,
              outlineWidth: Number.parseFloat(css.outlineWidth),
              icon: getComputedStyle(icon).color,
              pointerEvents: getComputedStyle(icon).pointerEvents,
              hidden: icon.getAttribute('aria-hidden'),
            };
          });
          measurements.push({ size, disabled, ...style });
          expect(style.width).toBeGreaterThanOrEqual(24);
          expect(style.height).toBeGreaterThanOrEqual(24);
          expect(style.pointerEvents).toBe('none');
          expect(style.hidden).toBe('true');
          if (!disabled) {
            expect(
              contrast(style.text, style.background),
            ).toBeGreaterThanOrEqual(4.5);
            expect(
              contrast(style.border, style.background),
            ).toBeGreaterThanOrEqual(3);
            expect(
              contrast(style.icon, style.background),
            ).toBeGreaterThanOrEqual(3);
            expect(
              contrast(style.outline, style.background),
            ).toBeGreaterThanOrEqual(3);
            expect(style.outlineWidth).toBeGreaterThanOrEqual(2);
          }
        }
        await section
          .getByRole('button', { name: `Reset country ${size}`, exact: true })
          .click();
        await expect(select).toHaveValue('jp');
      }
      const axe = await new AxeBuilder({ page })
        .include('section[aria-label="NativeSelect states"]')
        .analyze();
      await test.info().attach('native-select-axe', {
        body: JSON.stringify(axe),
        contentType: 'application/json',
      });
      expect(axe.violations).toEqual([]);
      expect(axe.incomplete).toEqual([]);
    },
  });
  await test.info().attach('native-select-evidence', {
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

test('NativeSelect detector catches broken label and disabled semantics', async ({
  page,
}) => {
  await page.goto('/');
  const select = page
    .getByRole('region', { name: 'NativeSelect states' })
    .locator('select')
    .first();
  await select.evaluate((node) => {
    node.removeAttribute('id');
    node.removeAttribute('aria-labelledby');
  });
  const axe = await new AxeBuilder({ page })
    .include('section[aria-label="NativeSelect states"]')
    .analyze();
  expect(axe.violations.map(({ id }) => id)).toContain('select-name');
  const disabled = page.getByRole('combobox', {
    name: 'Disabled country sm',
    exact: true,
  });
  await disabled.evaluate((node) => node.removeAttribute('disabled'));
  await select.focus();
  await page.keyboard.press('Tab');
  await expect(disabled).toBeFocused();
});
