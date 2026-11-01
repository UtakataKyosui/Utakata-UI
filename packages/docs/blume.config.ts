import { defineConfig } from 'blume';

export default defineConfig({
  title: 'Utakata-UI',
  description: '人と AI のための React・TypeScript UI フレームワーク',
  content: { root: 'docs' },
  // Keep library resets and tokens inside the example iframe documents.
  examples: { css: 'examples.css' },
});
