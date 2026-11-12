import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import { measureOverflow, measureRenderedColors } from './rendered-colors.js';

const section = 'section[aria-label="Calendar states"]';
const range = `${section} [role="group"][aria-label="Booking dates"]`;
const single = `${section} [role="group"][aria-label="Appointment date"]`;
// Known-invalid controls shorten this so detecting a failure stays cheap.
let timeout = 5000;

test.beforeEach(() => {
  timeout = 5000;
});

function calendar(page: Page) {
  const root = page.locator(section);
  const rangeRoot = page.locator(range);
  const singleRoot = page.locator(single);
  return {
    before: root.getByRole('button', { name: 'Before calendar' }),
    after: root.getByRole('button', { name: 'After calendar' }),
    rangeValue: root.getByLabel('Calendar value'),
    singleValue: root.getByLabel('Single value'),
    previous: rangeRoot.getByRole('button', { name: '前の月' }),
    next: rangeRoot.getByRole('button', { name: '次の月' }),
    singleDay: (date: string) => singleRoot.locator(`[data-date="${date}"]`),
    rangeDay: (date: string) => rangeRoot.locator(`[data-date="${date}"]`),
    singlePrevious: singleRoot.getByRole('button', { name: '前の月' }),
  };
}

const focusedDate = (page: Page) =>
  page.evaluate(() => document.activeElement?.getAttribute('data-date'));

async function press(page: Page, key: string, expected: string) {
  await page.keyboard.press(key);
  await expect
    .poll(() => focusedDate(page), { message: key, timeout })
    .toBe(expected);
}

async function verifyKeyboard(page: Page) {
  const { before, after, previous, next, rangeValue, singleValue, singleDay } =
    calendar(page);
  await before.focus();
  // Real Tab: previous, next, then exactly one day stop (the range start).
  await page.keyboard.press('Tab');
  await expect(previous).toBeFocused({ timeout });
  await page.keyboard.press('Tab');
  await expect(next).toBeFocused({ timeout });
  await page.keyboard.press('Tab');
  await expect.poll(() => focusedDate(page), { timeout }).toBe('2026-11-12');
  await press(page, 'ArrowRight', '2026-11-13');
  await press(page, 'ArrowDown', '2026-11-20');
  await press(page, 'Home', '2026-11-15');
  await press(page, 'End', '2026-11-21');
  await press(page, 'ArrowLeft', '2026-11-20');
  await press(page, 'ArrowUp', '2026-11-13');
  await press(page, 'ArrowDown', '2026-11-20');
  // The disabled day (Nov 18) stays focusable but cannot be selected.
  await press(page, 'ArrowLeft', '2026-11-19');
  await press(page, 'ArrowLeft', '2026-11-18');
  await page.keyboard.press('Enter');
  await expect(rangeValue).toHaveText('null', { timeout });
  // Month and year paging cross boundaries; minDate (Oct 1) clamps the move.
  await press(page, 'PageDown', '2026-12-18');
  await press(page, 'ArrowRight', '2026-12-19');
  await press(page, 'PageUp', '2026-11-19');
  await press(page, 'PageUp', '2026-10-19');
  await press(page, 'PageUp', '2026-10-01');
  // Enter starts a range, Space completes it.
  await page.keyboard.press('Enter');
  await expect(rangeValue).toHaveText('{"from":"2026-10-01"}', { timeout });
  await press(page, 'ArrowRight', '2026-10-02');
  await page.keyboard.press('Space');
  await expect(rangeValue).toHaveText(
    '{"from":"2026-10-01","to":"2026-10-02"}',
    {
      timeout,
    },
  );
  // One Tab stop: Tab leaves the grid; Shift+Tab returns to the same day.
  await page.keyboard.press('Tab');
  await expect(calendar(page).singlePrevious).toBeFocused({ timeout });
  await page.keyboard.press('Shift+Tab');
  await expect.poll(() => focusedDate(page), { timeout }).toBe('2026-10-02');
  // Single mode: today is the stop, Enter selects it.
  await singleDay('2026-11-10').focus();
  await press(page, 'ArrowRight', '2026-11-11');
  await page.keyboard.press('Enter');
  await expect(singleValue).toHaveText('2026-11-11', { timeout });
  await expect(singleDay('2026-11-11').locator('xpath=..')).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await singleDay('2026-11-11').focus();
  await page.keyboard.press('Tab');
  await expect(after).toBeFocused({ timeout });
}

