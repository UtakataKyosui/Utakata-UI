import { defineConfig } from '@playwright/test';
import { componentManifest } from './packages/react/src/metadata/manifest.js';
import {
  type QualityRule,
  qualityRules,
} from './packages/react/src/metadata/quality.js';
import {
  coverage,
  requiredStateRuleIds,
  validateCoverage,
} from './tests/browser/coverage.js';

const browserRuleIds: string[] = Object.values(
  componentManifest.components,
).flatMap((component) =>
  component.qualityRules
    .filter((rule) => String(rule.verification) === 'browser')
    .map((rule) => rule.id),
);
browserRuleIds.push(
  ...qualityRules.shared
    .filter((rule) => rule.verification === 'browser')
    .map((rule) => rule.id),
);
validateCoverage(componentManifest.components);
browserRuleIds.push('coverage.public-configurations');
browserRuleIds.push(
  ...requiredStateRuleIds.filter((id) => !browserRuleIds.includes(id)),
);
browserRuleIds.push(
  'baseline.rendered-axe',
  'baseline.keyboard-focus',
  'baseline.forced-colors',
);
const manualRules: QualityRule[] = Object.values(
  componentManifest.components,
).flatMap((component) =>
  component.qualityRules.filter((rule) => rule.verification === 'manual'),
);
manualRules.push(
  ...qualityRules.shared.filter((rule) => rule.verification === 'manual'),
);

export default defineConfig({
  testDir: './tests/browser',
  forbidOnly: true,
  retries: 0,
  // CI runs themes in independent jobs; retain file isolation and zero retries.
  ...(process.env.CI ? { workers: 2 } : {}),
  globalTimeout: process.env.CI ? 300_000 : 420_000,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    [
      './scripts/required-browser-checks.mjs',
      {
        requiredIds: browserRuleIds,
        projects: process.env.CI_BROWSER_PROJECT
          ? [process.env.CI_BROWSER_PROJECT]
          : undefined,
        manualRules,
        coverage,
      },
    ],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-light',
      use: { browserName: 'chromium', colorScheme: 'light' },
    },
    {
      name: 'chromium-dark',
      use: { browserName: 'chromium', colorScheme: 'dark' },
    },
  ],
  webServer: {
    // Serve a fixed production bundle: dev dependency optimization can reload
    // the first page after navigation, invalidating keyboard/focus evidence.
    command:
      'pnpm exec vite build --config tests/browser/vite.config.ts && pnpm exec vite preview --config tests/browser/vite.config.ts',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
