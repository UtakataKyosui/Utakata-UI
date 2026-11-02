import { defineConfig } from 'vite';

export default defineConfig({
  root: new URL('.', import.meta.url).pathname,
  server: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
    // Transform the fixture entry at startup so dependencies are optimized
    // before the first test, not by a page reload in the middle of one.
    warmup: { clientFiles: ['./main.tsx'] },
  },
});