async function verifyVisuals(page: Page) {
  const days = await measureRenderedColors(page, `${range} .ui-calendar__day`);
  const navs = await measureRenderedColors(page, `${range} .ui-calendar__nav`);
  expect(days).toHaveLength(30);
  expect(navs).toHaveLength(2);
  for (const item of [...days, ...navs]) {
    expect(
      item.clientWidth + item.borderWidth * 2,
      'target width',
    ).toBeGreaterThanOrEqual(24);
    expect(
      item.clientHeight + item.borderWidth * 2,
      'target height',
    ).toBeGreaterThanOrEqual(24);
    expect(item.text, 'text contrast').toBeGreaterThanOrEqual(4.5);
  }
  const marks = await page.evaluate((query) => {
    const read = (selector: string) =>
      [...document.querySelectorAll<HTMLElement>(`${query} ${selector}`)].map(
        (node) => {
          const style = getComputedStyle(node);
          return {
            border: Number.parseFloat(style.borderTopWidth),
            weight: Number.parseInt(style.fontWeight, 10),
            line: style.textDecorationLine,
          };
        },
      );
    return {
      selected: read('.ui-calendar__day[data-selected]'),
      plain: read(
        '.ui-calendar__day:not([data-selected]):not([data-today]):not([aria-disabled])',
      ),
      today: read('.ui-calendar__day[data-today]'),
      disabled: read('.ui-calendar__day[aria-disabled="true"]'),
    };
  }, range);
  expect(marks.selected).toHaveLength(3);
  expect(marks.today).toHaveLength(1);
  expect(marks.disabled).toHaveLength(1);
  for (const plain of marks.plain) {
    for (const selected of marks.selected) {
      expect(selected.border, 'selected border').toBeGreaterThan(plain.border);
      expect(selected.weight, 'selected weight').toBeGreaterThan(plain.weight);
    }
    expect(marks.today[0]?.line, 'today mark').toContain('underline');
    expect(plain.line).not.toContain('underline');
    expect(marks.disabled[0]?.line, 'disabled mark').toContain('line-through');
    expect(plain.line).not.toContain('line-through');
  }
}

async function verifyLayout(page: Page) {
  const layout = await measureOverflow(page, range);
  expect(layout.clipped, 'clipped content').toEqual([false]);
  expect(layout.outside, 'content outside calendar').toEqual([false]);
}

async function verifyForcedFocus(page: Page) {
  const { before, rangeDay } = calendar(page);
  await before.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(rangeDay('2026-11-12')).toBeFocused({ timeout });
  const style = await rangeDay('2026-11-12').evaluate((node) => {
    const computed = getComputedStyle(node);
    return {
      outlineStyle: computed.outlineStyle,
      outlineWidth: Number.parseFloat(computed.outlineWidth),
    };
  });
  // Forced colors suppress box shadows, so an outline must remain.
  expect(style.outlineStyle, 'forced-colors outline').toBe('solid');
  expect(
    style.outlineWidth,
    'forced-colors outline width',
  ).toBeGreaterThanOrEqual(2);
}

async function runRule(
  page: Page,
  browser: { version(): string },
  id: string,
  body: () => Promise<void>,
) {
  const rules = componentManifest.components.Calendar.qualityRules.filter(
    (rule) => rule.id === id && rule.verification === 'browser',
  );
  expect(rules).toHaveLength(1);
  const report = await evaluateQuality(rules, {
    [id]: async () => {
      await page.locator(section).scrollIntoViewIfNeeded();
      const axe = await new AxeBuilder({ page }).include(section).analyze();
      await test.info().attach(`${id}-axe`, {
        body: JSON.stringify(axe),
        contentType: 'application/json',
      });
      expect(axe.violations).toEqual([]);
      expect(axe.incomplete).toEqual([]);
      await body();
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
}

test('[calendar.keyboard] real Tab, arrows, Home/End, paging, disabled days and selection keys', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'calendar.keyboard', () => verifyKeyboard(page));
});

test('[calendar.visual-states] targets, non-color marks, reflow and forced-colors focus', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  await runRule(page, browser, 'calendar.visual-states', async () => {
    await verifyVisuals(page);
    await verifyLayout(page);
    await page.setViewportSize({ width: 320, height: 720 });
    await verifyLayout(page);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await verifyLayout(page);
    await verifyVisuals(page);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '';
    });
    await page.emulateMedia({ forcedColors: 'active' });
    await verifyForcedFocus(page);
  });
});

test('Calendar detector rejects swallowed arrow navigation', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/');
  await page.locator(range).evaluate((node) => {
    node.addEventListener(
      'keydown',
      (event) => {
        if ((event as KeyboardEvent).key.startsWith('Arrow'))
          event.stopImmediatePropagation();
      },
      true,
    );
  });
  await expect(verifyKeyboard(page)).rejects.toThrow();
});

test('Calendar detector rejects selection that relies on color alone', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `${range} .ui-calendar__day[data-selected] { border-width: 1px !important; font-weight: 400 !important; }`,
  });
  await expect(verifyVisuals(page)).rejects.toThrow();
});

test('Calendar detector rejects a disabled day without a non-color mark', async ({
  page,
}) => {
  await page.goto('/');
  await page.addStyleTag({
    content: `${range} .ui-calendar__day[aria-disabled="true"] { text-decoration: none !important; }`,
  });
  await expect(verifyVisuals(page)).rejects.toThrow();
});

test('Calendar detector rejects a forced-colors focus ring that disappears', async ({
  page,
}) => {
  timeout = 1000;
  await page.goto('/');
  await page.addStyleTag({
    content: `${range} .ui-calendar__day:focus-visible { outline: none !important; }`,
  });
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(verifyForcedFocus(page)).rejects.toThrow();
});
