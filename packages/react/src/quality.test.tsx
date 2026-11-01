import { describe, expect, it } from 'vitest';
import {
  evaluateQuality,
  formatQualityReport,
  type QualityRule,
} from './quality.js';

const required: QualityRule = {
  id: 'example.required',
  requirement: 'Required behavior',
  severity: 'error',
  verification: 'automated',
  remediation: 'Restore required behavior.',
};

describe('quality evaluation', () => {
  it('blocks missing and failing required checks with actionable output', async () => {
    const missing = await evaluateQuality([required], {});
    expect(missing.automatedPassed).toBe(false);
    expect(missing.results[0]?.status).toBe('unverified');
    const failed = await evaluateQuality([required], {
      [required.id]: async () => {
        throw new Error('Missing label');
      },
    });
    expect(failed.automatedPassed).toBe(false);
    expect(formatQualityReport(failed.results)).toContain('Missing label');
    expect(formatQualityReport(failed.results)).toContain(required.remediation);
  });

  it('keeps manual checks pending and warning failures nonblocking', async () => {
    const manual: QualityRule = {
      ...required,
      id: 'review',
      verification: 'manual',
    };
    const warning: QualityRule = {
      ...required,
      id: 'warning',
      severity: 'warning',
    };
    const report = await evaluateQuality([required, manual, warning], {
      [required.id]: () => {},
      review: () => {
        throw new Error('Must not run');
      },
      warning: () => {
        throw new Error('Advisory');
      },
    });
    expect(report.automatedPassed).toBe(true);
    expect(report.complete).toBe(false);
    expect(report.results.map(({ status }) => status)).toEqual([
      'passed',
      'unverified',
      'failed',
    ]);
  });

  it('rejects duplicate rules and unknown checks', async () => {
    await expect(evaluateQuality([required, required], {})).rejects.toThrow(
      'Duplicate',
    );
    await expect(
      evaluateQuality([required], { typo: () => {} }),
    ).rejects.toThrow('Unknown');
    expect(
      (await evaluateQuality([required], { [required.id]: () => {} })).complete,
    ).toBe(true);
  });
});
