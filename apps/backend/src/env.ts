import { isEnvFlagEnabled, loadRootEnv } from '@resolvedigital/database';
import { z } from 'zod';

// The monorepo keeps a single `.env` at the root. Called explicitly rather than
// relying on it happening as a side effect of some other import.
loadRootEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(3001),
  /**
   * `LOG_LEVEL` is intentionally absent: `@resolvedigital/logger` owns it and
   * validates it there. Declaring it here as well is what made the previous
   * validation decorative - two schemas, neither of which the logger consulted.
   */
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    error: 'DATABASE_URL must be a postgres:// connection string. See .env.example.',
  }),
  /** Comma-separated allowlist. Empty means "no browser origin allowed". */
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  /** Rate limiting: `RATE_LIMIT_LIMIT` requests per `RATE_LIMIT_TTL` seconds, per client. */
  RATE_LIMIT_TTL: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_LIMIT: z.coerce.number().int().positive().default(120),
  /** OpenAPI UI. Defaults to on everywhere except production. */
  SWAGGER_ENABLED: z.string().optional(),
});

type RawEnv = z.infer<typeof envSchema>;

export type Env = Omit<RawEnv, 'SWAGGER_ENABLED'> & { SWAGGER_ENABLED: boolean };

function resolveSwagger(raw: string | undefined, nodeEnv: RawEnv['NODE_ENV']): boolean {
  if (raw === undefined || raw === '') return nodeEnv !== 'production';
  return isEnvFlagEnabled(raw);
}

function parseEnv(): Env {
  // Escape hatch for Docker image builds and CI jobs that boot nothing.
  if (isEnvFlagEnabled(process.env.SKIP_ENV_VALIDATION)) {
    const nodeEnv = (process.env.NODE_ENV ?? 'development') as RawEnv['NODE_ENV'];
    return {
      NODE_ENV: nodeEnv,
      PORT: Number(process.env.PORT) || 3001,
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      CORS_ORIGINS: [],
      RATE_LIMIT_TTL: Number(process.env.RATE_LIMIT_TTL) || 60,
      RATE_LIMIT_LIMIT: Number(process.env.RATE_LIMIT_LIMIT) || 120,
      SWAGGER_ENABLED: resolveSwagger(process.env.SWAGGER_ENABLED, nodeEnv),
    };
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.error(`❌ Invalid environment variables:\n${issues}`);
    console.error('   Copy .env.example to .env at the repo root and fill it in.');
    process.exit(1);
  }

  const { SWAGGER_ENABLED, ...rest } = parsed.data;

  return { ...rest, SWAGGER_ENABLED: resolveSwagger(SWAGGER_ENABLED, rest.NODE_ENV) };
}

export const env: Env = parseEnv();
