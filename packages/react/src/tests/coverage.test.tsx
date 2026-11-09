import { describe, expect, it } from 'vitest';
import {
  coverage,
  validateCoverage,
} from '../../../../tests/browser/coverage.js';
import { componentManifest } from '../metadata/manifest.js';

describe('public browser coverage registration', () => {
  const components = componentManifest.components;
  it('registers the current public components, axes and state checks', () => {
    expect(() => validateCoverage(components)).not.toThrow();
  });
  it('rejects a new public value until its fixture and coverage are reviewed', () => {
    expect(() =>
      validateCoverage({
        ...components,
        Button: {
          ...components.Button,
          variants: [...components.Button.variants, 'new'],
        },
      }),
    ).toThrow(/axes/);
    expect(() =>
      validateCoverage({ ...components, Future: components.Button }),
    ).toThrow(/component/);
  });
  it('rejects missing states, stale registrations and unknown checks', () => {
    expect(() =>
      validateCoverage(components, {
        ...coverage,
        Button: {
          ...coverage.Button,
          states: { enabled: 'baseline.rendered-axe' },
        },
      }),
    ).toThrow(/state definitions/);
    expect(() =>
      validateCoverage(components, {
        ...coverage,
        Button: { ...coverage.Button, states: {} },
      }),
    ).toThrow(/states/);
    expect(() =>
      validateCoverage(components, {
        ...coverage,
        Button: {
          ...coverage.Button,
          states: { ...coverage.Button.states, enabled: 'invented.check' },
        },
      }),
    ).toThrow(/Unknown/);
  });
});
