import { expect, type Page, test } from '@playwright/test';
import { componentManifest } from '../../packages/react/src/metadata/manifest.js';
import {
  evaluateQuality,
  formatQualityReport,
  qualityRules,
} from '../../packages/react/src/metadata/quality.js';
import { measureRenderedColors } from './rendered-colors.js';

/**
 * State audit for interactive controls. Real mouse hover and press are driven
 * through Playwright's pointer; the press is released away from the control so
 * no action is committed. Expected behavior per control is registered below
 * rather than derived from the stylesheet, so a missing rule fails.
 */

type Forced = 'border' | 'pair' | 'stable';

interface Case {
  id: string;
  /** react: hover and press must differ from rest. stable: they must not. */
  kind: 'react' | 'stable';
  /** text: 4.5:1 for the label; shape: 3:1 for the control boundary or fill. */
  contrast?: 'text' | 'shape';
  /** Element, below the interactive one, that carries the painted state. */
  paint?: string;
  /** Forced colors: hover border, selected pair, or no change at all. */
  forced: Forced;
  /** Forced colors: pressing fills with Highlight. */
  activeFill?: boolean;
  /** Forced colors: the press state (popup open) shows a Highlight border. */
  activeBorder?: boolean;
  /** Forced colors: the selected pair includes HighlightText. */
  pairText?: boolean;
  /** Forced colors: pressing underlines the label (toggles keep Highlight for pressed). */
  activeUnderline?: boolean;
  /** Disabled or read-only: hover and press must leave the rendering identical. */
  disabled?: boolean;
}

const { sizes, variants } = componentManifest.components.Button;
const toggleVariants = componentManifest.components.Toggle.variants;

function buildCases(): Case[] {
  const cases: Case[] = [];
  const text = (id: string, extra: Partial<Case> = {}): Case => ({
    id,
    kind: 'react',
    contrast: 'text',
    forced: 'border',
    activeFill: true,
    ...extra,
  });
  const disabled = (id: string, contrast?: 'text' | 'shape'): Case => ({
    id,
    kind: 'stable',
    forced: 'stable',
    disabled: true,
    ...(contrast ? { contrast } : {}),
  });
  for (const variant of variants)
    for (const size of sizes) {
      cases.push(text(`button-${variant}-${size}`));
      cases.push(disabled(`button-${variant}-${size}-disabled`));
    }
  cases.push(text('collapsible'), disabled('collapsible-disabled'));
  cases.push(text('accordion'), disabled('accordion-disabled'));
  cases.push(text('tab'), disabled('tab-disabled'));
  // A selected tab keeps its underline and weight; it has no hover tint.
  cases.push({
    id: 'tab-selected',
    kind: 'stable',
    contrast: 'text',
    forced: 'stable',
  });
  for (const id of [
    ...toggleVariants.map((variant) => `toggle-${variant}`),
    'toggle-group-item',
  ]) {
    cases.push(
      text(id, { activeFill: false, activeUnderline: true }),
      disabled(`${id}-disabled`),
    );
    cases.push(
      text(`${id}-pressed`, {
        forced: 'pair',
        pairText: true,
        activeFill: false,
      }),
    );
  }
  // Base UI opens the popup on pointer down, so the press is data-pressed.
  const popup = { activeFill: false, activeBorder: true };
  cases.push(text('select', popup), disabled('select-disabled'));
  cases.push(text('select-invalid', popup));
  cases.push({
    id: 'checkbox',
    kind: 'react',
    contrast: 'shape',
    forced: 'border',
  });
  cases.push({
    id: 'checkbox-checked',
    kind: 'react',
    contrast: 'text',
    forced: 'pair',
    pairText: true,
  });
  cases.push({
    id: 'checkbox-invalid',
    kind: 'react',
    contrast: 'shape',
    forced: 'border',
  });
  cases.push(
    disabled('checkbox-disabled'),
    disabled('checkbox-disabled-checked'),
  );
  cases.push({
    id: 'switch',
    kind: 'react',
    contrast: 'shape',
    forced: 'border',
  });
  cases.push({
    id: 'switch-checked',
    kind: 'react',
    contrast: 'shape',
    forced: 'pair',
  });
  cases.push(disabled('switch-disabled'), disabled('switch-readonly'));
  for (const id of ['radio', 'radio-invalid'])
    cases.push({
      id,
      kind: 'react',
      contrast: 'shape',
      paint: '.ui-radio-group__indicator',
      forced: 'border',
    });
  cases.push({
    id: 'radio-checked',
    kind: 'react',
    contrast: 'shape',
    paint: '.ui-radio-group__indicator',
    forced: 'stable',
  });
  cases.push(disabled('radio-disabled'));
  cases.push({
    id: 'slider-thumb',
    kind: 'react',
    contrast: 'shape',
    forced: 'border',
    activeFill: true,
  });
  cases.push(disabled('slider-thumb-disabled'));
  return cases;
}

