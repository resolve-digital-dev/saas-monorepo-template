import { parseClientEnv } from './env.schema';

/**
 * Vite inlines `import.meta.env.VITE_*` at build time, so this is a cheap
 * re-check of values that were already validated in `vite.config.ts`. It exists
 * so application code reads a typed object instead of `import.meta.env`.
 */
export const env = parseClientEnv(import.meta.env as unknown as Record<string, string | undefined>);
