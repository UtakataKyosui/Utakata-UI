import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const locale of ['ja', 'en']) {
  test(`palette command and clipboard work in ${locale}`, async ({
    page,
    context,
  }, testInfo) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(`/?palette=${locale}`);
    const field = page.getByRole('textbox', {
      name: locale === 'ja' ? '初期化コマンド' : 'Initialization command',
      exact: true,
    });
    await expect(field).toHaveValue(/--palette/);
    const initial = await field.inputValue();
    const json = initial.split("--palette '")[1]?.slice(0, -1);
    expect(JSON.parse(json ?? '{}').dark.primary).toBe('#9bb9ff');
    await page
      .getByLabel(locale === 'ja' ? '編集する配色' : 'Color scheme to edit')
      .selectOption('dark');
    // The OS color picker is outside this fixture's automation scope. Dispatch
    // an input update to check serialization; copy activation below uses real keys.
    await page
      .getByLabel(locale === 'ja' ? 'メインカラー' : 'Primary color', {
        exact: true,
      })
      .evaluate((node) => {
        const setter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value',
        )?.set;
        setter?.call(node, '#c4b5fd');
        node.dispatchEvent(new Event('input', { bubbles: true }));
      });
    await expect(field).toHaveValue(/"dark":\{"primary":"#c4b5fd"/);
    const copy = page.getByRole('button', {
      name:
        locale === 'ja'
          ? '初期化コマンドをコピー'
          : 'Copy initialization command',
      exact: true,
    });
    await copy.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status')).toHaveText(
      locale === 'ja' ? 'コマンドをコピーしました。' : 'Command copied.',
    );
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      await field.inputValue(),
    );
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations).toEqual([]);
    await testInfo.attach(`palette-${locale}-axe`, {
      body: JSON.stringify(axe),
      contentType: 'application/json',
    });
    await page
      .getByLabel('Registry URL', { exact: true })
      .fill('http://example.com');
    await expect(copy).toBeDisabled();
    await expect(
      page.getByLabel('Registry URL', { exact: true }),
    ).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('status')).toBeEmpty();
    await page
      .getByLabel('Registry URL', { exact: true })
      .fill('https://example.com/docs/registry/v1');
    await expect(copy).toBeEnabled();
    await page.setViewportSize({ width: 320, height: 800 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}

test('clipboard denial offers a selectable command rather than reporting success', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {
          throw new Error('denied');
        },
      },
    });
  });
  await page.goto('/?palette=en');
  const field = page.getByRole('textbox', {
    name: 'Initialization command',
    exact: true,
  });
  await expect(field).toHaveValue(/--palette/);
  await page
    .getByRole('button', { name: 'Copy initialization command' })
    .click();
  await expect(page.getByRole('status')).toContainText('Copy failed');
  await expect(field).toBeFocused();
  expect(
    await field.evaluate(
      (node: HTMLTextAreaElement) => node.selectionEnd - node.selectionStart,
    ),
  ).toBe((await field.inputValue()).length);
});
