import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { config as loadDotenv } from 'dotenv';
import createJiti from 'jiti';

const here = dirname(fileURLToPath(import.meta.url));

// The monorepo keeps a single .env at the root; Next only looks inside the app
// directory, so load the root file before anything reads process.env.
loadDotenv({ path: resolve(here, '../../.env'), quiet: true });

// Validate the environment at build time (env.ts is TypeScript, hence jiti).
createJiti(fileURLToPath(import.meta.url))('./env');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages shipped as raw TypeScript have to be transpiled here.
  transpilePackages: ['@resolvedigital/ui', '@resolvedigital/i18n'],
  // `standalone` traces a minimal server bundle for the Docker image, but it
  // materialises the closure with symlinks, which needs Developer Mode (or an
  // elevated shell) on Windows. Enabled explicitly in the Dockerfile so a plain
  // `pnpm build` works on every developer machine.
  output: process.env.NEXT_OUTPUT_STANDALONE === 'true' ? 'standalone' : undefined,
  poweredByHeader: false,
};

export default nextConfig;
