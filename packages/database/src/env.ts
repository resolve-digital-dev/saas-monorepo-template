import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

/**
 * Walks up from the current working directory until it finds the monorepo root
 * (the directory holding pnpm-workspace.yaml) and loads the single `.env`
 * living there.
 *
 * Nothing used to load `.env` at all, so every app booted with an empty
 * `process.env` and died on env validation.
 */
export function loadRootEnv(): void {
  let dir = process.cwd();

  for (let i = 0; i < 10; i += 1) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) {
      loadDotenv({ path: resolve(dir, '.env'), quiet: true });
      return;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
}

loadRootEnv();

/**
 * Only `1`, `true` and `yes` count as "on".
 *
 * `Boolean(process.env.X)` is the trap this replaces: it turns `X=0` and
 * `X=false` into `true`, which silently disables validation for anyone who
 * writes the flag out the obvious way.
 */
export function isEnvFlagEnabled(value: string | undefined): boolean {
  if (value === undefined) return false;
  return ['1', 'true', 'yes'].includes(value.trim().toLowerCase());
}

const envSchema = z.object({
  // `z.url()` rather than the deprecated `z.string().url()`, and pinned to the
  // postgres schemes: a bare `z.url()` accepts "localhost:5432" and even
  // "http://..." because both parse as URLs.
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    error: (issue) =>
      issue.input === undefined || issue.input === ''
        ? 'DATABASE_URL is required. Copy .env.example to .env at the repo root.'
        : 'DATABASE_URL must be a valid postgres connection string',
  }),
  /**
   * Validated here rather than read straight out of `process.env` at the call
   * site: `Number('abc')` is `NaN`, and postgres-js accepts `max: NaN` without
   * complaint, producing a pool that never hands out a connection.
   */
  DATABASE_POOL_MAX: z.coerce.number().int().positive().max(1000).default(10),
  DATABASE_SSL: z
    .string()
    .default('false')
    .transform((value) => isEnvFlagEnabled(value)),
});

export type DbEnv = z.infer<typeof envSchema>;

let cached: DbEnv | undefined;

export function getDbEnv(): DbEnv {
  if (cached) return cached;

  // Escape hatch for builds and lint jobs that import this package but never
  // open a connection (Docker image builds, CI typecheck). Anything that does
  // reach the database still fails, just later and with a postgres error.
  if (isEnvFlagEnabled(process.env.SKIP_ENV_VALIDATION)) {
    cached = {
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      DATABASE_POOL_MAX: Number(process.env.DATABASE_POOL_MAX) || 10,
      DATABASE_SSL: isEnvFlagEnabled(process.env.DATABASE_SSL),
    };
    return cached;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid database environment:\n${issues}`);
  }

  cached = parsed.data;
  return cached;
}

/** Test seam: drops the memoised value so a new `process.env` is picked up. */
export function resetDbEnvCache(): void {
  cached = undefined;
}
