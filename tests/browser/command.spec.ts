import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import { measureOverflow, measureRenderedColors } from './rendered-colors.js';

const sectionSelector = 'section[aria-label="Command states"]';
let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

function command(page: Page) {
  const section = page.locator(sectionSelector);
  return {
    section,
    before: section.getByRole('button', { name: 'Before command' }),
    after: section.getByRole('button', { name: 'After command' }),
    input: section.getByRole('combobox', { name: 'Find a command' }),
    option: (name: string) => page.getByRole('option', { name, exact: true }),
    trigger: section.getByRole('button', { name: 'Open palette' }),
    dialog: page.getByRole('dialog', { name: 'Command palette' }),
    paletteInput: page.getByRole('combobox', { name: 'Search commands' }),
    ran: section.getByLabel('Commands run'),
  };
}

async function highlighted(scope: Locator, name: string, inputName: string) {
  const option = scope.getByRole('option', { name, exact: true });
  const input = scope.getByRole('combobox', { name: inputName });
  await expect(option).toHaveAttribute('data-highlighted', '', { timeout });
  const id = await option.getAttribute('id');
  expect(id).not.toBeNull();
  await expect(input).toHaveAttribute('aria-activedescendant', id as string, {
    timeout,
  });
  // Virtual focus: DOM focus never leaves the input.
  await expect(input).toBeFocused();
}

async function verifyKeyboardExecute(page: Page) {
  const { section, before, after, input, ran } = command(page);
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(input).toBeFocused({ timeout });
  // The list is always visible and the input is the only Tab stop inside it.
  await expect(section.getByRole('option')).toHaveCount(4, { timeout });
  await page.keyboard.press('ArrowDown');
  await highlighted(section, 'Home', 'Find a command');
  await page.keyboard.press('ArrowDown');
  await highlighted(section, 'Settings', 'Find a command');
  await page.keyboard.press('ArrowUp');
  await highlighted(section, 'Home', 'Find a command');
  // A disabled command never runs.
  await page.keyboard.type('del');
  await expect(section.getByRole('option')).toHaveText(['Delete project'], {
    timeout,
  });
  await expect(section.getByRole('option')).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(ran).toHaveText('[]');
  // No match: the empty message is shown and Enter runs nothing.
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('zzz');
  await expect(section.getByRole('option')).toHaveCount(0, { timeout });
  await expect(section.getByText('No commands found')).toBeVisible({ timeout });
  await page.keyboard.press('Enter');
  await expect(ran).toHaveText('[]');
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('copy');
  await expect(section.getByRole('option')).toHaveText(['Copy linkCtrl+L'], {
    timeout,
  });
  await page.keyboard.press('ArrowDown');
  await highlighted(section, 'Copy link', 'Find a command');
  await page.keyboard.press('Enter');
  await expect(ran).toHaveText('["copy"]', { timeout });
  await expect(input).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(after).toBeFocused({ timeout });
}

async function verifyDialogFocus(page: Page) {
  const { trigger, dialog, paletteInput, ran } = command(page);
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible({ timeout });
  await expect(paletteInput).toBeFocused({ timeout });
  // The page behind the modal Dialog is not reachable.
  await page.keyboard.press('Tab');
  await expect
    .poll(
      () =>
        page.evaluate(
          () => document.activeElement?.closest('[role="dialog"]') !== null,
        ),
      { timeout },
    )
    .toBe(true);
  await paletteInput.focus();
  await page.keyboard.type('hom');
  await expect(dialog.getByRole('option')).toHaveText(['Home'], { timeout });
  await page.keyboard.press('ArrowDown');
  await highlighted(dialog, 'Home', 'Search commands');
  await page.keyboard.press('Enter');
  await expect(ran).toHaveText('["palette:home"]', { timeout });
  await expect(dialog).toBeHidden({ timeout });
  await expect(trigger).toBeFocused({ timeout });
  // Escape closes the palette without running a command.
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible({ timeout });
  await expect(paletteInput).toBeFocused({ timeout });
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden({ timeout });
  await expect(trigger).toBeFocused({ timeout });
  await expect(ran).toHaveText('["palette:home"]');
}

const inputSelector = `${sectionSelector} .ui-command__input`;

async function verifyFocusAndTargets(page: Page) {
  const { before, input } = command(page);
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(input).toBeFocused({ timeout });
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.ui-command__item[data-highlighted]')).toHaveCount(
    1,
    { timeout },
  );
  await expect
    .poll(
      () =>
        page
          .locator(inputSelector)
          .evaluate((node) => getComputedStyle(node).boxShadow),
      { timeout },
    )
    .not.toBe('none');
  for (const selector of [
    '.ui-command__item',
    '.ui-command__input',
    '.ui-command__group-label',
  ])
    for (const item of await measureRenderedColors(
      page,
      `${sectionSelector} ${selector}`,
    ))
      expect(item.text, `${selector} text contrast`).toBeGreaterThanOrEqual(
        4.5,
      );
  const outline = await page
    .locator('.ui-command__item[data-highlighted]')
    .evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        style: style.outlineStyle,
        width: Number.parseFloat(style.outlineWidth),
      };
    });
  expect(outline.style, 'highlight outline style').toBe('solid');
  expect(outline.width, 'highlight outline width').toBeGreaterThanOrEqual(2);
}