const allCases = buildCases();

interface Sample {
  background: string;
  color: string;
  border: string;
  shadow: string;
  outline: string;
  opacity: string;
  decoration: string;
  /** Transition durations and animation names, including pseudo-elements. */
  motion: { durations: string[]; animations: string[] };
  rect: { x: number; y: number; width: number; height: number };
  text: number;
  shape: number;
}

type Sequence = Record<'rest' | 'hover' | 'active', Sample>;

async function settle(page: Page) {
  // Colors transition over 150 ms; measure only after every animation ended.
  await page.evaluate(async () => {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    await Promise.all(
      document.getAnimations().map((animation) =>
        animation.finished.then(
          () => undefined,
          () => undefined,
        ),
      ),
    );
  });
}

async function sample(
  page: Page,
  testCase: Case,
  measureContrast: boolean,
): Promise<Sample> {
  const selector = `[data-case="${testCase.id}"]`;
  const painted = testCase.paint ? `${selector} ${testCase.paint}` : selector;
  // One round trip: wait for transitions, then read the state.
  const state = await page.evaluate(
    async ([target, paint]) => {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      await Promise.all(
        document.getAnimations().map((animation) =>
          animation.finished.then(
            () => undefined,
            () => undefined,
          ),
        ),
      );
      const node = document.querySelector(target as string);
      const painted = document.querySelector(paint as string);
      if (!node || !painted) return null;
      const box = node.getBoundingClientRect();
      const computed = getComputedStyle(painted);
      return {
        background: computed.backgroundColor,
        color: computed.color,
        border: [
          computed.borderTopColor,
          computed.borderRightColor,
          computed.borderBottomColor,
          computed.borderLeftColor,
        ].join('|'),
        shadow: computed.boxShadow,
        outline: `${computed.outlineStyle} ${computed.outlineWidth}`,
        opacity: computed.opacity,
        decoration: computed.textDecorationLine,
        motion: {
          durations: [undefined, '::before', '::after'].flatMap((pseudo) => {
            const style = getComputedStyle(painted, pseudo);
            return [style.transitionDuration];
          }),
          animations: [undefined, '::before', '::after'].map(
            (pseudo) => getComputedStyle(painted, pseudo).animationName,
          ),
        },
        rect: { x: box.x, y: box.y, width: box.width, height: box.height },
      };
    },
    [selector, painted],
  );
  if (!state) throw new Error(`Not rendered: ${testCase.id}`);
  let text = Number.POSITIVE_INFINITY;
  let shape = Number.POSITIVE_INFINITY;
  if (measureContrast && testCase.contrast) {
    const [measured] = await measureRenderedColors(page, painted);
    if (!measured) throw new Error(`Unmeasured: ${testCase.id}`);
    text = measured.text;
    shape = Math.max(measured.border, measured.fill);
  }
  return { ...state, text, shape };
}

