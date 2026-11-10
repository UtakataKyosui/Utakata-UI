import { release, version } from 'node:os';
import { screenReader as nativeReader } from '@guidepup/guidepup';
import { screenReaderTest as test } from '@guidepup/playwright';
import { expect } from '@playwright/test';

test.beforeEach(async ({ page, screenReader }) => {
  // Setup installs assets for the directly pinned core package. The adapter
  // must use that same singleton rather than a second installed core version.
  expect(screenReader).toBe(nativeReader);
  await page.goto('/?layout');
  // Bringing a tab to front does not select it in the OS screen reader.
  // The official integration activates the browser and enters web content.
  await screenReader.navigateToWebContent();
});

test.afterEach(async ({ browser, screenReader }) => {
  await test.info().attach('screen-reader-output', {
    body: JSON.stringify({
      reader: screenReader.name,
      readerVersion: screenReader.version,
      os: version(),
      osRelease: release(),
      browser: browser.version(),
      project: test.info().project.name,
      phrases: await screenReader.spokenPhraseLog(),
      limit: 'Captured screen reader output; no user comprehension assessment.',
    }),
    contentType: 'application/json',
  });
});

test('[assistive.control-name] reader navigation announces the email control name and role', async ({
  page,
  screenReader,
}) => {
  const input = page.getByLabel('Contact email / 連絡先', { exact: true });
  await expect(input).toBeVisible();
  await screenReader.navigateNextUntil(
    (phrase) =>
      phrase.includes('Contact email') && /edit|text field/i.test(phrase),
    { maxNavigationAttempts: 80 },
  );
  expect(await screenReader.lastSpokenPhrase()).toContain('Contact email');
});

test('[assistive.dialog-output] opening and closing the dialog announces context and returns focus', async ({
  page,
  screenReader,
}) => {
  const trigger = page.getByRole('button', {
    name: 'Review / 確認',
    exact: true,
  });
  // DOM focus alone does not move NVDA's browse cursor. A real user reaches
  // the trigger with the reader before opening the modal, so establish both.
  await screenReader.navigateNextUntil(/Review/, { maxNavigationAttempts: 80 });
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
  screenReader,
}) => {
  // Keep a structural locator: replacing the name must not invalidate the
  // locator before the capture action can focus the same control.
  const input = page.locator('.layout-contract input');
  await expect(input).toHaveCount(1);
  await input.evaluate((node) => {
    node.removeAttribute('aria-labelledby');
    node.setAttribute('aria-label', 'Negative control');
  });
  await screenReader.navigateNextUntil(
    (phrase) =>
      phrase.includes('Negative control') && /edit|text field/i.test(phrase),
    { maxNavigationAttempts: 80 },
  );
  const phrase = await screenReader.lastSpokenPhrase();
  expect(phrase).toContain('Negative control');
  expect(() => expect(phrase).toContain('Contact email')).toThrow();
});
