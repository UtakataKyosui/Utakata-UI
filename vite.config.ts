import { defineConfig } from 'vite-plus';

export default defineConfig({
  staged: {
    // Run once for the staged snapshot; commands must not receive file arguments.
    '*': () => 'pnpm check',
  },
});
