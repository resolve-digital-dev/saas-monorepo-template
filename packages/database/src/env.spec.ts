import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadEnv() {
  vi.resetModules();
  return import('./env.js');
}

describe('getDbEnv', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('throws instead of falling back to a hardcoded localhost connection', async () => {
    vi.stubEnv('DATABASE_URL', '');
    const { getDbEnv } = await loadEnv();
    expect(() => getDbEnv()).toThrow(/DATABASE_URL/);
  });

  it('rejects a malformed connection string', async () => {
    vi.stubEnv('DATABASE_URL', 'not-a-url');
    const { getDbEnv } = await loadEnv();
    expect(() => getDbEnv()).toThrow(/valid postgres connection string/);
  });

  it('accepts a valid connection string', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://user:pw@localhost:5432/db');
    const { getDbEnv } = await loadEnv();
    expect(getDbEnv().DATABASE_URL).toBe('postgresql://user:pw@localhost:5432/db');
  });

  it('defaults the pool size and TLS flag when they are absent', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://user:pw@localhost:5432/db');
    vi.stubEnv('DATABASE_POOL_MAX', undefined);
    vi.stubEnv('DATABASE_SSL', undefined);
    const { getDbEnv } = await loadEnv();
    expect(getDbEnv()).toMatchObject({ DATABASE_POOL_MAX: 10, DATABASE_SSL: false });
  });

  it('rejects a non-numeric pool size instead of passing NaN to the driver', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://user:pw@localhost:5432/db');
    vi.stubEnv('DATABASE_POOL_MAX', 'abc');
    const { getDbEnv } = await loadEnv();
    expect(() => getDbEnv()).toThrow(/DATABASE_POOL_MAX/);
  });

  it('memoises the parsed environment and can be reset', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://user:pw@localhost:5432/db');
    const { getDbEnv, resetDbEnvCache } = await loadEnv();
    expect(getDbEnv()).toBe(getDbEnv());
    const first = getDbEnv();
    resetDbEnvCache();
    expect(getDbEnv()).not.toBe(first);
  });
});

describe('isEnvFlagEnabled', () => {
  it.each([
    ['1', true],
    ['true', true],
    ['TRUE', true],
    ['yes', true],
    [' true ', true],
    ['0', false],
    ['false', false],
    ['', false],
    [undefined, false],
  ])('treats %o as %s', async (value, expected) => {
    const { isEnvFlagEnabled } = await loadEnv();
    expect(isEnvFlagEnabled(value)).toBe(expected);
  });
});

describe('SKIP_ENV_VALIDATION', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('bypasses validation when the flag is genuinely on', async () => {
    vi.stubEnv('DATABASE_URL', '');
    vi.stubEnv('SKIP_ENV_VALIDATION', '1');
    const { getDbEnv } = await loadEnv();
    expect(getDbEnv().DATABASE_URL).toBe('');
  });

  it('does NOT bypass validation for "0" - the trap Boolean() fell into', async () => {
    vi.stubEnv('DATABASE_URL', '');
    vi.stubEnv('SKIP_ENV_VALIDATION', '0');
    const { getDbEnv } = await loadEnv();
    expect(() => getDbEnv()).toThrow(/DATABASE_URL/);
  });

  it('does NOT bypass validation for "false"', async () => {
    vi.stubEnv('DATABASE_URL', '');
    vi.stubEnv('SKIP_ENV_VALIDATION', 'false');
    const { getDbEnv } = await loadEnv();
    expect(() => getDbEnv()).toThrow(/DATABASE_URL/);
  });
});
