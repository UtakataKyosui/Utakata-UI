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

test('[assistive.control-name] focusing the email control announces its visible name', async ({
  page,
  screenReader,
}) => {
  const input = page.getByLabel('Contact email / 連絡先', { exact: true });
  const output = await screenReader.capture(() => input.focus());
  expect(output.spokenPhrase).toContain('Contact email');
  await expect(input).toBeFocused();
});

test('[assistive.dialog-output] opening and closing the dialog announces context and returns focus', async ({
  page,
  screenReader,
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
  screenReader,
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
