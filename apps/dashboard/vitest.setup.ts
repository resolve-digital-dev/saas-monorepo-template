import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// `src/env.ts` reads `import.meta.env.VITE_API_URL`, which is only populated by
// a real Vite build. Stubbing it here keeps every spec from having to.
vi.stubEnv('VITE_API_URL', 'http://localhost:3001/api');

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
