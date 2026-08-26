import { Logger, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Database } from '@resolvedigital/database';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { DATABASE } from './database/database.module';

const rows = [{ id: 1, name: 'Ada', createdAt: new Date('2024-01-01T00:00:00.000Z') }];

/**
 * Minimal drizzle stand-in. `UsersService` issues two selects: the row query
 * (chained `.from().orderBy().limit().offset()`) and a `count()` query, which
 * is the one asking for a `value` column.
 */
const dbStub = {
  select: vi.fn((columns?: Record<string, unknown>) =>
    columns && 'value' in columns
      ? { from: vi.fn().mockResolvedValue([{ value: rows.length }]) }
      : {
          from: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockResolvedValue(rows),
        },
  ),
  execute: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
} as unknown as Database;

describe('API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DATABASE)
      .useValue(dbStub)
      .compile();

    app = configureApp(moduleRef.createNestApplication(), {
      corsOrigins: ['http://localhost:3000'],
      swagger: false,
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves metadata at the versioned root and leaks no rows', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1').expect(200);

    expect(res.body).toEqual({ name: '@resolvedigital/backend', status: 'ok', docs: '/api/docs' });
    expect(JSON.stringify(res.body)).not.toContain('@example.com');
  });

  it('keeps the health probes version-neutral at /api/health', async () => {
    await request(app.getHttpServer()).get('/api/health').expect(200);
    await request(app.getHttpServer()).get('/api/health/ready').expect(200);
  });

  it('never exposes an email address through the users endpoint', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/users').expect(200);

    expect(res.body).toMatchObject({ total: 1, limit: 20, offset: 0 });
    expect(Object.keys(res.body.items[0] as object)).toEqual(['id', 'name', 'createdAt']);
  });

  it.each([
    ['?limit=abc', 'non-numeric limit'],
    ['?limit=1000', 'limit above the cap'],
    ['?limit=0', 'limit below the floor'],
    ['?offset=-1', 'negative offset'],
    ['?unexpected=1', 'unknown query parameter'],
  ])('rejects %s (%s) with 400', async (query) => {
    await request(app.getHttpServer()).get(`/api/v1/users${query}`).expect(400);
  });

  it('answers unknown routes through the exception filter', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/nope').expect(404);

    expect(res.body).toMatchObject({ statusCode: 404, path: '/api/v1/nope' });
    expect(res.body.timestamp).toEqual(expect.any(String));
    expect(res.headers['x-request-id']).toEqual(expect.any(String));
  });

  it('sets the security headers helmet is there for', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1').expect(200);

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('error masking', () => {
  let app: INestApplication;
  let logged: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    // Swallow the (expected) stack trace so the suite output stays readable,
    // while still asserting below that the error really was logged.
    logged = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const exploding = {
      select: vi.fn().mockImplementation(() => {
        throw new Error('connect ECONNREFUSED postgresql://user:hunter2@db:5432/app');
      }),
    } as unknown as Database;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DATABASE)
      .useValue(exploding)
      .compile();

    app = configureApp(moduleRef.createNestApplication(), {
      corsOrigins: [],
      swagger: false,
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    logged.mockRestore();
  });

  it('does not put the driver error - or the credentials in it - in the response', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/users').expect(500);

    expect(res.body.message).toBe('Internal server error');
    expect(JSON.stringify(res.body)).not.toContain('hunter2');
  });

  it('logs the real cause server-side instead of swallowing it', () => {
    expect(logged).toHaveBeenCalled();
    expect(logged.mock.calls.flat().join(' ')).toContain('ECONNREFUSED');
  });
});
