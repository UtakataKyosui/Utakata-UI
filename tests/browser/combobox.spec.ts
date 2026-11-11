import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import { measureOverflow, measureRenderedColors } from './rendered-colors.js';

let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

function combobox(page: Page) {
  const section = page.getByRole('region', { name: 'Combobox input' });
  return {
    section,
    input: section.getByRole('combobox', { name: 'Fruit', exact: true }),
    listbox: page.getByRole('listbox'),
    option: (name: string) => page.getByRole('option', { name, exact: true }),
    changes: section.getByLabel('Combobox changes'),
    submits: section.getByLabel('Combobox submits'),
    formValue: () =>
      section
        .getByRole('form', { name: 'Combobox form' })
        .evaluate((form: HTMLFormElement) =>
          JSON.stringify([...new FormData(form).entries()]),
        ),
  };
}

async function focusInput(page: Page) {
  const { section, input } = combobox(page);
  await section.getByRole('button', { name: 'Before combobox' }).focus();
  await page.keyboard.press('Tab');
  await expect(input).toBeFocused({ timeout });
}

async function highlighted(page: Page, name: string) {
  const { input, option } = combobox(page);
  await expect(option(name)).toHaveAttribute('data-highlighted', '', {
    timeout,
  });
  const id = await option(name).getAttribute('id');
  expect(id).not.toBeNull();
  await expect(input).toHaveAttribute('aria-activedescendant', id as string, {
    timeout,
  });
  // Virtual focus: DOM focus never leaves the input.
  await expect(input).toBeFocused();
}

async function verifyKeyboardSelection(page: Page) {
  const { section, input, listbox, option, changes, submits, formValue } =
    combobox(page);
  await focusInput(page);
  // The Trigger and Clear buttons are pointer-only: the input is the only Tab stop.
  await page.keyboard.type('ap');
  await expect(listbox).toBeVisible({ timeout });
  await expect(input).toHaveAttribute('aria-expanded', 'true', { timeout });
  await expect(page.getByRole('option')).toHaveText(['Apple', 'Grape'], {
    timeout,
  });
  await page.keyboard.press('ArrowDown');
  await highlighted(page, 'Apple');
  await page.keyboard.press('ArrowDown');
  await highlighted(page, 'Grape');
  await page.keyboard.press('ArrowUp');
  await highlighted(page, 'Apple');
  // A disabled option is never selected.
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('an');
  await expect(page.getByRole('option')).toHaveText(['Banana'], { timeout });
  await expect(option('Banana')).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(changes).toHaveText('[]', { timeout });
  expect(await formValue()).toBe('[["fruit",""]]');
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('ap');
  await expect(option('Apple')).toBeVisible({ timeout });
  await page.keyboard.press('ArrowDown');
  await highlighted(page, 'Apple');
  await page.keyboard.press('Enter');
  await expect(listbox).toBeHidden({ timeout });
  await expect(input).toHaveValue('Apple', { timeout });
  await expect(input).toBeFocused();
  await expect(changes).toHaveText('["apple"]', { timeout });
  await expect(submits).toHaveText('0');
  expect(await formValue()).toBe('[["fruit","apple"]]');
  await page.keyboard.press('Tab');
  await expect(
    section.getByRole('button', { name: 'After combobox' }),
  ).toBeFocused({ timeout });
}

async function verifyDismissAndFocus(page: Page) {
  const { input, listbox, option, changes, formValue } = combobox(page);
  await focusInput(page);
  await page.keyboard.type('ch');
  await expect(option('Cherry')).toBeVisible({ timeout });
  await page.keyboard.press('ArrowDown');
  await highlighted(page, 'Cherry');
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('Cherry', { timeout });
  await expect(changes).toHaveText('["cherry"]', { timeout });
  // Escape with the popup open closes it, keeps the value and the focus.
  await page.keyboard.press('ArrowDown');
  await expect(listbox).toBeVisible({ timeout });
  await page.keyboard.press('Escape');
  await expect(listbox).toBeHidden({ timeout });
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('Cherry');
  await expect(changes).toHaveText('["cherry"]');
  expect(await formValue()).toBe('[["fruit","cherry"]]');
  // An outside press closes the popup without changing the value, and the popup
  // opens inside the viewport next to the input group.
  await page.keyboard.press('ArrowDown');
  await expect(listbox).toBeVisible({ timeout });
  const viewport = page.viewportSize();
  const box = await listbox.boundingBox();
  const inputBox = await input.boundingBox();
  expect(viewport).not.toBeNull();
  expect(box).not.toBeNull();
  expect(inputBox).not.toBeNull();
  if (!viewport || !box || !inputBox) return;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  expect(
    Math.min(
      Math.abs(box.y - (inputBox.y + inputBox.height)),
      Math.abs(box.y + box.height - inputBox.y),
    ),
  ).toBeLessThan(inputBox.height * 2 + 16);
  await page.mouse.click(1, 1);
  await expect(listbox).toBeHidden({ timeout });
  await expect(input).toHaveValue('Cherry');
  await expect(changes).toHaveText('["cherry"]');
  expect(await formValue()).toBe('[["fruit","cherry"]]');
  // Escape with the popup closed clears the input and the value.
  await input.focus();
  await page.keyboard.press('Escape');
  await expect(input).toHaveValue('', { timeout });
  await expect(changes).toHaveText('["cherry","null"]', { timeout });
  expect(await formValue()).toBe('[["fruit",""]]');
}

