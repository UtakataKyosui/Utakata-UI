import { defineConfig } from '@playwright/test';
import base from './playwright.config.js';

// This bounded contract does not extend Chromium-only IME/forced-colors
// evidence to other engines. Every selected test, including controls, must run.
export const crossBrowserRuleIds = [
  'baseline.rendered-axe',
  'theme.rendered-contrast',
  'baseline.keyboard-focus',
  'dialog.browser-keyboard',
  'theme.target-size',
  'theme.reflow',
  'theme.text-size',
  'theme.text-spacing',
  'theme.interaction-contrast',
  'theme.reduced-motion',
];

const projects = ['firefox', 'webkit'].flatMap((browserName) =>
  (['light', 'dark'] as const).map((colorScheme) => ({
    name: `${browserName}-${colorScheme}`,
    use: { browserName: browserName as 'firefox' | 'webkit', colorScheme },
  })),
);

export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: ['**/cross-browser.spec.ts', '**/layout.spec.ts'],
  projects,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    [
      './scripts/required-browser-checks.mjs',
      {
        ...base.reporter?.[2]?.[1],
        requiredIds: crossBrowserRuleIds,
        projects: process.env.CI_BROWSER_PROJECT
          ? [process.env.CI_BROWSER_PROJECT]
          : projects.map(({ name }) => name),
        // Coverage of all public component states remains the Chromium gate.
        coverage: {},
      },
    ],
  ],
});
