import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
} from '../../packages/react/src/metadata/quality.js';
import { measureOverflow, measureRenderedColors } from './rendered-colors.js';

/**
 * Deterministic visual properties of InputOTP slots, one rule per property so
 * each can fail independently. Applicability: every InputOTP.Slot in the
 * "Input OTP" fixture (empty, filled/invalid and disabled) in the light and
 * dark Chromium projects. Chromium emulation is not physical forced colors or
 * browser zoom; those stay in input-otp.zoom-physical (manual).
 */

const slots = 'section[aria-label="Input OTP"] .ui-input-otp__slot';
const enabled = `${slots}:enabled`;
const invalid = `${slots}[aria-invalid="true"]`;
const valid = `${slots}:enabled:not([aria-invalid="true"])`;

async function verifyTargetSize(page: Page) {
  const measured = await measureRenderedColors(page, slots);
  // Empty, filled, invalid and disabled slots are all present.
  expect(measured.length).toBeGreaterThanOrEqual(8);
  for (const slot of measured) {
    expect(slot.width).toBeGreaterThanOrEqual(24);
    expect(slot.height).toBeGreaterThanOrEqual(24);
  }
}

async function verifyContrast(page: Page) {
  const measured = await measureRenderedColors(page, enabled);
  expect(measured.length).toBeGreaterThanOrEqual(6);
  // Inactive controls are exempt from WCAG contrast thresholds.
  for (const slot of measured) {
    expect(slot.text).toBeGreaterThanOrEqual(4.5);
    expect(slot.border).toBeGreaterThanOrEqual(3);
  }
}

