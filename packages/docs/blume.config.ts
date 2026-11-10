import { defineConfig } from 'blume';
import { markdownComponents } from './site/markdown.js';

export default defineConfig({
  title: 'Utakata-UI',
  description: '人と AI のための React・TypeScript UI フレームワーク',
  content: { root: 'docs' },
  i18n: {
    defaultLocale: 'ja',
    locales: [
      { code: 'ja', label: '日本語' },
      { code: 'en', label: 'English' },
    ],
  },
  redirects: [{ from: '/preview', to: '/components/preview' }],
  agents: { markdownComponents },
  // Keep library resets and tokens inside the example iframe documents.
  examples: { css: 'examples.css' },
});
