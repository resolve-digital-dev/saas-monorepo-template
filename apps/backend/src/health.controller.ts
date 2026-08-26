import { Controller, Get, Inject, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Database } from '@resolvedigital/database';
import { sql } from 'drizzle-orm';

import { DATABASE } from './database/database.module';

/**
 * Version-neutral on purpose: these are infrastructure probes wired into
 * Docker/Kubernetes, and their URL must not move when the API is versioned.
 * They stay at `/api/health` while everything else lives under `/api/v1`.
 */
@ApiExcludeController()
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /** Liveness: the process is up. Used by the container HEALTHCHECK. */
  @Get()
  live(): { status: string; uptime: number } {
    return { status: 'ok', uptime: process.uptime() };
  }

  /** Readiness: the process is up AND the database answers. */
  @Get('ready')
  async ready(): Promise<{ status: string; database: string }> {
    await this.db.execute(sql`select 1`);
    return { status: 'ok', database: 'up' };
  }
}