async function drive(
  page: Page,
  testCase: Case,
  measureContrast: boolean,
): Promise<Sequence> {
  await page
    .locator(`[data-case="${testCase.id}"]`)
    .evaluate((node) => node.scrollIntoView({ block: 'center' }));
  await page.mouse.move(0, 0);
  const rest = await sample(page, testCase, measureContrast);
  await page.mouse.move(
    rest.rect.x + rest.rect.width / 2,
    rest.rect.y + rest.rect.height / 2,
  );
  const hover = await sample(page, testCase, measureContrast);
  await page.mouse.down();
  const active = await sample(page, testCase, measureContrast);
  // Release away from the control so Toggle, Checkbox or Accordion do not
  // commit. A slider releases in place: leaving would keep dragging.
  if (!testCase.id.startsWith('slider')) await page.mouse.move(0, 0);
  await page.mouse.up();
  // Close a popup the press opened and drop focus before the next control.
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
  });
  return { rest, hover, active };
}

function describeCases(only?: readonly string[]) {
  return only ? allCases.filter((entry) => only.includes(entry.id)) : allCases;
}

/** The painted appearance of a sample, without geometry, measurements or motion. */
function appearance(item: Sample) {
  const {
    rect: _rect,
    text: _text,
    shape: _shape,
    motion: _motion,
    ...rest
  } = item;
  return rest;
}

function sameRect(a: Sample['rect'], b: Sample['rect']) {
  return (
    Math.abs(a.x - b.x) < 0.01 &&
    Math.abs(a.y - b.y) < 0.01 &&
    Math.abs(a.width - b.width) < 0.01 &&
    Math.abs(a.height - b.height) < 0.01
  );
}

async function systemColors(page: Page) {
  return page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.forcedColorAdjust = 'none';
    probe.style.backgroundColor = 'Highlight';
    probe.style.color = 'HighlightText';
    document.body.append(probe);
    const style = getComputedStyle(probe);
    const result = {
      highlight: style.backgroundColor,
      highlightText: style.color,
    };
    probe.remove();
    return result;
  });
}

async function verifyStates(page: Page, only?: readonly string[]) {
  const evidence: Record<string, Sequence> = {};
  for (const testCase of describeCases(only).filter(
    (entry) => entry.contrast || entry.kind === 'react',
  )) {
    if (testCase.disabled) continue;
    const sequence = await drive(page, testCase, true);
    evidence[testCase.id] = sequence;
    const label = testCase.id;
    for (const state of ['rest', 'hover', 'active'] as const) {
      const item = sequence[state];
      if (testCase.contrast === 'text')
        expect(
          item.text,
          `${label} ${state} text contrast`,
        ).toBeGreaterThanOrEqual(4.5);
      if (testCase.contrast === 'shape')
        expect(
          item.shape,
          `${label} ${state} shape contrast`,
        ).toBeGreaterThanOrEqual(3);
      expect(
        sameRect(item.rect, sequence.rest.rect),
        `${label} ${state} layout shift`,
      ).toBe(true);
    }
    if (testCase.kind === 'react') {
      expect(
        sequence.hover.background,
        `${label} hover gives no visible feedback`,
      ).not.toBe(sequence.rest.background);
      expect(
        sequence.active.background,
        `${label} press does not differ from hover`,
      ).not.toBe(sequence.hover.background);
      // Hover and press never borrow the selected treatment: shadow and
      // outline stay as at rest (the focus ring is a keyboard-only state).
      for (const state of ['hover', 'active'] as const) {
        expect(
          sequence[state].shadow,
          `${label} ${state} adds a selected-style shadow`,
        ).toBe(sequence.rest.shadow);
        expect(
          sequence[state].outline,
          `${label} ${state} adds an outline`,
        ).toBe(sequence.rest.outline);
      }
    } else {
      expect(
        sequence.hover.background,
        `${label} selected state reacts to hover`,
      ).toBe(sequence.rest.background);
    }
  }
  return evidence;
}

