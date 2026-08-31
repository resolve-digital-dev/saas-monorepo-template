import { randomUUID } from 'node:crypto';

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { logger } from '@resolvedigital/logger';
import type { Request } from 'express';
import { LoggerModule } from 'nestjs-pino';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { env } from './env';
import { HealthController } from './health.controller';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        logger,
        // Honour an inbound correlation id when there is one, mint one when
        // there is not. The value is echoed back in `x-request-id` (see
        // main.ts) and included in every error body.
        genReqId: (req, res) => {
          const existing = req.headers['x-request-id'];
          const id = (Array.isArray(existing) ? existing[0] : existing) ?? randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
      },
    }),
    ThrottlerModule.forRoot({
      // `ttl` is milliseconds in @nestjs/throttler v5+, the env var is seconds.
      throttlers: [{ ttl: env.RATE_LIMIT_TTL * 1000, limit: env.RATE_LIMIT_LIMIT }],
      // Infrastructure probes must never be throttled: a 429 on /api/health
      // would make an orchestrator restart a perfectly healthy container.
      skipIf: (context) =>
        context.switchToHttp().getRequest<Request>().url.startsWith('/api/health'),
    }),
    DatabaseModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
