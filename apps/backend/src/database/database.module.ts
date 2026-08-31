import { Global, Module, type OnApplicationShutdown } from '@nestjs/common';
import { closeDb, getDb, type Database } from '@resolvedigital/database';

export const DATABASE = Symbol('DATABASE');

/**
 * Wraps the Drizzle client in a provider so controllers and services receive
 * it through DI and can be tested with a stub, instead of reaching for a
 * module-level singleton.
 */
@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory: (): Database => getDb(),
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    await closeDb();
  }
}