const frameSelector =
  'section[aria-label="Combobox input"] .ui-combobox__input-group';

async function openWithSelection(page: Page) {
  const { listbox } = combobox(page);
  await focusInput(page);
  await page.keyboard.type('ap');
  await page.keyboard.press('ArrowDown');
  await highlighted(page, 'Apple');
  await page.keyboard.press('Enter');
  await expect(listbox).toBeHidden({ timeout });
  await page.keyboard.press('ArrowDown');
  await expect(listbox).toBeVisible({ timeout });
  await highlighted(page, 'Apple');
}

async function verifyFocusAndTargets(page: Page) {
  const frame = page.locator(frameSelector);
  await openWithSelection(page);
  await expect
    .poll(() => frame.evaluate((n) => getComputedStyle(n).boxShadow), {
      timeout,
    })
    .not.toBe('none');
  for (const selector of ['.ui-combobox__trigger', '.ui-combobox__clear']) {
    const box = await page.locator(selector).boundingBox();
    expect(box, `${selector} is rendered`).not.toBeNull();
    expect(box?.width, `${selector} width`).toBeGreaterThanOrEqual(24);
    expect(box?.height, `${selector} height`).toBeGreaterThanOrEqual(24);
  }
  for (const item of await measureRenderedColors(page, '.ui-combobox__item'))
    expect(item.text, 'option text contrast').toBeGreaterThanOrEqual(4.5);
  for (const item of await measureRenderedColors(page, '.ui-combobox__input'))
    expect(item.text, 'input text contrast').toBeGreaterThanOrEqual(4.5);
  // The selected option is marked by a glyph, not by color.
  const glyph = await page
    .locator('.ui-combobox__item[data-selected] .ui-combobox__item-indicator')
    .evaluate((node) => getComputedStyle(node, '::before').content);
  expect(glyph, 'selected option glyph').toContain('✓');
  const outline = await page
    .locator('.ui-combobox__item[data-highlighted]')
    .evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        style: style.outlineStyle,
        width: Number.parseFloat(style.outlineWidth),
      };
    });
  expect(outline.style, 'highlight outline style').toBe('solid');
  expect(outline.width, 'highlight outline width').toBeGreaterThanOrEqual(2);
  await verifyStandaloneInput(page);
}

/** An input used without InputGroup keeps its own boundary and focus indicator. */
async function verifyStandaloneInput(page: Page) {
  const { section, listbox } = combobox(page);
  await page.keyboard.press('Escape');
  await expect(listbox).toBeHidden({ timeout });
  const standalone = section.getByRole('combobox', {
    name: 'Standalone fruit',
  });
  await standalone.focus();
  await expect(standalone).toBeFocused();
  const style = await standalone.evaluate((node) => {
    const computed = getComputedStyle(node);
    return {
      borderStyle: computed.borderTopStyle,
      borderWidth: Number.parseFloat(computed.borderTopWidth),
      boxShadow: computed.boxShadow,
      outlineStyle: computed.outlineStyle,
      outlineWidth: Number.parseFloat(computed.outlineWidth),
      width: node.getBoundingClientRect().width,
    };
  });
  expect(style.borderStyle, 'standalone border style').not.toBe('none');
  expect(style.borderWidth, 'standalone border width').toBeGreaterThanOrEqual(
    1,
  );
  expect(style.width, 'standalone width').toBeGreaterThan(100);
  expect(
    style.boxShadow !== 'none' ||
      (style.outlineStyle !== 'none' && style.outlineWidth >= 2),
    'standalone focus indicator',
  ).toBe(true);
}

async function verifyForcedColors(page: Page) {
  const frame = page.locator(frameSelector);
  await openWithSelection(page);
  await page.emulateMedia({ forcedColors: 'active' });
  try {
    await expectForcedColors(page, frame);
  } finally {
    await page.emulateMedia({ forcedColors: 'none' });
  }
}

async function expectForcedColors(page: Page, frame: Locator) {
  const read = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((node) => {
        const style = getComputedStyle(node);
        return {
          outlineStyle: style.outlineStyle,
          outlineWidth: Number.parseFloat(style.outlineWidth),
          borderStyle: style.borderTopStyle,
          borderWidth: Number.parseFloat(style.borderTopWidth),
        };
      });
  // Forced colors suppress box shadows, so outlines and borders must remain.
  const focused = await frame.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
    };
  });
  expect(focused.outlineStyle, 'frame outline style').toBe('solid');
  expect(focused.outlineWidth, 'frame outline width').toBeGreaterThanOrEqual(2);
  const highlight = await read('.ui-combobox__item[data-highlighted]');
  expect(highlight.outlineStyle, 'highlight outline style').toBe('solid');
  expect(
    highlight.outlineWidth,
    'highlight outline width',
  ).toBeGreaterThanOrEqual(2);
  const popup = await read('.ui-combobox__popup');
  expect(popup.borderStyle, 'popup border style').toBe('solid');
  expect(popup.borderWidth, 'popup border width').toBeGreaterThanOrEqual(1);
}

