import { describe, expect, it } from 'vitest';

import { GET } from './route';

describe('GET /healthz', () => {
  it('answers 200 without touching the API', async () => {
    const response = GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: 'ok' });
  });

  it('reports process uptime', async () => {
    const body = (await GET().json()) as { uptime: number };

    expect(body.uptime).toBeGreaterThan(0);
  });
});
