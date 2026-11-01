import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  forbidOnly: true,
  retries: 0,
  globalTimeout: 180_000,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['./scripts/required-browser-checks.mjs'],
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
