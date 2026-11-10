import { defineConfig } from '@playwright/test';
import base from './playwright.config.js';

export default defineConfig({
  ...base,
  testDir: './tests/screen-reader',
  testIgnore: [],
  workers: 1,
  fullyParallel: false,
  timeout: 90_000,
  globalTimeout: 300_000,
  projects: [
    {
      name: process.platform === 'win32' ? 'nvda-firefox' : 'voiceover-webkit',
      use: {
        browserName: process.platform === 'win32' ? 'firefox' : 'webkit',
        headless: false,
        colorScheme: 'light',
        locale: 'en-US',
      },
    },
  ],
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    [
      './scripts/required-browser-checks.mjs',
      {
        ...base.reporter?.[2]?.[1],
        requiredIds: ['assistive.control-name', 'assistive.dialog-output'],
        coverage: {},
        projects: [
          process.platform === 'win32' ? 'nvda-firefox' : 'voiceover-webkit',
        ],
      },
    ],
  ],
});
