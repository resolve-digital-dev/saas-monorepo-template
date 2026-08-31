import { defineConfig } from 'drizzle-kit';

import { getDbEnv } from './src/env';

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDbEnv().DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
