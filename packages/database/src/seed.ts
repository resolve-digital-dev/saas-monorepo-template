import { closeDb } from './client';

async function seed(): Promise<void> {
  console.warn('🌱 Seeding database...');

  // const db = getDb();
  // Add seed logic here

  console.warn(`✅ Seeding complete.`);
}

seed()
  .then(async () => {
    await closeDb();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error('❌ Error seeding database:', error);
    await closeDb();
    process.exit(1);
  });