async function verifyDisabled(page: Page, only?: readonly string[]) {
  const evidence: Record<string, Sequence> = {};
  for (const testCase of describeCases(only).filter(
    (entry) => entry.disabled,
  )) {
    const sequence = await drive(page, testCase, false);
    evidence[testCase.id] = sequence;
    for (const state of ['hover', 'active'] as const) {
      expect(
        appearance(sequence[state]),
        `disabled ${testCase.id} changed on ${state}`,
      ).toEqual(appearance(sequence.rest));
      expect(
        sameRect(sequence[state].rect, sequence.rest.rect),
        `disabled ${testCase.id} layout shift on ${state}`,
      ).toBe(true);
    }
  }
  // A read-only switch must not react either.
  expect(
    Object.keys(evidence).length,
    'disabled cases measured',
  ).toBeGreaterThan(0);
  return evidence;
}

async function verifyForced(page: Page, only?: readonly string[]) {
  await page.emulateMedia({ forcedColors: 'active' });
  const { highlight, highlightText } = await systemColors(page);
  const evidence: Record<string, Sequence> = {};
  for (const testCase of describeCases(only)) {
    const sequence = await drive(page, testCase, false);
    evidence[testCase.id] = sequence;
    const label = `forced ${testCase.id}`;
    if (testCase.forced === 'border') {
      expect(
        sequence.rest.border.split('|')[0],
        `${label} rest already uses Highlight`,
      ).not.toBe(highlight);
      expect(
        sequence.hover.border.split('|')[0],
        `${label} hover has no Highlight border`,
      ).toBe(highlight);
      if (testCase.activeFill)
        expect(
          sequence.active.background,
          `${label} press has no Highlight fill`,
        ).toBe(highlight);
      if (testCase.activeUnderline) {
        expect(
          sequence.rest.decoration,
          `${label} rest is already underlined`,
        ).not.toContain('underline');
        expect(
          sequence.active.decoration,
          `${label} press has no underline cue`,
        ).toContain('underline');
      }
      if (testCase.activeBorder)
        expect(
          sequence.active.border.split('|')[0],
          `${label} open or pressed state has no Highlight border`,
        ).toBe(highlight);
    }
    if (testCase.forced === 'pair')
      for (const state of ['rest', 'hover', 'active'] as const) {
        expect(
          sequence[state].background,
          `${label} ${state} lost the Highlight fill`,
        ).toBe(highlight);
        if (testCase.pairText)
          expect(
            sequence[state].color,
            `${label} ${state} lost HighlightText`,
          ).toBe(highlightText);
      }
    if (testCase.forced === 'stable')
      for (const state of ['hover', 'active'] as const) {
        expect(
          appearance(sequence[state]),
          `${label} changed on ${state}`,
        ).toEqual(appearance(sequence.rest));
      }
  }
  return evidence;
}

async function verifyReducedMotion(page: Page, only?: readonly string[]) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const evidence: Record<string, Sequence> = {};
  for (const testCase of describeCases(only).filter(
    (entry) => !entry.disabled,
  )) {
    const sequence = await drive(page, testCase, false);
    evidence[testCase.id] = sequence;
    for (const state of ['rest', 'hover', 'active'] as const) {
      const { durations, animations } = sequence[state].motion;
      for (const duration of durations)
        for (const value of duration.split(','))
          expect(
            Number.parseFloat(value),
            `${testCase.id} ${state} motion: transition ${duration}`,
          ).toBe(0);
      for (const name of animations)
        expect(name, `${testCase.id} ${state} motion: animation`).toBe('none');
    }
    // Without motion the state must still be visible.
    if (testCase.kind === 'react')
      expect(
        sequence.hover.background,
        `${testCase.id} hover is invisible without motion`,
      ).not.toBe(sequence.rest.background);
  }
  return evidence;
}

async function ungatedHoverRules(page: Page) {
  return page.evaluate(() => {
    const ungated: string[] = [];
    let hoverRules = 0;
    const walk = (rules: CSSRuleList, gated: boolean) => {
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSStyleRule) {
          if (
            /:hover/.test(rule.selectorText) &&
            /\.ui-/.test(rule.selectorText)
          ) {
            hoverRules += 1;
            if (!gated) ungated.push(rule.selectorText);
          }
          walk(rule.cssRules, gated);
        } else if (rule instanceof CSSMediaRule) {
          walk(
            rule.cssRules,
            gated || /hover:\s*hover/.test(rule.conditionText),
          );
        } else if ('cssRules' in rule) {
          walk((rule as CSSGroupingRule).cssRules, gated);
        }
      }
    };
    let unreadable = 0;
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        walk(sheet.cssRules, false);
      } catch {
        unreadable += 1;
      }
    }
    return { ungated, hoverRules, unreadable };
  });
}

