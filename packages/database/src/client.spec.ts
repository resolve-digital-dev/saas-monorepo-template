import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const end = vi.fn().mockResolvedValue(undefined);
// Parameters are declared so `postgres.mock.calls[0][1]` is typed as the
// options object rather than an empty tuple.
const postgres = vi.fn((_url: string, _options?: Record<string, unknown>) => ({ end }));
const drizzle = vi.fn(() => ({ marker: 'db' }));

vi.mock('postgres', () => ({ default: postgres }));
vi.mock('drizzle-orm/postgres-js', () => ({ drizzle }));

const URL = 'postgresql://user:pw@localhost:5432/db';

async function loadClient() {
  vi.resetModules();
  return import('./client.js');
}

describe('getDb', () => {
  beforeEach(() => {
    postgres.mockClear();
    drizzle.mockClear();
    end.mockClear();
    vi.stubEnv('DATABASE_URL', URL);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('opens the connection lazily, not on import', async () => {
    const { getDb } = await loadClient();

    expect(postgres).not.toHaveBeenCalled();

    getDb();

    expect(postgres).toHaveBeenCalledOnce();
  });

  it('reuses the same instance on subsequent calls', async () => {
    const { getDb } = await loadClient();

    expect(getDb()).toBe(getDb());
    expect(postgres).toHaveBeenCalledOnce();
  });

  it('passes the validated pool size through to the driver', async () => {
    vi.stubEnv('DATABASE_POOL_MAX', '25');
    const { getDb } = await loadClient();

    getDb();

    expect(postgres).toHaveBeenCalledWith(URL, expect.objectContaining({ max: 25 }));
  });

  it('omits the ssl key entirely when TLS is off', async () => {
    vi.stubEnv('DATABASE_SSL', 'false');
    const { getDb } = await loadClient();

    getDb();

    // postgres-js treats a *missing* key as "no TLS"; an explicit `undefined`
    // is a different thing, and `exactOptionalPropertyTypes` rejects it.
    expect(Object.keys(postgres.mock.calls[0]?.[1] ?? {})).not.toContain('ssl');
  });

  it('requires TLS when DATABASE_SSL is on', async () => {
    vi.stubEnv('DATABASE_SSL', 'true');
    const { getDb } = await loadClient();

    getDb();

    expect(postgres).toHaveBeenCalledWith(URL, expect.objectContaining({ ssl: 'require' }));
  });

  it('does not treat DATABASE_SSL=0 as on', async () => {
    vi.stubEnv('DATABASE_SSL', '0');
    const { getDb } = await loadClient();

    getDb();

    expect(Object.keys(postgres.mock.calls[0]?.[1] ?? {})).not.toContain('ssl');
  });
});

describe('closeDb', () => {
  beforeEach(() => {
    postgres.mockClear();
    end.mockClear();
    vi.stubEnv('DATABASE_URL', URL);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is a no-op when nothing was ever opened', async () => {
    const { closeDb } = await loadClient();

    await expect(closeDb()).resolves.toBeUndefined();
    expect(end).not.toHaveBeenCalled();
  });

  it('closes the pool and lets a later call open a fresh one', async () => {
    const { getDb, closeDb } = await loadClient();

    const first = getDb();
    await closeDb();

    expect(end).toHaveBeenCalledWith({ timeout: 5 });

    const second = getDb();

    expect(postgres).toHaveBeenCalledTimes(2);
    expect(second).not.toBe(first);
  });
});
