import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { env } from './env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  configureApp(app, { corsOrigins: env.CORS_ORIGINS, swagger: env.SWAGGER_ENABLED });

  app.useLogger(app.get(Logger));

  // Lets Nest run OnModuleDestroy hooks (and close the DB pool) on SIGTERM.
  app.enableShutdownHooks();

  await app.listen(env.PORT, '0.0.0.0');
}

void bootstrap();
