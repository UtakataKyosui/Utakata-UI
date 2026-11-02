import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';

async function measure(input: Locator) {
  return input.evaluate((node) => {
    const style = getComputedStyle(node);
    const placeholder = getComputedStyle(node, '::placeholder');
    const box = node.getBoundingClientRect();
    function contrast(first: string, second: string) {
      function luminance(color: string) {
        const match = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(color);
        if (!match) throw new Error(`Unverified color: ${color}`);
        const values = match.slice(1).map((channel) => {
          const value = Number(channel) / 255;
          return value <= 0.04045
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
        });
        return values.reduce(
          (sum, value, index) =>
            sum + value * ([0.2126, 0.7152, 0.0722][index] ?? 0),
          0,
        );
      }
      const a = luminance(first);
      const b = luminance(second);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    }
    return {
      width: box.width,
      height: box.height,
      left: box.left,
      right: box.right,
      text: contrast(style.color, style.backgroundColor),
      placeholder: contrast(placeholder.color, style.backgroundColor),
      border: contrast(style.borderTopColor, style.backgroundColor),
      focus: node.matches(':focus-visible')
        ? contrast(style.outlineColor, style.backgroundColor)
        : null,
      shadow: style.boxShadow,
      outline: style.outlineColor,
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
    };
  });
}

function verifyVisuals(
  value: Awaited<ReturnType<typeof measure>>,
  disabled = false,
) {
  expect(value.width).toBeGreaterThanOrEqual(24);
  expect(value.height).toBeGreaterThanOrEqual(24);
  // Inactive controls are exempt from WCAG contrast thresholds.
  if (!disabled) {
    expect(value.text).toBeGreaterThanOrEqual(4.5);
    expect(value.placeholder).toBeGreaterThanOrEqual(4.5);
    expect(value.border).toBeGreaterThanOrEqual(3);
  }
}

test('[input.visual-theme] sizes, states, contrast, focus and narrow layout', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  const measurements: unknown[] = [];
  const rules = componentManifest.components.Input.qualityRules.filter(
    (rule) => rule.verification === 'browser',
  );
  const report = await evaluateQuality(rules, {
    'input.visual-theme': async () => {
      const section = page.getByRole('region', { name: 'Input states' });
      for (const size of componentManifest.components.Input.sizes) {
        for (const state of ['Input', 'Read only', 'Disabled', 'Invalid']) {
          const input = section.getByRole('textbox', {
            name: `${state} ${size}`,
            exact: true,
          });
          await expect(input).toBeVisible();
          const result = await measure(input);
          measurements.push({ size, state, ...result });
          verifyVisuals(result, state === 'Disabled');
          if (state === 'Invalid') {
            await expect(input).toHaveAttribute('aria-invalid', 'true');
            await expect(input).toHaveAccessibleDescription(
              'Enter a valid contact value.',
            );
          }
          if (state !== 'Disabled') {
            await input.focus();
            await page.keyboard.press('Shift');
            const focused = await measure(input);
            expect(focused.shadow).not.toBe('none');
            expect(focused.focus).toBeGreaterThanOrEqual(3);
          }
        }
        const input = section.getByRole('textbox', {
          name: `Input ${size}`,
          exact: true,
        });
        await input.focus();
        await page.keyboard.press('Tab');
        const readonly = section.getByRole('textbox', {
          name: `Read only ${size}`,
          exact: true,
        });
        await expect(readonly).toBeFocused();
        await page.keyboard.type('ignored');
        await expect(readonly).toHaveValue('Kept value');
        await page.keyboard.press('Tab');
        await expect(
          section.getByRole('textbox', {
            name: `Invalid ${size}`,
            exact: true,
          }),
        ).toBeFocused();
      }
      const axe = await new AxeBuilder({ page })
        .include('section[aria-label="Input states"]')
        .analyze();
      await test.info().attach('input-axe', {
        body: JSON.stringify(axe),
        contentType: 'application/json',
      });
      expect(axe.violations).toEqual([]);
      expect(axe.incomplete).toEqual([]);
      await page.setViewportSize({ width: 320, height: 720 });
      for (const input of await section.locator('input').all()) {
        const result = await measure(input);
        verifyVisuals(result, await input.isDisabled());
        expect(result.left).toBeGreaterThanOrEqual(0);
        expect(result.right).toBeLessThanOrEqual(320);
      }
      await page.emulateMedia({ forcedColors: 'active' });
      for (const input of await section.locator('input:not(:disabled)').all()) {
        await input.focus();
        await page.keyboard.press('Shift');
        const result = await input.evaluate((node) => {
          const style = getComputedStyle(node);
          return {
            width: Number.parseFloat(style.outlineWidth),
            style: style.outlineStyle,
            color: style.outlineColor,
          };
        });
        measurements.push({ forcedColors: true, ...result });
        expect(result.width).toBeGreaterThanOrEqual(2);
        expect(result.style).toBe('solid');
        expect(result.color).not.toMatch(/transparent|rgba\(.+, 0\)/);
      }
    },
  });
  await test.info().attach('input-evidence', {
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

test('Input visual detector rejects low contrast and undersized targets', async ({
  page,
}) => {
  await page.goto('/');
  const input = page.getByRole('textbox', { name: 'Input sm', exact: true });
  await input.evaluate((node) => {
    node.style.color = node.style.backgroundColor = '#fff';
  });
  const lowContrast = await measure(input);
  expect(() => verifyVisuals(lowContrast)).toThrow();
  await input.evaluate((node) => {
    node.style.cssText =
      'min-height:0;height:10px;min-width:0;width:10px;padding:0';
  });
  const small = await measure(input);
  expect(() => verifyVisuals(small)).toThrow();
});
