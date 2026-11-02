import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';

async function audit(page: Page, name: string, selector?: string) {
  const builder = new AxeBuilder({ page });
  if (selector) builder.include(selector);
  const results = await builder.analyze();
  await test.info().attach(name, {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  });
  expect(results.violations).toEqual([]);
  expect(
    results.incomplete,
    'Axe checks requiring review remain unverified',
  ).toEqual([]);
}

/** Waits for CSS transitions so axe measures final, not fading, colors. */
async function settleAnimations(page: Page, selector: string) {
  await expect
    .poll(() =>
      page
        .locator(selector)
        .first()
        .evaluate((node) => node.getAnimations({ subtree: true }).length),
    )
    .toBe(0);
}

test.beforeEach(async ({ page, browser }) => {
  await test.info().attach('environment', {
    body: JSON.stringify({
      browser: browser.version(),
      platform: process.platform,
      node: process.version,
      project: test.info().project.name,
    }),
    contentType: 'application/json',
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Accessibility fixtures' }),
  ).toBeVisible();
});

test('all button variants/sizes and field pass rendered axe checks', async ({
  page,
}) => {
  for (const variant of componentManifest.components.Button.variants) {
    for (const size of componentManifest.components.Button.sizes) {
      await expect(
        page.getByRole('button', { name: `${variant} ${size}`, exact: true }),
      ).toBeVisible();
    }
  }
  await expect(
    page.getByRole('textbox', { name: 'Email' }),
  ).toHaveAccessibleDescription('Enter your contact email.');
  await audit(page, 'default-axe');
});

test('static display components expose names and orientation', async ({
  page,
}) => {
  const section = page.getByRole('region', { name: 'Static display' });
  await expect(
    section.getByRole('group', { name: 'Control and K' }),
  ).toBeVisible();
  const separator = section.getByRole('separator');
  await expect(separator).toHaveCount(1);
  await expect(separator).toHaveAttribute('aria-orientation', 'vertical');
  const box = await separator.boundingBox();
  expect(box?.height).toBeGreaterThan(0);
  expect(box?.width).toBeGreaterThan(0);
  await audit(
    page,
    'static-display-axe',
    'section[aria-label="Static display"]',
  );
});

test('keyboard activates buttons and dialog traps and restores focus', async ({
  page,
}) => {
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'solid sm', exact: true }),
  ).toBeFocused();
  const trigger = page.getByRole('button', { name: 'Open settings' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleDescription('Update your preferences.');
  for (const key of ['Tab', 'Shift+Tab', 'Tab']) {
    await page.keyboard.press(key);
    await expect
      .poll(() =>
        dialog.evaluate((node) => node.contains(document.activeElement)),
      )
      .toBe(true);
  }
  // Audit the visible popup; background inertness is checked by keyboard above.
  await audit(page, 'dialog-axe', '[role="dialog"]');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Space');
  await expect(dialog).toBeVisible();
  await page.getByRole('button', { name: 'Close settings' }).focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('audit harness detects missing names and low contrast', async ({
  page,
}) => {
  // Deliberately invalid DOM is isolated from valid component fixtures and source lint.
  await page.evaluate(() => {
    const button = document.createElement('button');
    document.querySelector('main')?.append(button);
    const text = document.createElement('p');
    text.textContent = 'Unreadable example';
    text.style.cssText = 'color:#eee;background:#fff';
    document.querySelector('main')?.append(text);
  });
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map(({ id }) => id)).toEqual(
    expect.arrayContaining(['button-name', 'color-contrast']),
  );
});

test('data and navigation components expose structure and keyboard behavior', async ({
  page,
}) => {
  const section = page.getByRole('region', { name: 'Data and navigation' });
  // Audit before any scrolling or navigation changes the rendered state.
  await audit(
    page,
    'data-navigation-axe',
    'section[aria-label="Data and navigation"]',
  );
  const upload = section.getByRole('progressbar', { name: 'Upload' });
  await expect(upload).toHaveAttribute('aria-valuenow', '45');
  const fill = await upload.locator('.ui-progress__indicator').boundingBox();
  const track = await upload.locator('.ui-progress__track').boundingBox();
  expect((fill?.width ?? 0) / (track?.width ?? 1)).toBeCloseTo(0.45, 1);
  const sync = section.getByRole('progressbar', { name: 'Sync' });
  await expect(sync).not.toHaveAttribute('aria-valuenow');
  await expect(sync).toHaveAttribute('data-indeterminate', '');

  // The overflowing table region is reachable with Tab and scrolls by arrow key.
  const region = section.getByRole('region', { name: 'Invoices' });
  // The dialog trigger is the last focusable element before this section.
  await page.getByRole('button', { name: 'Open settings' }).focus();
  await page.keyboard.press('Tab');
  await expect(region).toBeFocused();
  expect(
    await region.evaluate((node) => node.scrollWidth > node.clientWidth),
  ).toBe(true);
  await page.keyboard.press('ArrowRight');
  await expect
    .poll(() => region.evaluate((node) => node.scrollLeft))
    .toBeGreaterThan(0);

  // Breadcrumb separators and the disabled Previous link are skipped by Tab.
  await page.keyboard.press('Tab');
  await expect(
    section.getByRole('link', { name: 'Home', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    section.getByRole('link', { name: 'Account', exact: true }),
  ).toBeFocused();
  await expect(
    section
      .getByRole('navigation', { name: 'Breadcrumb' })
      .locator('[aria-current="page"]'),
  ).toHaveCount(1);
  await page.keyboard.press('Tab');
  await expect(
    section.getByRole('link', { name: '1', exact: true }),
  ).toBeFocused();
  await expect(
    section.getByRole('link', { name: '1', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  const previous = section.getByRole('link', { name: 'Previous page' });
  await expect(previous).toHaveAttribute('aria-disabled', 'true');
  const before = page.url();
  // force: Playwright treats aria-disabled as not actionable; the click must still do nothing.
  await previous.click({ force: true });
  expect(page.url()).toBe(before);
  // The forced click focuses the disabled link (tabIndex -1); resume from page 1.
  await section.getByRole('link', { name: '1', exact: true }).focus();
  await page.keyboard.press('Tab');
  const next = section.getByRole('link', { name: 'Next page' });
  await expect(next).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#page-2$/);
});

test('basic form controls accept real keyboard input and pass axe', async ({
  page,
}) => {
  const section = page.getByRole('region', { name: 'Basic form controls' });
  const input = section.getByRole('textbox', { name: 'Reply address' });
  await input.focus();
  await expect(input).not.toHaveCSS('box-shadow', 'none');
  await page.keyboard.type('a@example.com');
  await expect(input).toHaveValue('a@example.com');
  await expect(input).toHaveAccessibleDescription('We reply to this address.');
  await page.keyboard.press('Tab');
  const notes = section.getByRole('textbox', { name: 'Notes' });
  await expect(notes).toBeFocused();
  await page.keyboard.type('line 1');
  await page.keyboard.press('Enter');
  await page.keyboard.type('line 2');
  await expect(notes).toHaveValue('line 1\nline 2');
  await page.keyboard.press('Tab');
  await expect(
    section.getByRole('combobox', { name: 'Country' }),
  ).toBeFocused();
  await expect(section.locator('.ui-native-select__icon')).toHaveCSS(
    'pointer-events',
    'none',
  );
  await page.keyboard.press('Tab');
  const terms = section.getByRole('checkbox', { name: 'Accept terms' });
  await expect(terms).toBeFocused();
  await page.keyboard.press('Space');
  await expect(terms).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Space');
  await expect(terms).toHaveAttribute('aria-checked', 'false');
  await expect(
    section.getByRole('checkbox', { name: 'Select all' }),
  ).toHaveAttribute('aria-checked', 'mixed');
  const alerts = section.getByRole('switch', { name: 'Enable alerts' });
  await alerts.focus();
  await page.keyboard.press('Space');
  await expect(alerts).toHaveAttribute('aria-checked', 'true');
  for (const control of [terms, alerts]) {
    const box = await control.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(24);
    expect(box?.height).toBeGreaterThanOrEqual(24);
  }
  await audit(
    page,
    'basic-form-controls-axe',
    'section[aria-label="Basic form controls"]',
  );
});

test('choice controls follow real keyboard input', async ({ page }) => {
  const section = page.getByRole('region', { name: 'Choice controls' });
  await audit(
    page,
    'choice-controls-axe',
    'section[aria-label="Choice controls"]',
  );

  // RadioGroup: one tab stop, arrows move and select, disabled items are skipped.
  const group = section.getByRole('radiogroup', { name: 'Plan' });
  const free = group.getByRole('radio', { name: 'Free' });
  const pro = group.getByRole('radio', { name: 'Pro' });
  await free.focus();
  await page.keyboard.press('ArrowDown');
  await expect(pro).toBeFocused();
  await expect(pro).toHaveAttribute('aria-checked', 'true');
  await expect(free).toHaveAttribute('aria-checked', 'false');
  await page.keyboard.press('ArrowUp');
  await expect(free).toBeFocused();
  await expect(free).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Tab');
  await expect(section.getByRole('combobox', { name: 'Theme' })).toBeFocused();

  // Select: open with arrows, typeahead, Enter selects, Escape keeps the value.
  const trigger = section.getByRole('combobox', { name: 'Theme' });
  await page.keyboard.press('ArrowDown');
  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await settleAnimations(page, '[role="listbox"]');
  await audit(page, 'select-popup-axe', '[role="listbox"]');
  await page.keyboard.press('l');
  await expect(page.getByRole('option', { name: 'Light' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(listbox).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toContainText('Light');
  await page.keyboard.press('ArrowDown');
  await expect(listbox).toBeVisible();
  await page.keyboard.press('Home');
  await page.keyboard.press('Escape');
  await expect(listbox).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toContainText('Light');

  // Slider: arrows by step, Page keys by largeStep, Home/End to bounds.
  const slider = section.getByRole('slider', { name: 'Volume' });
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveAttribute('aria-valuenow', '55');
  await expect(slider).toHaveAttribute('aria-valuetext', '55 percent');
  await page.keyboard.press('PageDown');
  await expect(slider).toHaveAttribute('aria-valuenow', '45');
  await page.keyboard.press('End');
  await expect(slider).toHaveAttribute('aria-valuenow', '100');
  await page.keyboard.press('Home');
  await expect(slider).toHaveAttribute('aria-valuenow', '0');
  const thumb = section.locator('.ui-slider__thumb');
  const box = await thumb.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(20);
});

test('disclosure components work with real keyboard input', async ({
  page,
}) => {
  const section = page.getByRole('region', { name: 'Disclosure' });
  await audit(
    page,
    'disclosure-closed-axe',
    'section[aria-label="Disclosure"]',
  );

  // Collapsible: Enter opens, Space closes, focus stays on trigger.
  const collapsible = section.getByRole('button', {
    name: 'Advanced settings',
  });
  await collapsible.focus();
  await page.keyboard.press('Enter');
  await expect(collapsible).toHaveAttribute('aria-expanded', 'true');
  const help = section.getByRole('link', { name: 'Advanced settings help' });
  await expect(help).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(help).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Space');
  await expect(collapsible).toHaveAttribute('aria-expanded', 'false');
  await expect(collapsible).toBeFocused();
  await expect(help).toHaveCount(0);

  // Accordion: headings, Enter/Space, Tab into open panel only.
  const shipping = section.getByRole('button', { name: 'Shipping' });
  await expect(
    section.getByRole('heading', { level: 2, name: 'Shipping' }),
  ).toBeVisible();
  await shipping.focus();
  await page.keyboard.press('Space');
  await expect(shipping).toHaveAttribute('aria-expanded', 'true');
  await expect(section.getByRole('region', { name: 'Shipping' })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(
    section.getByRole('link', { name: 'Shipping policy' }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(section.getByRole('button', { name: 'Returns' })).toBeFocused();

  // Tabs: arrow roving, disabled tab focusable but not selectable, manual activation.
  const profile = section.getByRole('tab', { name: 'Profile' });
  await profile.focus();
  await page.keyboard.press('ArrowRight');
  const billing = section.getByRole('tab', { name: 'Billing' });
  await expect(billing).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(billing).toHaveAttribute('aria-selected', 'false');
  await page.keyboard.press('ArrowRight');
  const security = section.getByRole('tab', { name: 'Security' });
  await expect(security).toBeFocused();
  await expect(profile).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Enter');
  await expect(security).toHaveAttribute('aria-selected', 'true');
  await expect(
    section.getByRole('tabpanel', { name: 'Security' }),
  ).toBeVisible();
  await page.keyboard.press('Home');
  await expect(profile).toBeFocused();
  await page.keyboard.press('End');
  await expect(security).toBeFocused();

  // Toggle: Enter and Space each toggle once; label stays constant.
  const toggle = section.getByRole('button', { name: 'Toggle outline md' });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(
    section.getByRole('button', { name: 'Bold', pressed: true }),
  ).toBeVisible();
  for (const name of ['Toggle outline sm', 'Toggle ghost sm']) {
    const box = await section.getByRole('button', { name }).boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(24);
    expect(box?.height).toBeGreaterThanOrEqual(24);
  }

  await audit(page, 'disclosure-open-axe', 'section[aria-label="Disclosure"]');
});

test('floating overlays: tooltip, popover and dropdown menu keyboard and axe', async ({
  page,
}) => {
  const section = page.getByRole('region', { name: 'Floating overlays' });
  const copy = section.getByRole('button', { name: 'Copy link' });
  const display = section.getByRole('button', { name: 'Display settings' });
  const actions = section.getByRole('button', { name: 'Document actions' });
  await audit(
    page,
    'floating-overlays-closed-axe',
    'section[aria-label="Floating overlays"]',
  );

  // Tooltip: real keyboard focus shows it; Escape hides it without moving focus.
  await display.focus();
  await page.keyboard.press('Shift+Tab');
  await expect(copy).toBeFocused();
  const tooltip = page.getByRole('tooltip');
  await expect(tooltip).toHaveText('Copy the page link to the clipboard');
  await expect(copy).toHaveAccessibleName('Copy link');
  await expect(copy).toHaveAccessibleDescription(
    'Copy the page link to the clipboard',
  );
  await settleAnimations(page, '[role="tooltip"]');
  await audit(page, 'tooltip-axe', '[role="tooltip"]');
  await page.keyboard.press('Escape');
  await expect(tooltip).toBeHidden();
  await expect(copy).toBeFocused();
  // Hover, then move the pointer onto the popup: it must stay open (1.4.13).
  await copy.hover();
  await expect(tooltip).toBeVisible();
  const tipBox = await tooltip.boundingBox();
  if (!tipBox) throw new Error('Tooltip has no layout box');
  await page.mouse.move(
    tipBox.x + tipBox.width / 2,
    tipBox.y + tipBox.height / 2,
    { steps: 8 },
  );
  await page.waitForTimeout(300);
  await expect(tooltip).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(tooltip).toBeHidden();

  // Popover: Enter opens and moves focus inside; Escape closes and restores focus.
  await display.focus();
  await page.keyboard.press('Enter');
  const popover = page.getByRole('dialog', { name: 'Display' });
  await expect(popover).toBeVisible();
  await expect(popover).toHaveAccessibleDescription('Adjust the text size.');
  await expect
    .poll(() =>
      popover.evaluate((node) => node.contains(document.activeElement)),
    )
    .toBe(true);
  await settleAnimations(page, '[role="dialog"]');
  await audit(page, 'popover-axe', '[role="dialog"]');
  await page.keyboard.press('Escape');
  await expect(popover).toBeHidden();
  await expect(display).toBeFocused();

  // Dropdown menu: arrow keys, Home/End, typeahead, disabled item, Escape and focus return.
  await actions.focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu', { name: 'Document actions' });
  await expect(menu).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Duplicate' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  const remove = page.getByRole('menuitem', { name: 'Delete' });
  await expect(remove).toBeFocused();
  await expect(remove).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Enter');
  await expect(menu).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.getByRole('menuitem', { name: 'Share' })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeFocused();
  await page.keyboard.press('s');
  await expect(page.getByRole('menuitem', { name: 'Share' })).toBeFocused();
  await expect(page.getByRole('group', { name: 'Document' })).toBeVisible();
  await settleAnimations(page, '[role="menu"]');
  await audit(page, 'dropdown-menu-axe', '[role="menu"]');
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(actions).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(menu).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(menu).toBeHidden();
  await expect(actions).toBeFocused();
});

test('alert dialog focuses cancel, ignores outside presses and restores focus', async ({
  page,
}) => {
  const section = page.getByRole('region', { name: 'Notifications' });
  const trigger = section.getByRole('button', { name: 'Delete file' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('alertdialog', { name: 'Delete file?' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleDescription('This cannot be undone.');
  const cancel = page.getByRole('button', { name: 'Cancel' });
  await expect(cancel).toBeFocused();
  for (const key of ['Tab', 'Tab', 'Shift+Tab']) {
    await page.keyboard.press(key);
    await expect
      .poll(() =>
        dialog.evaluate((node) => node.contains(document.activeElement)),
      )
      .toBe(true);
  }
  await settleAnimations(page, '[role="alertdialog"]');
  await audit(page, 'alert-dialog-axe', '[role="alertdialog"]');
  await page.mouse.click(4, 4);
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(cancel).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('toasts announce without moving focus and are keyboard reachable', async ({
  page,
}) => {
  const show = page.getByRole('button', { name: 'Show toast' });
  await show.focus();
  await page.keyboard.press('Enter');
  const toast = page.getByRole('dialog', { name: 'Saved' });
  await expect(toast).toBeVisible();
  await expect(toast).toHaveAccessibleDescription('Your changes were applied.');
  await expect(show).toBeFocused();
  const region = page.getByRole('region', { name: 'Status messages' });
  await expect(region).toHaveAttribute('aria-live', 'polite');
  await page.keyboard.press('F6');
  await expect(region).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(toast).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Undo' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Dismiss' })).toBeFocused();
  // Audit the toast itself, as the dialog tests do: the viewport also holds
  // Base UI's aria-hidden focus-guard spans, which axe reports as
  // aria-hidden-focus "incomplete" (recorded as a residual manual check).
  await settleAnimations(page, '.ui-toast');
  await audit(page, 'toast-axe', '.ui-toast');
  await page.keyboard.press('Enter');
  await expect(toast).toBeHidden();
});

test('display components keep semantics, keyboard order and reduced motion', async ({
  page,
}) => {
  // exact: true — "Display" would otherwise also match "Static display".
  const section = page.getByRole('region', { name: 'Display', exact: true });
  await expect(section.getByRole('status')).toHaveCount(2);
  await expect(section.getByText('Loading', { exact: true })).toBeAttached();
  await expect(
    section.getByRole('button', { name: 'Saving', exact: true }),
  ).toBeDisabled();
  await expect(section.locator('.ui-skeleton[aria-hidden="true"]')).toHaveCount(
    2,
  );
  await expect(
    section.getByRole('heading', { level: 2, name: 'Card title' }),
  ).toBeVisible();
  await expect(section.getByRole('alert')).toHaveText('Error: could not save');
  await expect(section.getByRole('img', { name: 'Aya' })).toBeVisible();
  await expect(section.getByText('K', { exact: true })).toBeVisible();

  // Real keyboard input. Clicking the first badge sets Chromium's sequential
  // focus starting point inside the section; Tab must skip badges, skeletons,
  // spinners, the disabled Saving button and card parts and reach Card action.
  const action = section.getByRole('button', { name: 'Card action' });
  await section.getByText('solid badge').click();
  await page.keyboard.press('Tab');
  await expect(action).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(action).not.toBeFocused();
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(
          document.activeElement?.closest('section[aria-label="Display"]'),
        ),
      ),
    )
    .toBe(false);

  // Emulated prefers-reduced-motion only; the OS setting stays a manual check.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const selector of ['.ui-spinner__ring', '.ui-skeleton']) {
    const animation = await section
      .locator(selector)
      .first()
      .evaluate((node) => getComputedStyle(node).animationName);
    expect(animation).toBe('none');
  }
  const ring = await section.locator('.ui-spinner__ring').first().boundingBox();
  expect(ring?.width).toBeGreaterThan(0);
  expect(ring?.height).toBeGreaterThan(0);
  await audit(page, 'display-axe', 'section[aria-label="Display"]');
});

/** Rendered box of a visible element; fails instead of defaulting to zero. */
async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Expected a rendered box');
  return box;
}

async function expectTargetSize(locator: Locator) {
  const box = await boxOf(locator);
  expect(box.width).toBeGreaterThanOrEqual(24);
  expect(box.height).toBeGreaterThanOrEqual(24);
}

test('input group keeps focus, Tab order, states and no accidental submit', async ({
  page,
}) => {
  const section = page.getByRole('region', { name: 'Groups' });
  await audit(page, 'groups-axe', 'section[aria-label="Groups"]');
  const counts = section.getByTestId('group-counts');
  const form = section.locator('form');
  await form.evaluate((node) => {
    node.dataset.submits = '0';
    node.addEventListener('submit', (event) => {
      event.preventDefault();
      node.dataset.submits = String(Number(node.dataset.submits) + 1);
    });
  });

  // The frame shows focus, Tab reaches the addon button next, Enter in the
  // input never activates it and the button never submits.
  const query = section.getByRole('searchbox', { name: 'Search docs' });
  const groups = section.locator('.ui-input-group');
  await query.focus();
  await expect(groups.first()).not.toHaveCSS('box-shadow', 'none');
  await page.keyboard.type('focus');
  await expect(query).toHaveValue('focus');
  // Native implicit submission from the only text field, not the addon button.
  await page.keyboard.press('Enter');
  await expect(form).toHaveAttribute('data-submits', '1');
  await expect(counts).toHaveText('searches 0');
  await page.keyboard.press('Tab');
  const run = section.getByRole('button', { name: 'Run search' });
  await expect(run).toBeFocused();
  await expect(run).not.toHaveCSS('box-shadow', 'none');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expect(counts).toHaveText('searches 2');
  await expect(form).toHaveAttribute('data-submits', '1');
  await expectTargetSize(run);
  const [inputBox, runBox] = await Promise.all([boxOf(query), boxOf(run)]);
  expect(runBox.x).toBeGreaterThanOrEqual(inputBox.x + inputBox.width - 0.5);

  // Root reflects invalid and disabled controls; the unit stays described.
  const weight = section.getByRole('textbox', { name: 'Parcel weight' });
  await expect(weight).toHaveAttribute('aria-invalid', 'true');
  await expect(weight).toHaveAccessibleDescription(
    'kilograms per parcel Enter the weight as a number.',
  );
  const [normalBorder, invalidBorder] = await Promise.all(
    [0, 1].map((index) =>
      groups
        .nth(index)
        .evaluate((node) => getComputedStyle(node).borderTopColor),
    ),
  );
  expect(invalidBorder).not.toBe(normalBorder);
  await expect(groups.nth(2)).toHaveCSS('cursor', 'not-allowed');
  const mirror = section.getByRole('textbox', { name: 'Mirror site' });
  await expect(mirror).toBeDisabled();
  await expect(mirror).toHaveCSS('opacity', '0.55');
});

test('toggle group roves with real arrow keys and toggles with Space/Enter', async ({
  page,
}) => {
  const section = page.getByRole('region', { name: 'Groups' });
  // One Tab stop, arrows skip disabled items, Home/End, Space/Enter.
  const style = section.getByRole('group', { name: 'Text style' });
  const bold = style.getByRole('button', { name: 'Bold' });
  const strike = style.getByRole('button', { name: 'Strike' });
  await bold.focus();
  await page.keyboard.press('ArrowRight');
  await expect(style.getByRole('button', { name: 'Italic' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(strike).toBeFocused();
  await page.keyboard.press('Home');
  await expect(bold).toBeFocused();
  await page.keyboard.press('End');
  await expect(strike).toBeFocused();
  await page.keyboard.press('Space');
  await expect(strike).toHaveAttribute('aria-pressed', 'true');
  await expect(bold).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Enter');
  await expect(strike).toHaveAttribute('aria-pressed', 'false');

  // Tab leaves the group; the vertical single-value group uses Up/Down.
  await page.keyboard.press('Tab');
  const layout = section.getByRole('group', { name: 'Layout' });
  const list = layout.getByRole('button', { name: 'List' });
  const grid = layout.getByRole('button', { name: 'Grid' });
  await expect(list).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(grid).toBeFocused();
  await page.keyboard.press('Space');
  await expect(grid).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('ArrowUp');
  await expect(list).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(list).toHaveAttribute('aria-pressed', 'true');
  await expect(grid).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('Space');
  await expect(list).toHaveAttribute('aria-pressed', 'false');
  await expectTargetSize(bold);
  await expectTargetSize(layout.getByRole('button', { name: 'Board' }));
});

test('button group keeps every enabled button in Tab order with visible focus', async ({
  page,
}) => {
  const section = page.getByRole('region', { name: 'Groups' });
  const history = section.getByRole('group', { name: 'History' });
  await history.getByRole('button', { name: 'Step back' }).focus();
  for (const name of ['Step back', 'Step forward', 'Publish']) {
    const button = history.getByRole('button', { name });
    await expect(button).toBeFocused();
    // The focused button is raised so neighbors never cover its ring.
    await expect(button).toHaveCSS('z-index', '1');
    await expect(button).not.toHaveCSS('box-shadow', 'none');
    await page.keyboard.press('Tab');
  }
  const zoom = section.getByRole('group', { name: 'Zoom' });
  const zoomIn = zoom.getByRole('button', { name: 'Zoom in' });
  await expect(zoomIn).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(zoom.getByRole('button', { name: 'Reset zoom' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(zoomIn).toBeFocused();
  await expect(zoom.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
  await expectTargetSize(zoomIn);
  const [back, forward] = await Promise.all([
    boxOf(history.getByRole('button', { name: 'Step back' })),
    boxOf(history.getByRole('button', { name: 'Step forward' })),
  ]);
  // Adjacent borders overlap by one pixel instead of doubling.
  expect(back.x + back.width - forward.x).toBeCloseTo(1, 0);
});
