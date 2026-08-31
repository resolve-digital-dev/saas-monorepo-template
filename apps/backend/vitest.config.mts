import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Nest's DI reads `design:paramtypes`, which is emitted by
  // `emitDecoratorMetadata`. Vitest transforms with esbuild, which cannot emit
  // it - without this plugin every `Test.createTestingModule` test fails with
  // "Nest can't resolve dependencies".
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    // The app boots for the e2e specs, so env validation has to be satisfied
    // without a real database, and the pretty-print transport has to stay off.
    env: {
      NODE_ENV: 'test',
      SKIP_ENV_VALIDATION: '1',
      LOG_LEVEL: 'silent',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/**/*.spec.ts', 'src/**/dto/**'],
      thresholds: { lines: 70, functions: 70, branches: 50, statements: 70 },
    },
  },
});
