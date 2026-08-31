import { z } from 'zod';

/**
 * Shared by the browser bundle (`src/env.ts`) and the build (`vite.config.ts`).
 *
 * Keeping the schema in its own module is what lets the build fail on a bad
 * value instead of shipping a bundle that throws in the user's browser.
 */
export const clientEnvSchema = z.object({
  // `protocol` matters: a bare `z.url()` happily accepts "localhost:3001",
  // because that parses as a URL whose scheme is "localhost".
  VITE_API_URL: z.url({
    protocol: /^https?$/,
    error: 'VITE_API_URL must be an absolute http(s) URL, e.g. http://localhost:3001/api.',
  }),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

/** `1`, `true` and `yes` mean on. `0` and `false` do not - see the backend for why. */
export function isEnvFlagEnabled(value: string | undefined): boolean {
  if (value === undefined) return false;
  return ['1', 'true', 'yes'].includes(value.trim().toLowerCase());
}

export function parseClientEnv(
  source: Record<string, string | boolean | undefined>,
  skip = false,
): ClientEnv {
  if (skip) {
    return { VITE_API_URL: String(source.VITE_API_URL ?? '') };
  }

  const parsed = clientEnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Invalid dashboard environment:\n${issues}\n  Copy .env.example to .env at the repo root.`,
    );
  }
  return parsed.data;
}
