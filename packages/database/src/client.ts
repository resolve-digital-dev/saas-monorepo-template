import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Options, type Sql } from 'postgres';

import { getDbEnv } from './env';
import * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;

let sql: Sql | undefined;
let instance: Database | undefined;

/**
 * Lazily opens the connection on first call instead of on import, so that
 * merely importing the package (during a Next build, a typecheck or a unit
 * test) does not try to reach a database.
 *
 * There is deliberately no module-level `db` convenience export. The previous
 * one was a `Proxy` that forwarded every property access to `getDb()` with the
 * proxy itself as the receiver, which breaks on any driver that reads private
 * fields off `this`. Consumers take the `Database` through DI instead - see
 * `apps/backend/src/database/database.module.ts`.
 */
export function getDb(): Database {
  if (instance) return instance;

  const { DATABASE_URL, DATABASE_POOL_MAX, DATABASE_SSL } = getDbEnv();

  // Built conditionally: `exactOptionalPropertyTypes` rejects an explicit
  // `ssl: undefined`, and postgres-js treats a missing key as "no TLS".
  const options: Options<Record<string, never>> = {
    max: DATABASE_POOL_MAX,
    idle_timeout: 20,
    connect_timeout: 10,
    // postgres-js prints every NOTICE to stdout by default. The migrator's
    // `CREATE ... IF NOT EXISTS` statements emit two on every re-run, which
    // buries the actual result under a wall of noise that looks like an error.
    // Everything else still surfaces.
    onnotice: (notice) => {
      const routineNoise = notice.code === '42P06' || notice.code === '42P07';
      if (!routineNoise) console.warn(`[postgres] ${notice.severity}: ${notice.message}`);
    },
  };

  if (DATABASE_SSL) {
    options.ssl = 'require';
  }

  sql = postgres(DATABASE_URL, options);

  instance = drizzle(sql, { schema });
  return instance;
}

/** Closes the pool. Wired into the Nest shutdown hooks. */
export async function closeDb(): Promise<void> {
  if (sql) await sql.end({ timeout: 5 });
  sql = undefined;
  instance = undefined;
}
