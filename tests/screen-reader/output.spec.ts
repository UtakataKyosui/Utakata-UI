import { release, version } from 'node:os';
import { screenReader } from '@guidepup/guidepup';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await screenReader.start({ restoreUserScreenReader: false });
  await page.goto('/?layout');
  await page.bringToFront();
});

test.afterEach(async ({ browser }) => {
  try {
    await test.info().attach('screen-reader-output', {
      body: JSON.stringify({
        reader: screenReader.name,
        readerVersion: screenReader.version,
        os: version(),
        osRelease: release(),
        browser: browser.version(),
        project: test.info().project.name,
        phrases: await screenReader.spokenPhraseLog(),
        limit:
          'Captured screen reader output; no user comprehension assessment.',
      }),
      contentType: 'application/json',
    });
  } finally {
    await screenReader.stop();
  }
});

test('[assistive.control-name] focusing the email control announces its visible name', async ({
  page,
}) => {
  const input = page.getByLabel('Contact email / 連絡先', { exact: true });
  const output = await screenReader.capture(() => input.focus());
  expect(output.spokenPhrase).toContain('Contact email');
  await expect(input).toBeFocused();
});

test('[assistive.dialog-output] opening and closing the dialog announces context and returns focus', async ({
  page,
}) => {
  const trigger = page.getByRole('button', {
    name: 'Review / 確認',
    exact: true,
  });
  await trigger.focus();
  const opened = await screenReader.capture(() => page.keyboard.press('Enter'));
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(opened.spokenPhrase).toContain('設定確認');
  const closed = await screenReader.capture(() =>
    page.keyboard.press('Escape'),
  );
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(closed.spokenPhrase).toContain('Review');
});

test('output detector rejects a control whose accessible name was replaced', async ({
  page,
}) => {
  const input = page.getByLabel('Contact email / 連絡先', { exact: true });
  await input.evaluate((node) => {
    node.removeAttribute('aria-labelledby');
    node.setAttribute('aria-label', 'Negative control');
  });
  const output = await screenReader.capture(() => input.focus());
  expect(output.spokenPhrase).toContain('Negative control');
  expect(() =>
    expect(output.spokenPhrase).toContain('Contact email'),
  ).toThrow();
});