async function verifyHoverGate(page: Page) {
  const result = await ungatedHoverRules(page);
  expect(result.unreadable, 'unreadable stylesheets are unverified').toBe(0);
  expect(
    result.hoverRules,
    'no hover rule was scanned, so the scan proves nothing',
  ).toBeGreaterThan(0);
  expect(result.ungated, 'ungated hover rules').toEqual([]);
  return result;
}

const tapCases = [
  'button-solid-md',
  'button-outline-md',
  'button-ghost-md',
  'collapsible',
  'accordion',
];

async function verifyTouch(page: Page) {
  const hover = await page.evaluate(
    () => window.matchMedia('(hover: hover)').matches,
  );
  expect(hover, 'touch context must report no hover support').toBe(false);
  const evidence: Record<string, unknown> = {};
  for (const id of tapCases) {
    const target = page.locator(`[data-case="${id}"]`);
    await target.scrollIntoViewIfNeeded();
    await settle(page);
    const rest = await target.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    await target.tap();
    // Chromium keeps :active for a minimum interval after a tap.
    await page.waitForTimeout(400);
    await settle(page);
    const after = await target.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    evidence[id] = { rest, after };
    expect(after, `sticky hover after tapping ${id}`).toBe(rest);
  }
  return evidence;
}

async function runShared(
  browser: { version(): string },
  id: string,
  body: () => Promise<unknown>,
) {
  const rules = qualityRules.shared.filter(
    (rule) => rule.id === id && rule.verification === 'browser',
  );
  expect(rules).toHaveLength(1);
  let evidence: unknown;
  const report = await evaluateQuality(rules, {
    [id]: async () => {
      evidence = await body();
    },
  });
  await test.info().attach(`${id}-evidence`, {
    body: JSON.stringify({
      browser: browser.version(),
      platform: process.platform,
      project: test.info().project.name,
      report,
      evidence,
    }),
    contentType: 'application/json',
  });
  expect(report.automatedPassed, formatQualityReport(report.results)).toBe(
    true,
  );
}

// Each rule drives many real pointer moves; independent pages run in parallel.
test.describe.configure({ mode: 'parallel' });

test.beforeEach(async ({ page }) => {
  // Real pointer sequences over ~60 controls exceed the default 30 s under CI load.
  test.slow();
  await page.goto('/?interaction');
  await expect(
    page.getByRole('heading', { name: 'Interaction states' }),
  ).toBeVisible();
});

test('[theme.interaction-states] hover and press change enabled controls without shifting layout or losing contrast', async ({
  page,
  browser,
}) => {
  await runShared(browser, 'theme.interaction-states', () =>
    verifyStates(page),
  );
});

test('[theme.interaction-disabled] disabled and read-only controls do not react to hover or press', async ({
  page,
  browser,
}) => {
  await runShared(browser, 'theme.interaction-disabled', async () => {
    const standard = await verifyDisabled(page);
    await page.emulateMedia({ forcedColors: 'active' });
    const forced = await verifyDisabled(page);
    return { standard, forced };
  });
});

test('[theme.interaction-forced-colors] forced colors keep hover, press and selected pairs distinguishable', async ({
  page,
  browser,
}) => {
  await runShared(browser, 'theme.interaction-forced-colors', () =>
    verifyForced(page),
  );
});

test('[theme.interaction-reduced-motion] state changes run without transitions when motion is reduced', async ({
  page,
  browser,
}) => {
  await runShared(browser, 'theme.interaction-reduced-motion', () =>
    verifyReducedMotion(page),
  );
});

