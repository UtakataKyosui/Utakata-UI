import { defineConfig } from '@playwright/test';
import { componentManifest } from './packages/react/src/metadata/manifest.js';

const browserRuleIds = Object.values(componentManifest.components).flatMap(
  (component) =>
    component.qualityRules
      .filter((rule) => String(rule.verification) === 'browser')
      .map((rule) => rule.id),
);

export default defineConfig({
  testDir: './tests/browser',
  forbidOnly: true,
  retries: 0,
  globalTimeout: 180_000,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['./scripts/required-browser-checks.mjs', { requiredIds: browserRuleIds }],
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
    command: 'pnpm exec vite --config tests/browser/vite.config.ts',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
