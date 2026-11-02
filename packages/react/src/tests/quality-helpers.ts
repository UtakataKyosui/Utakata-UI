import { act, cleanup, screen } from '@testing-library/react';
import { expect, vi } from 'vitest';
import {
  evaluateQuality,
  formatQualityReport,
  type QualityCheck,
  type QualityRule,
} from '../metadata/quality.js';

/** Unmounts everything rendered by each check, even when it fails. */
export function isolateChecks(
  checks: Readonly<Record<string, QualityCheck>>,
): Record<string, QualityCheck> {
  return Object.fromEntries(
    Object.entries(checks).map(([id, check]) => [
      id,
      async () => {
        try {
          await check();
        } finally {
          cleanup();
        }
      },
    ]),
  );
}

/**
 * Runs a component's automated quality checks in isolation and fails on any
 * failed automated rule or development accessibility diagnostic.
 */
export async function expectAutomatedQuality(
  rules: readonly QualityRule[],
  checks: Readonly<Record<string, QualityCheck>>,
) {
  const warn = vi.spyOn(console, 'warn');
  try {
    // Browser rules are evaluated separately by the required Playwright gate.
    const report = await evaluateQuality(
      rules.filter((rule) => rule.verification !== 'browser'),
      isolateChecks(checks),
    );
    expect(report.automatedPassed, formatQualityReport(report.results)).toBe(
      true,
    );
    // Diagnostics run after commit; let deferred warnings arrive first.
    await settle(0);
    expect(
      warn.mock.calls.filter(([message]) =>
        String(message).startsWith('[Utakata-UI a11y]'),
      ),
    ).toEqual([]);
    return report;
  } finally {
    warn.mockRestore();
  }
}

/** Lets Base UI effects and timers flush inside act(). */
export const settle = (ms = 20) =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });

/**
 * Asserts the textboxes named "Disabled" and "Read only": disabled is not
 * focusable, read-only stays focusable and keeps its value "kept".
 */
export function expectDisabledAndReadOnlyTextboxes() {
  const disabled = screen.getByRole('textbox', { name: 'Disabled' });
  expect(disabled).toBeDisabled();
  disabled.focus();
  expect(disabled).not.toHaveFocus();
  const readOnly = screen.getByRole('textbox', { name: 'Read only' });
  expect(readOnly).toHaveAttribute('readonly');
  readOnly.focus();
  expect(readOnly).toHaveFocus();
  expect(readOnly).toHaveValue('kept');
}
