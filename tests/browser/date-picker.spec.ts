import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';

function parts(page: Page) {
  const form = page.getByRole('form', { name: 'Booking date form' });
  return {
    form,
    input: form.getByRole('textbox', { name: 'Booking date' }),
    trigger: form.getByRole('button', { name: 'Open booking calendar' }),
    popup: page.getByRole('dialog', { name: 'Choose booking date' }),
  };
}

async function verifyEscape(page: Page, timeout = 5000) {
  const { input, trigger, popup } = parts(page);
  await input.focus();
  await page.keyboard.press('Tab');
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(
    popup.getByRole('button', { name: /November 10, 2026/ }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(popup, 'Escape dismisses the calendar').toBeHidden({ timeout });
  await expect(trigger).toBeFocused();
}

async function verifyKeyboard(page: Page) {
  const { form, input, trigger, popup } = parts(page);
  await expect(input).toHaveAccessibleDescription('Use YYYY-MM-DD.');
  await verifyEscape(page);
  await page.keyboard.press('Space');
  await expect(
    popup.getByRole('button', { name: /November 10, 2026/ }),
  ).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('2026-11-11');
  await expect(popup).toBeHidden();
  await expect(trigger).toBeFocused();

  await input.fill('2026-02-30');
  const submit = form.getByRole('button', { name: 'Submit booking' });
  const submissions = form.getByLabel('Booking submissions');
  await submit.click();
  await expect(submissions).toHaveText('0');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(input).toHaveAccessibleDescription(/Enter a valid ISO date/);
  expect(
    await form.evaluate((node: HTMLFormElement) => node.checkValidity()),
  ).toBe(false);

  await input.fill('2026-11-04');
  await expect(input).toHaveAccessibleDescription(/This date is unavailable/);
  await input.fill('');
  await expect(input).not.toHaveAttribute('aria-invalid');
  await expect(input).toHaveValue('');
  await input.fill('2026-12-15');
  expect(
    await form.evaluate((node: HTMLFormElement) =>
      new FormData(node).get('bookingDate'),
    ),
  ).toBe('2026-12-15');
  await submit.click();
  await expect(submissions).toHaveText('1');
  await trigger.click();
  await expect(
    popup.getByRole('button', { name: /December 15, 2026/ }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await form.getByRole('button', { name: 'Reset booking' }).click();
  await expect(input).toHaveValue('2026-11-10');
  await expect(
    form.getByRole('textbox', { name: 'Closed date' }),
  ).toBeDisabled();
  await expect(
    form.getByRole('button', { name: 'カレンダーを開く' }),
  ).toBeDisabled();
  await trigger.click();
  await expect(popup).toBeVisible();
  const popupId = await popup.getAttribute('id');
  expect(popupId).toBeTruthy();
  await expect(trigger).toHaveAttribute('aria-controls', popupId ?? '');
}

async function verifyVisuals(page: Page) {
  const { input, trigger, popup } = parts(page);
  await page.setViewportSize({ width: 320, height: 760 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await input.fill('2026-02-30');
  await page.keyboard.press('Tab');
  await expect(input).toHaveAccessibleDescription(/Enter a valid ISO date/);
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveCSS('transition-duration', '0s');
  await page.keyboard.press('Enter');
  await expect(popup).toHaveCSS('transition-duration', '0s');
  const popupBox = await popup.boundingBox();
  expect(popupBox?.x).toBeGreaterThanOrEqual(0);
  if (!popupBox) throw new Error('Missing popup bounds');
  expect(popupBox.x + popupBox.width).toBeLessThanOrEqual(320);
  expect(
    await popup.evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  await page.keyboard.press('Escape');

  await page.emulateMedia({ forcedColors: 'active' });
  await expect(trigger).toBeFocused();
  await expect(trigger, 'Date Picker forced-colors focus outline').toHaveCSS(
    'outline-style',
    'solid',
    { timeout: 1000 },
  );
  expect(
    await trigger.evaluate((node) =>
      Number.parseFloat(getComputedStyle(node).outlineWidth),
    ),
  ).toBeGreaterThanOrEqual(2);
}

async function assertAxe(page: Page, selector: string, id: string) {
  await page.locator(selector).first().scrollIntoViewIfNeeded();
  const axe = await new AxeBuilder({ page }).include(selector).analyze();
  await test.info().attach(`${id}-axe`, {
    body: JSON.stringify(axe),
    contentType: 'application/json',
  });
  expect(axe.violations).toEqual([]);
  expect(axe.incomplete).toEqual([]);
}

const verifiers = {
  'date-picker.keyboard': verifyKeyboard,
  'date-picker.visual-states': verifyVisuals,
};

for (const [id, verify] of Object.entries(verifiers)) {
  test(`[${id}] integrated date entry`, async ({ page, browser }) => {
    await page.goto('/');
    const rules = componentManifest.components.DatePicker.qualityRules.filter(
      (rule) => rule.id === id && rule.verification === 'browser',
    );
    expect(rules).toHaveLength(1);
    const report = await evaluateQuality(rules, {
      [id]: async () => {
        await assertAxe(page, '.ui-date-picker', id);
        await verify(page);
        // The portal's focus guards are outside the popup. Verify the
        // trigger's portal ID directly and audit each rendered surface.
        if (id === 'date-picker.keyboard') {
          await assertAxe(page, '.ui-date-picker__popup', `${id}-open`);
        }
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

test('Date Picker detector rejects swallowed Escape', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape') event.stopImmediatePropagation();
      },
      true,
    );
  });
  await expect(verifyEscape(page, 1000)).rejects.toThrow(
    /Escape dismisses the calendar/,
  );
});

test('Date Picker detector rejects a missing forced-colors outline', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `
      @media (forced-colors: active) {
        .ui-date-picker button.ui-popover__trigger:focus-visible { outline: none !important; }
      }
    `,
  });
  await expect(verifyVisuals(page)).rejects.toThrow(
    /Date Picker forced-colors focus outline/,
  );
});
