import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: ['src/**/*.ts'],
      // migrate/seed are one-shot scripts whose bodies call process.exit;
      // index.ts is re-exports only.
      exclude: ['src/**/*.spec.ts', 'src/migrate.ts', 'src/seed.ts', 'src/index.ts'],
      thresholds: { lines: 70, functions: 70, branches: 70, statements: 70 },
    },
  },
});
