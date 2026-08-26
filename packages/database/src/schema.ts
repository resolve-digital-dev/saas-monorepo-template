import { pgTable, varchar, serial, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const example = pgTable('example', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Zod schemas
export const insertExampleSchema = createInsertSchema(example);
export const selectExampleSchema = createSelectSchema(example);
