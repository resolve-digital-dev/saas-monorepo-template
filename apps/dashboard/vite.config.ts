import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

import { isEnvFlagEnabled, parseClientEnv } from './src/env.schema';

const here = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(here, '../..');

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // The monorepo keeps a single .env at the root; without `envDir` Vite would
  // only look inside apps/dashboard and every VITE_* var would be undefined.
  const loaded = loadEnv(mode, rootDir, '');

  // Fail the build, not the browser. The dashboard used to validate nothing at
  // all while the README claimed every consumer validated what it needed.
  parseClientEnv(loaded, isEnvFlagEnabled(loaded.SKIP_ENV_VALIDATION));

  return {
    plugins: [react()],
    // Mirrors the `@/*` path mapping in tsconfig.json. Declared natively instead
    // of via vite-tsconfig-paths, whose tsconfck dependency pins typescript@^5.
    resolve: {
      alias: {
        '@': resolve(here, 'src'),
      },
    },
    envDir: rootDir,
    build: {
      outDir: 'dist',
      // Off deliberately: the production image is served by nginx straight out
      // of `dist`, so a `.map` here is the whole unminified source, published.
      // Flip it on (or use 'hidden') only when you have somewhere private to
      // upload the maps to.
      sourcemap: false,
    },
    server: {
      port: 5173,
      strictPort: true,
    },
  };
});
