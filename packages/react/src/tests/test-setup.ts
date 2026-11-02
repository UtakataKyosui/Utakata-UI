import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest globals are disabled, so Testing Library cannot register auto-cleanup.
// Unmount before jsdom teardown so refs release observers and diagnostic timers.
afterEach(cleanup);
