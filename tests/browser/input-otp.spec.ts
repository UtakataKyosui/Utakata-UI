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

function otp(page: Page) {
  const section = page.getByRole('region', { name: 'Input OTP' });
  const group = section.getByRole('group', { name: 'Verification code' });
  return {
    section,
    group,
    slots: group.getByRole('textbox'),
    events: section.getByLabel('Input OTP events'),
  };
}

async function verifyKeyboardPaste(page: Page) {
  const { section, group, slots, events } = otp(page);
  const values = async () =>
    slots.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLInputElement).value),
    );
  await expect(slots).toHaveCount(4, { timeout });
  await section.getByRole('button', { name: 'Before code' }).focus();
  // Tab enters the code once, at the first slot.
  await page.keyboard.press('Tab');
  await expect(slots.nth(0)).toBeFocused({ timeout });
  await page.keyboard.type('12');
  await expect(slots.nth(2)).toBeFocused({ timeout });
  await expect.poll(values, { timeout }).toEqual(['1', '2', '', '']);
  await page.keyboard.press('ArrowLeft');
  await expect(slots.nth(1)).toBeFocused({ timeout });
  await page.keyboard.press('Home');
  await expect(slots.nth(0)).toBeFocused({ timeout });
  await page.keyboard.press('End');
  await expect(slots.nth(2)).toBeFocused({ timeout });
  // Backspace on an empty slot moves back and clears the previous character.
  await page.keyboard.press('Backspace');
  await expect.poll(values, { timeout }).toEqual(['1', '', '', '']);
  await expect(slots.nth(1)).toBeFocused({ timeout });
  // Rejected characters are not entered.
  await page.keyboard.type('x');
  await expect.poll(values, { timeout }).toEqual(['1', '', '', '']);
  // Typing to completion reports the value once and does not submit.
  await page.keyboard.type('234');
  await expect.poll(values, { timeout }).toEqual(['1', '2', '3', '4']);
  await expect(events).toContainText('complete:1234', { timeout });
  // Tab leaves the code; the group is a single tab stop.
  await page.keyboard.press('Tab');
  await expect(slots.nth(3)).not.toBeFocused({ timeout });
  // A real clipboard paste fills every slot.
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.evaluate(() => navigator.clipboard.writeText('9876'));
  await slots.nth(0).focus();
  await page.keyboard.press('ControlOrMeta+V');
  await expect.poll(values, { timeout }).toEqual(['9', '8', '7', '6']);
  await expect(events).toContainText('complete:9876', { timeout });
  await expect(group).toBeVisible({ timeout });
}

test('[input-otp.keyboard-paste] real browser behavior', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  const id = 'input-otp.keyboard-paste';
  const rules = componentManifest.components.InputOTP.qualityRules.filter(
    (rule) => rule.id === id && rule.verification === 'browser',
  );
  expect(rules).toHaveLength(1);
  const report = await evaluateQuality(rules, {
    [id]: async () => {
      await verifyKeyboardPaste(page);
      const axe = await new AxeBuilder({ page })
        .include('section[aria-label="Input OTP"]')
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

test('Input OTP detector catches swallowed keys', async ({ page }) => {
  timeout = 1000;
  await page.goto('/');
  await page.evaluate(() => {
    const block = (event: Event) => event.stopImmediatePropagation();
    document.addEventListener('keydown', block, true);
    document.addEventListener('beforeinput', block, true);
  });
  await expect(verifyKeyboardPaste(page)).rejects.toThrow();
});
