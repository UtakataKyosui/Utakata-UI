import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@utakata-ui/react/manifest': new URL(
        './packages/react/src/manifest.ts',
        import.meta.url,
      ).pathname,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./packages/react/src/test-setup.ts'],
    include: [
      'packages/react/src/**/*.test.tsx',
      'packages/mcp/src/**/*.test.ts',
    ],
  },
});
