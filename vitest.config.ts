import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@utakata-ui/react/manifest': new URL(
        './packages/react/src/metadata/manifest.ts',
        import.meta.url,
      ).pathname,
    },
  },
  test: {
    // Bound CPU/memory pressure on GitHub's two-core runners. Keep test
    // timeouts unchanged so slow or hung checks still fail.
    ...(process.env.CI ? { maxWorkers: 2 } : {}),
    environment: 'jsdom',
    setupFiles: ['./packages/react/src/tests/test-setup.ts'],
    include: [
      'packages/cli/src/**/*.test.ts',
      'packages/react/src/**/*.test.tsx',
    ],
  },
});