test('[theme.hover-touch] hover is gated by (hover: hover)', async ({
  page,
  browser,
}) => {
  await runShared(browser, 'theme.hover-touch', async () => ({
    stylesheet: await verifyHoverGate(page),
  }));
});

test.describe('touch context', () => {
  test.use({ hasTouch: true, isMobile: true });

  test('[theme.hover-touch] a tap leaves no sticky hover', async ({
    page,
    browser,
  }) => {
    await runShared(browser, 'theme.hover-touch', () => verifyTouch(page));
  });

  test('touch detector rejects an ungated hover rule', async ({ page }) => {
    await page.addStyleTag({
      content:
        '.ui-button:hover, .ui-collapsible__trigger:hover, .ui-accordion__trigger:hover { background-color: rgb(255, 0, 0) !important; }',
    });
    await expect(verifyTouch(page)).rejects.toThrow(/sticky hover/);
  });
});

for (const [name, css, only, check, label] of [
  [
    'a bare :hover rule',
    '.ui-toggle:hover { background-color: red; }',
    undefined,
    'gate',
    /ungated hover/,
  ],
  [
    'a disabled control that reacts to hover',
    '.ui-toggle[data-disabled]:hover { background-color: red !important; }',
    ['toggle-outline-disabled'],
    'disabled',
    /changed on hover/,
  ],
  [
    'an unreadable press color',
    '.ui-tabs__tab:active { background-color: #fff !important; color: #fff !important; }',
    ['tab'],
    'states',
    /active text contrast/,
  ],
  [
    'a hover that removes all feedback',
    '.ui-accordion__trigger:hover, .ui-accordion__trigger:active { background-color: transparent !important; }',
    ['accordion'],
    'states',
    /hover gives no visible feedback/,
  ],
  [
    'a hover that shifts layout',
    '.ui-toggle:hover { padding-inline: 2rem !important; }',
    ['toggle-outline'],
    'states',
    /layout shift/,
  ],
  [
    'a hover that borrows the selected shadow',
    '.ui-toggle:hover { box-shadow: inset 0 0 0 1px red !important; }',
    ['toggle-outline'],
    'states',
    /selected-style shadow/,
  ],
  [
    'a forced-colors leak on a selected toggle',
    '.ui-toggle[data-pressed]:hover { background-color: rgb(255, 0, 0) !important; }',
    ['toggle-outline-pressed'],
    'forced',
    /lost the Highlight fill/,
  ],
  [
    'a transition that survives reduced motion',
    '.ui-toggle { transition: background-color 1s !important; }',
    ['toggle-outline'],
    'motion',
    /motion: transition/,
  ],
  [
    'a forced-colors hover with no cue',
    '.ui-button:hover { border-color: CanvasText !important; }',
    ['button-solid-md'],
    'forced',
    /hover has no Highlight border/,
  ],
] as const) {
  test(`interaction detector rejects ${name}`, async ({ page }) => {
    await page.addStyleTag({ content: css });
    const run = {
      gate: () => verifyHoverGate(page),
      disabled: () => verifyDisabled(page, only),
      states: () => verifyStates(page, only),
      forced: () => verifyForced(page, only),
      motion: () => verifyReducedMotion(page, only),
    }[check];
    await expect(run()).rejects.toThrow(label);
  });
}

test('interaction audit measures every registered control', async ({
  page,
}) => {
  for (const testCase of allCases) {
    await expect(
      page.locator(`[data-case="${testCase.id}"]`),
      testCase.id,
    ).toHaveCount(1);
  }
  // Invalid styling is reachable only if Base UI exposes the state attribute.
  for (const id of ['select-invalid', 'checkbox-invalid', 'radio-invalid'])
    await expect(
      page.locator(`[data-case="${id}"]`),
      `${id} exposes data-invalid`,
    ).toHaveAttribute('data-invalid', '');
  // The only controls without a registered case would be silently unaudited.
  const rendered = await page
    .locator('[data-case]')
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-case') ?? ''),
    );
  expect(rendered.sort()).toEqual(allCases.map((entry) => entry.id).sort());
});