async function verifyReflow(page: Page) {
  const { listbox } = combobox(page);
  await page.setViewportSize({ width: 320, height: 720 });
  await openWithSelection(page);
  const layout = await measureOverflow(page, frameSelector);
  expect(layout.clipped, 'clipped content').not.toContain(true);
  expect(layout.outside, 'content outside frame').not.toContain(true);
  const box = await listbox.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  const zoomed = await measureOverflow(page, frameSelector);
  expect(zoomed.clipped, 'clipped content at 200% text').not.toContain(true);
  expect(zoomed.outside, 'content outside frame at 200% text').not.toContain(
    true,
  );
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '';
  });
  // Base UI marks the rest of the page aria-hidden while the popup is open, so
  // the axe scan that follows must see the closed state.
  await page.keyboard.press('Escape');
  await expect(listbox).toBeHidden({ timeout });
}

async function verifyVisual(page: Page) {
  await verifyFocusAndTargets(page);
  // The open popup makes the rest of the page inert, so start each phase fresh.
  await page.goto('/');
  await verifyForcedColors(page);
  await page.goto('/');
  await verifyReflow(page);
}

/**
 * Emulates an IME through the DevTools protocol: a composition string is shown
 * as the pre-edit text and the key that confirms the conversion is reported as
 * keyCode 229, as browsers do while composing. This is not a real IME.
 */
async function verifyImeComposition(page: Page) {
  const { input, listbox, changes } = combobox(page);
  const cdp = await page.context().newCDPSession(page);
  await focusInput(page);
  await cdp.send('Input.imeSetComposition', {
    text: 'ap',
    selectionStart: 2,
    selectionEnd: 2,
  });
  await expect(listbox).toBeVisible({ timeout });
  await page.keyboard.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', /.+/, {
    timeout,
  });
  const confirm = async () => {
    await cdp.send('Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 229,
      nativeVirtualKeyCode: 229,
    });
    await cdp.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 13,
      nativeVirtualKeyCode: 13,
    });
  };
  await confirm();
  // Pressing Enter to confirm a conversion must not select an option.
  await expect(changes).toHaveText('[]', { timeout });
  await expect(listbox).toBeVisible();
  // Committing the composition filters the list; Enter then selects.
  await cdp.send('Input.insertText', { text: 'ap' });
  await expect(page.getByRole('option')).toHaveText(['Apple', 'Grape'], {
    timeout,
  });
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(listbox).toBeHidden({ timeout });
  await expect(input).toHaveValue(/^(Apple|Grape)$/, { timeout });
  await expect(changes).toHaveText(/^\["(apple|grape)"\]$/);
}

const verifiers = {
  'combobox.keyboard-selection': verifyKeyboardSelection,
  'combobox.dismiss-focus': verifyDismissAndFocus,
  'combobox.visual-forced': verifyVisual,
  'combobox.ime-browser': verifyImeComposition,
} as const;

for (const [id, verify] of Object.entries(verifiers)) {
  test(`[${id}] real browser behavior`, async ({ page, browser }) => {
    await page.goto('/');
    const rules = componentManifest.components.Combobox.qualityRules.filter(
      (rule) => rule.id === id && rule.verification === 'browser',
    );
    expect(rules).toHaveLength(1);
    const report = await evaluateQuality(rules, {
      [id]: async () => {
        await verify(page);
        const axe = await new AxeBuilder({ page })
          .include('section[aria-label="Combobox input"]')
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

test('Combobox detector catches a popup that ignores Escape and outside press', async ({
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
  await expect(verifyDismissAndFocus(page)).rejects.toThrow(/toBeHidden/);
});

test('Combobox detector catches Enter during composition being replayed as a commit', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/');
  await page.evaluate(() => {
    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key !== 'Enter' || event.keyCode !== 229) return;
        event.stopImmediatePropagation();
        event.target?.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Enter',
            keyCode: 13,
            bubbles: true,
            cancelable: true,
          }),
        );
      },
      true,
    );
  });
  await expect(verifyImeComposition(page)).rejects.toThrow(/Combobox changes/);
});

test('Combobox detector catches a vanishing focus frame and undersized buttons', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/');
  await page.addStyleTag({
    content: `${frameSelector} { outline: none !important; box-shadow: none !important; }`,
  });
  await expect(verifyForcedColors(page)).rejects.toThrow(/outline/);
  await page.goto('/');
  await page.addStyleTag({
    content:
      '.ui-combobox__trigger, .ui-combobox__clear { min-inline-size: 0 !important; min-block-size: 0 !important; inline-size: 10px; block-size: 10px; }',
  });
  await expect(verifyFocusAndTargets(page)).rejects.toThrow(/width/);
  await page.goto('/');
  await page.addStyleTag({
    content:
      '.ui-combobox__input { border: 0 !important; box-shadow: none !important; outline: none !important; }',
  });
  await expect(verifyStandaloneInput(page)).rejects.toThrow(/standalone/);
});
