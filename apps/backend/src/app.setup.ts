import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AllExceptionsFilter } from './common/all-exceptions.filter';

/**
 * Everything that turns a bare Nest app into *this* API.
 *
 * Shared by `main.ts` and the e2e tests so the tests exercise the real prefix,
 * versioning, validation and error handling instead of a lookalike that drifts.
 */
export function configureApp(
  app: INestApplication,
  options: { corsOrigins: string[]; swagger: boolean },
): INestApplication {
  app.use(helmet());
  app.enableCors({
    origin: options.corsOrigins,
    credentials: true,
    exposedHeaders: ['x-request-id'],
  });

  app.setGlobalPrefix('api');

  // URI versioning from day one: `/api/v1/...`. Adding v2 later is then an
  // additive change instead of a breaking one. `/api/health` opts out via
  // VERSION_NEUTRAL so probe URLs never move.
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // `enableImplicitConversion` is off deliberately: it coerces silently,
      // so `?limit=abc` becomes NaN and slips past `@IsInt()`. DTOs declare
      // `@Type(() => Number)` explicitly instead.
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  if (options.swagger) {
    const config = new DocumentBuilder()
      .setTitle('ResolveDigital API')
      .setDescription('Template API. Routes are versioned under /api/v1.')
      .setVersion('1.0')
      .build();
    SwaggerModule.setup('api/docs', app, () => SwaggerModule.createDocument(app, config));
  }

  return app;
}
