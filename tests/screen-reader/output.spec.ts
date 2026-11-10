import { release, version } from 'node:os';
import { screenReader as nativeReader } from '@guidepup/guidepup';
import {
  type ScreenReaderPlaywright,
  screenReaderTest as test,
} from '@guidepup/playwright';
import { expect, type Locator } from '@playwright/test';

async function tabToControl(reader: ScreenReaderPlaywright, target: Locator) {
  for (let count = 0; count < 32; count++) {
    await reader.press('Tab', { capture: true });
    if (await target.evaluate((node) => node === document.activeElement))
      return;
  }
  throw new Error(
    'Reader keyboard did not reach the target control within 32 Tab presses.',
  );
}

test.beforeEach(async ({ page, screenReader }) => {
  // Setup installs assets for the directly pinned core package. The adapter
  // must use that same singleton rather than a second installed core version.
  expect(screenReader).toBe(nativeReader);
  // The browser matrix covers every visual variant. Reader output needs only
  // the named field and modal; traversing 21 unrelated buttons adds minutes of
  // spoken usage hints on VoiceOver before reaching either target.
  await page.goto('/?reader');
  // Bringing a tab to front does not select it in the OS screen reader.
  // The official integration activates the browser and enters web content.
  await screenReader.navigateToWebContent();
});

test.afterEach(async ({ browser, page, screenReader }) => {
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
  // Firefox on Windows can hang closing its accessibility tree after NVDA has
  // exited. Close the page while the reader can still service it, then stop
  // the reader explicitly. Cleanup failures must fail, not be swallowed by
  // the adapter's best-effort finalizer.
  try {
    await page.close();
  } finally {
    await screenReader.stop();
  }
});

test('[assistive.control-name] reader navigation announces the email control name and role', async ({
  page,
  screenReader,
}) => {
  const input = page.getByLabel('Contact email / 連絡先', { exact: true });
  await expect(input).toBeVisible();
  await tabToControl(screenReader, input);
  const phrase = await screenReader.lastSpokenPhrase();
  expect(phrase).toContain('Contact email');
  expect(phrase).toMatch(/edit|text.*field/i);
});

test('[assistive.dialog-output] opening and closing the dialog announces context and returns focus', async ({
  page,
  screenReader,
}) => {
  const trigger = page.getByRole('button', {
    name: 'Review / 確認',
    exact: true,
  });
  await tabToControl(screenReader, trigger);
  await screenReader.press('Enter', { capture: true });
  const opened = await screenReader.lastSpokenPhrase();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(opened).toContain('設定確認');
  await screenReader.press('Escape', { capture: true });
  const closed = await screenReader.lastSpokenPhrase();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(closed).toContain('Review');
});

test('output detector rejects a control whose accessible name was replaced', async ({
  page,
  screenReader,
}) => {
  // Keep a structural locator: replacing the name must not invalidate the
  // locator before the capture action can focus the same control.
  const input = page.locator('.layout-contract input');
  await expect(input).toHaveCount(1);
  await page
    .getByText('Contact email / 連絡先', { exact: true })
    .evaluate((node) => node.remove());
  await input.evaluate((node) => {
    node.removeAttribute('aria-labelledby');
    node.setAttribute('aria-label', 'Negative control');
  });
  await tabToControl(screenReader, input);
  const phrase = await screenReader.lastSpokenPhrase();
  expect(phrase).toContain('Negative control');
  expect(phrase).toMatch(/edit|text.*field/i);
  expect(() => expect(phrase).toContain('Contact email')).toThrow();
});