async function verifyForcedColors(page: Page) {
  const { before, input } = command(page);
  await before.focus();
  await page.keyboard.press('Tab');
  await expect(input).toBeFocused({ timeout });
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.ui-command__item[data-highlighted]')).toHaveCount(
    1,
    { timeout },
  );
  await page.emulateMedia({ forcedColors: 'active' });
  try {
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
    const focused = await read(inputSelector);
    expect(focused.outlineStyle, 'input outline style').toBe('solid');
    expect(focused.outlineWidth, 'input outline width').toBeGreaterThanOrEqual(
      2,
    );
    const highlight = await read('.ui-command__item[data-highlighted]');
    expect(highlight.outlineStyle, 'highlight outline style').toBe('solid');
    expect(
      highlight.outlineWidth,
      'highlight outline width',
    ).toBeGreaterThanOrEqual(2);
    const surface = await read(`${sectionSelector} .ui-command`);
    expect(surface.borderStyle, 'surface border style').toBe('solid');
    expect(surface.borderWidth, 'surface border width').toBeGreaterThanOrEqual(
      1,
    );
  } finally {
    await page.emulateMedia({ forcedColors: 'none' });
  }
}

async function verifyReflow(page: Page) {
  await page.setViewportSize({ width: 320, height: 720 });
  const selector = `${sectionSelector} .ui-command`;
  const layout = await measureOverflow(page, selector);
  expect(layout.clipped, 'clipped content').not.toContain(true);
  expect(layout.outside, 'content outside the surface').not.toContain(true);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  const zoomed = await measureOverflow(page, selector);
  expect(zoomed.clipped, 'clipped content at 200% text').not.toContain(true);
  expect(zoomed.outside, 'content outside at 200% text').not.toContain(true);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '';
  });
}

async function verifyVisual(page: Page) {
  await verifyFocusAndTargets(page);
  await page.goto('/#command');
  await verifyForcedColors(page);
  await page.goto('/#command');
  await verifyReflow(page);
}

type AxeResult = Awaited<ReturnType<AxeBuilder['analyze']>>;

/**
 * axe reports aria-valid-attr-value as "incomplete" (needs review) for every
 * element that has both aria-haspopup and aria-controls, even when the
 * referenced element exists. Base UI gives the inline list's input exactly that
 * pair, so this single message is accepted only when each flagged input points
 * at an existing listbox. Every other incomplete result still fails the rule.
 */
async function splitIncomplete(
  page: Page,
  incomplete: AxeResult['incomplete'],
) {
  const unresolved: AxeResult['incomplete'] = [];
  const accepted: AxeResult['incomplete'] = [];
  for (const item of incomplete) {
    const known =
      item.id === 'aria-valid-attr-value' &&
      item.nodes.length > 0 &&
      item.nodes.every((node) =>
        node.all.every(
          (check) =>
            (check.data as { messageKey?: string } | null)?.messageKey ===
            'controlsWithinPopup',
        ),
      );
    let resolved = known;
    if (known)
      for (const node of item.nodes)
        resolved &&= await page
          .locator(String(node.target[0]))
          .evaluate((input) => {
            const id = input.getAttribute('aria-controls');
            return Boolean(
              id &&
                input.ownerDocument.getElementById(id)?.getAttribute('role') ===
                  'listbox',
            );
          });
    (resolved ? accepted : unresolved).push(item);
  }
  return { unresolved, accepted };
}

const verifiers = {
  'command.keyboard-execute': verifyKeyboardExecute,
  'command.dialog-focus': verifyDialogFocus,
  'command.visual-forced': verifyVisual,
} as const;

for (const [id, verify] of Object.entries(verifiers)) {
  test(`[${id}] real browser behavior`, async ({ page, browser }) => {
    await page.goto('/#command');
    const rules = componentManifest.components.Command.qualityRules.filter(
      (rule) => rule.id === id && rule.verification === 'browser',
    );
    expect(rules).toHaveLength(1);
    const report = await evaluateQuality(rules, {
      [id]: async () => {
        await verify(page);
        const axe = await new AxeBuilder({ page })
          .include(sectionSelector)
          .analyze();
        const { unresolved, accepted } = await splitIncomplete(
          page,
          axe.incomplete,
        );
        // The accepted needs-review items stay visible as their own artifact; the
        // -axe artifact holds only what is still unresolved, which must be empty.
        await test.info().attach(`${id}-axe-accepted-needs-review`, {
          body: JSON.stringify(accepted),
          contentType: 'application/json',
        });
        await test.info().attach(`${id}-axe`, {
          body: JSON.stringify({ ...axe, incomplete: unresolved }),
          contentType: 'application/json',
        });
        expect(axe.violations).toEqual([]);
        expect(unresolved).toEqual([]);
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

test('Command detector catches a palette that ignores Escape', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/#command');
  await page.evaluate(() => {
    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape') event.stopImmediatePropagation();
      },
      true,
    );
  });
  await expect(verifyDialogFocus(page)).rejects.toThrow(/toBeHidden/);
});

test('Command detector catches Enter that does not run the highlighted command', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/#command');
  await page.evaluate(() => {
    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Enter') event.stopImmediatePropagation();
      },
      true,
    );
  });
  await expect(verifyKeyboardExecute(page)).rejects.toThrow(/Commands run/);
});

test('Command detector catches a vanishing focus indicator', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/#command');
  await page.addStyleTag({
    content: `${inputSelector} { outline: none !important; box-shadow: none !important; }`,
  });
  await expect(verifyForcedColors(page)).rejects.toThrow(/outline/);
});
