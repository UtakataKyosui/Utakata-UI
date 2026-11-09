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

function select(page: Page) {
  const section = page.getByRole('region', { name: 'Select input' });
  return {
    section,
    trigger: section.getByRole('combobox', { name: 'Theme' }),
    option: (name: string) => page.getByRole('option', { name, exact: true }),
    changes: section.getByLabel('Select changes'),
    formValue: () =>
      section
        .getByRole('form', { name: 'Select form' })
        .evaluate((form: HTMLFormElement) =>
          JSON.stringify([...new FormData(form).entries()]),
        ),
  };
}

async function verifyKeyboardSelection(page: Page) {
  const { section, trigger, option, changes, formValue } = select(page);
  await section.getByRole('button', { name: 'Before select' }).focus();
  await page.keyboard.press('Tab');
  await expect(trigger).toBeFocused({ timeout });
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('listbox')).toBeVisible({ timeout });
  await expect(trigger).toHaveAttribute('aria-expanded', 'true', { timeout });
  await expect(option('System')).toBeFocused({ timeout });
  await page.keyboard.press('ArrowDown');
  await expect(option('Dark')).toBeFocused({ timeout });
  await expect(option('Dark')).toHaveAttribute('aria-disabled', 'true', {
    timeout,
  });
  await page.keyboard.press('Enter');
  await expect(changes).toHaveText('[]', { timeout });
  await page.keyboard.press('l');
  await expect(option('Light')).toBeFocused({ timeout });
  await page.keyboard.press('Enter');
  await expect(page.getByRole('listbox')).toBeHidden({ timeout });
  await expect(trigger).toBeFocused({ timeout });
  await expect(trigger).toHaveText(/Light/, { timeout });
  await expect(changes).toHaveText('["light"]', { timeout });
  expect(await formValue()).toBe('[["theme","light"]]');
  await page.keyboard.press('Tab');
  await expect(
    section.getByRole('button', { name: 'After select' }),
  ).toBeFocused({ timeout });
}

async function verifyEscape(page: Page) {
  const { section, trigger, option, changes, formValue } = select(page);
  await section.getByRole('button', { name: 'Before select' }).focus();
  await page.keyboard.press('Tab');
  await expect(trigger).toBeFocused({ timeout });
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('listbox')).toBeVisible({ timeout });
  // The popup can be visible before Base UI finishes its initial focus effect.
  // Wait for each actual transition before sending the next key.
  await expect(option('System')).toBeFocused({ timeout });
  await page.keyboard.press('ArrowDown');
  await expect(option('Dark')).toBeFocused({ timeout });
  await page.keyboard.press('ArrowDown');
  await expect(option('Light')).toBeFocused({ timeout });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toBeHidden({ timeout });
  await expect(trigger).toBeFocused({ timeout });
  await expect(trigger).toHaveText(/System/, { timeout });
  await expect(changes).toHaveText('[]', { timeout });
  expect(await formValue()).toBe('[["theme","system"]]');
}

async function verifyPopupPositionAndDismiss(page: Page) {
  const { trigger, changes } = select(page);
  await trigger.click();
  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible({ timeout });
  const viewport = page.viewportSize();
  const box = await listbox.boundingBox();
  const triggerBox = await trigger.boundingBox();
  expect(viewport).not.toBeNull();
  expect(box).not.toBeNull();
  expect(triggerBox).not.toBeNull();
  if (!viewport || !box || !triggerBox) return;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  // The popup is aligned with the trigger rather than detached from it.
  expect(Math.abs(box.x - triggerBox.x)).toBeLessThan(triggerBox.width);
  expect(
    Math.min(
      Math.abs(box.y - (triggerBox.y + triggerBox.height)),
      Math.abs(box.y + box.height - triggerBox.y),
      Math.abs(box.y - triggerBox.y),
    ),
  ).toBeLessThan(triggerBox.height * 2 + 16);
  await page.mouse.click(1, 1);
  await expect(listbox).toBeHidden({ timeout });
  await expect(trigger).toHaveText(/System/, { timeout });
  await expect(changes).toHaveText('[]', { timeout });
}

const verifiers = {
  'select.keyboard-selection': verifyKeyboardSelection,
  'select.escape-focus-return': verifyEscape,
  'select.popup-position-dismiss': verifyPopupPositionAndDismiss,
} as const;

for (const [id, verify] of Object.entries(verifiers)) {
  test(`[${id}] real browser behavior`, async ({ page, browser }) => {
    await page.goto('/');
    const rules = componentManifest.components.Select.qualityRules.filter(
      (rule) => rule.id === id && rule.verification === 'browser',
    );
    expect(rules).toHaveLength(1);
    const report = await evaluateQuality(rules, {
      [id]: async () => {
        await verify(page);
        const axe = await new AxeBuilder({ page })
          .include('section[aria-label="Select input"]')
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

test('Select detector catches a popup that ignores Escape and outside press', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/');
  await page.evaluate(() => {
    const block = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
      event.stopImmediatePropagation();
    };
    document.addEventListener('keydown', block, true);
    document.addEventListener('pointerdown', block, true);
  });
  await expect(verifyEscape(page)).rejects.toThrow(/toBeHidden/);
});
