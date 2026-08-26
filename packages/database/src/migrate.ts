import { resolve } from 'node:path';

import { migrate } from 'drizzle-orm/postgres-js/migrator';

import { closeDb, getDb } from './client';

/**
 * Applies the SQL files in ./drizzle. `db:push` is fine for local prototyping,
 * but anything that reaches production has to go through real migrations.
 */
async function run(): Promise<void> {
  console.warn('🚚 Applying migrations...');
  await migrate(getDb(), { migrationsFolder: resolve(__dirname, '../drizzle') });
  console.warn('✅ Migrations applied.');
}

run()
  .then(async () => {
    await closeDb();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error('❌ Migration failed:', error);
    await closeDb();
    process.exit(1);
  });
