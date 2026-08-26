import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest does not unmount between tests on its own; without this every test
// after the first queries a DOM that still holds the previous render.
afterEach(() => {
  cleanup();
});
