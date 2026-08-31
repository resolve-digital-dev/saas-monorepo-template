import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/** `1`, `true` and `yes` mean on. `Boolean('0')` is `true`, which is the bug this replaces. */
function isEnvFlagEnabled(value: string | undefined): boolean {
  if (value === undefined) return false;
  return ['1', 'true', 'yes'].includes(value.trim().toLowerCase());
}

/**
 * Imported from next.config.mjs, so an invalid environment fails the build
 * instead of surfacing at runtime.
 *
 * Two API URLs on purpose:
 *   - NEXT_PUBLIC_API_URL is inlined into the browser bundle at build time and
 *     therefore has to be the address a *browser* can reach.
 *   - API_URL is read at request time by server components. Inside Docker the
 *     browser-facing localhost:3001 is meaningless to the container, which has
 *     to call http://backend:3001/api instead.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_URL: z.url({
      protocol: /^https?$/,
      error: 'API_URL must be an absolute http(s) URL reachable from the server.',
    }),
  },
  client: {
    // `protocol` matters: a bare `z.url()` accepts "localhost:3001", because
    // that parses as a URL whose scheme is "localhost".
    NEXT_PUBLIC_API_URL: z.url({
      protocol: /^https?$/,
      error: 'NEXT_PUBLIC_API_URL must be an absolute http(s) URL the browser can reach.',
    }),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    // Falls back to the public URL so a single-host deployment only has to set
    // one variable, and the Docker build needs no validation escape hatch.
    API_URL: process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  skipValidation: isEnvFlagEnabled(process.env.SKIP_ENV_VALIDATION),
  emptyStringAsUndefined: true,
});
