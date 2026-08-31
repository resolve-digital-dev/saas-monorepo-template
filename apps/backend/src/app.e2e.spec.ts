import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Database } from '@resolvedigital/database';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { DATABASE } from './database/database.module';

const dbStub = {
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
