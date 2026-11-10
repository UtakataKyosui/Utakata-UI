import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  build: {
    outDir: '../../test-results/browser-fixture',
    emptyOutDir: true,
    // This fixture is a client-only createRoot app, not an RSC library bundle.
    // Public package directives are verified separately against the packed JS.
    rolldownOptions: {
      onLog(level, warning, defaultHandler) {
        if (
          level === 'warn' &&
          warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
          /["']use client["']/.test(warning.message)
        )
          return;
        defaultHandler(level, warning);
      },
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
});
