import { defineConfig } from 'blume';
import { vercel } from 'blume/deploy';
import { memory } from 'blume/ratelimit';
import { markdownComponents } from './site/markdown.js';

export default defineConfig({
  title: 'Utakata-UI',
  description: '人と AI のための React・TypeScript UI フレームワーク',
  content: { root: 'docs' },
  deployment: vercel(),
  // Per reader and route, per server instance on Vercel.
  rateLimit: memory({ requests: 30, window: 600 }),
  i18n: {
    defaultLocale: 'ja',
    locales: [
      { code: 'ja', label: '日本語' },
      { code: 'en', label: 'English' },
    ],
  },
  redirects: [{ from: '/preview', to: '/components/preview' }],
  agents: {
    markdownComponents,
    // /mcp is the existing guide; keep the HTTP endpoint separate.
    mcp: { enabled: true, route: '/api/mcp' },
  },
  // Keep library resets and tokens inside the example iframe documents.
  examples: { css: 'examples.css' },
});
