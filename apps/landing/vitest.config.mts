import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom rather than node: the locale switcher is a client component and is
    // worth a real render test, since it is the only way to reach ru.json.
    environment: 'jsdom',
    include: ['app/**/*.spec.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: ['app/**/*.{ts,tsx}'],
      // layout.tsx and page.tsx are async server components: exercising them
      // means booting Next, which belongs in an e2e run rather than here.
      exclude: ['app/**/*.spec.{ts,tsx}', 'app/layout.tsx', 'app/page.tsx'],
      thresholds: { lines: 70, functions: 70, branches: 70, statements: 70 },
    },
  },
});