async function focusRing(page: Page, selector: string) {
  const slot = page.locator(selector).first();
  await slot.focus();
  // A key press makes :focus-visible apply deterministically.
  await page.keyboard.press('Shift');
  return slot.evaluate((node) => {
    const style = getComputedStyle(node);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Unverified color: no canvas context');
    const rgba = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = '#000';
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const data = context.getImageData(0, 0, 1, 1).data;
      return [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0, (data[3] ?? 0) / 255];
    };
    const luminance = (c: number[]) => {
      const [r = 0, g = 0, b = 0] = c.map((v) => {
        const x = v / 255;
        return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    let background = [255, 255, 255, 1];
    const layers: number[][] = [];
    for (
      let current: Element | null = node.parentElement;
      current;
      current = current.parentElement
    )
      layers.push(rgba(getComputedStyle(current).backgroundColor));
    for (const layer of layers.reverse()) {
      const a = layer[3] ?? 0;
      background = [0, 1, 2].map(
        (i) => (layer[i] ?? 0) * a + (background[i] ?? 0) * (1 - a),
      );
      background.push(1);
    }
    const outline = rgba(style.outlineColor);
    const a = luminance(outline);
    const b = luminance(background);
    return {
      focusVisible: node.matches(':focus-visible'),
      style: style.outlineStyle,
      width: Number.parseFloat(style.outlineWidth),
      alpha: outline[3] ?? 0,
      contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
      shadow: style.boxShadow,
    };
  });
}

async function verifyFocusVisible(page: Page) {
  const ring = await focusRing(page, enabled);
  expect(ring.focusVisible).toBe(true);
  expect(ring.style).toBe('solid');
  expect(ring.width).toBeGreaterThanOrEqual(2);
  expect(ring.alpha).toBeGreaterThan(0);
  expect(ring.contrast).toBeGreaterThanOrEqual(3);
  expect(ring.shadow).not.toBe('none');
}

async function verifyInvalidState(page: Page) {
  const bad = await measureRenderedColors(page, invalid);
  const good = await measureRenderedColors(page, valid);
  expect(bad.length).toBeGreaterThanOrEqual(2);
  expect(good.length).toBeGreaterThanOrEqual(4);
  const normal = Math.max(...good.map((slot) => slot.borderWidth));
  // Not color alone: the invalid border is thicker, not just recolored.
  for (const slot of bad) {
    expect(slot.borderWidth).toBeGreaterThan(normal);
    expect(slot.border).toBeGreaterThanOrEqual(3);
  }
  const group = page.getByRole('group', { name: 'Backup code' });
  await expect(group.getByRole('textbox').first()).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(group).toHaveAccessibleDescription(
    'The code is not valid. Request a new code.',
  );
}

async function verifyForcedColors(page: Page) {
  await page.emulateMedia({ forcedColors: 'active' });
  const measured = await measureRenderedColors(page, enabled);
  expect(measured.length).toBeGreaterThanOrEqual(6);
  // Borders must stay drawn so each slot remains visible.
  for (const slot of measured) {
    expect(slot.borderStyle).toBe('solid');
    expect(slot.borderWidth).toBeGreaterThanOrEqual(1);
  }
  const ring = await focusRing(page, enabled);
  expect(ring.style).toBe('solid');
  expect(ring.width).toBeGreaterThanOrEqual(2);
  expect(ring.alpha).toBeGreaterThan(0);
}

async function verifyReflow(page: Page) {
  await page.setViewportSize({ width: 320, height: 720 });
  const roots = 'section[aria-label="Input OTP"] .ui-input-otp';
  const overflow = await measureOverflow(page, roots);
  expect(overflow.clipped.length).toBeGreaterThanOrEqual(3);
  expect(overflow.clipped.every((value) => !value)).toBe(true);
  expect(overflow.outside.every((value) => !value)).toBe(true);
  const measured = await measureRenderedColors(page, slots);
  for (const slot of measured) {
    expect(slot.left).toBeGreaterThanOrEqual(0);
    expect(slot.right).toBeLessThanOrEqual(320);
    expect(slot.width).toBeGreaterThanOrEqual(24);
  }
  const page2 = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(page2).toBeLessThanOrEqual(0);
}

const verifiers = {
  'input-otp.target-size': verifyTargetSize,
  'input-otp.contrast': verifyContrast,
  'input-otp.focus-visible': verifyFocusVisible,
  'input-otp.invalid-state': verifyInvalidState,
  'input-otp.forced-colors': verifyForcedColors,
  'input-otp.reflow': verifyReflow,
} as const;

/** Known-invalid renderings: each must make the matching verifier fail. */
const defects: Record<keyof typeof verifiers, string> = {
  'input-otp.target-size':
    '.ui-input-otp__slot{inline-size:10px!important;min-block-size:0!important;block-size:10px!important}',
  'input-otp.contrast':
    '.ui-input-otp__slot{color:#fff!important;background:#fff!important;border-color:#fff!important}',
  'input-otp.focus-visible':
    '.ui-input-otp__slot:focus-visible{outline:none!important;box-shadow:none!important}',
  'input-otp.invalid-state': '.ui-input-otp__slot{border-width:1px!important}',
  'input-otp.forced-colors':
    '.ui-input-otp__slot:focus-visible{outline:none!important}',
  'input-otp.reflow':
    '.ui-input-otp__slot{inline-size:200px!important}.ui-input-otp{flex-wrap:nowrap!important}',
};

for (const [id, verify] of Object.entries(verifiers) as [
  keyof typeof verifiers,
  (page: Page) => Promise<void>,
][]) {
  test(`[${id}] real browser rendering`, async ({ page, browser }) => {
    await page.goto('/');
    const rules = componentManifest.components.InputOTP.qualityRules.filter(
      (rule) => rule.id === id && rule.verification === 'browser',
    );
    expect(rules).toHaveLength(1);
    const report = await evaluateQuality(rules, {
      [id]: () => verify(page),
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

  test(`InputOTP detector for ${id} rejects a known-invalid rendering`, async ({
    page,
  }) => {
    await page.goto('/');
    await page.addStyleTag({ content: defects[id] });
    await expect(verify(page)).rejects.toThrow();
  });
}
