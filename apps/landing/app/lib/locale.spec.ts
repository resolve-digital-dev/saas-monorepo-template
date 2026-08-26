import { baseLocale, cookieName } from '@resolvedigital/i18n/runtime';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();

vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ get }),
}));

const { getRequestLocale } = await import('./locale');

describe('getRequestLocale', () => {
  beforeEach(() => {
    get.mockReset();
  });

  it('falls back to the base locale when no cookie is set', async () => {
    get.mockReturnValue(undefined);

    await expect(getRequestLocale()).resolves.toBe(baseLocale);
  });

  it('returns the locale carried by the paraglide cookie', async () => {
    get.mockImplementation((name: string) => (name === cookieName ? { value: 'ru' } : undefined));

    await expect(getRequestLocale()).resolves.toBe('ru');
  });

  it('ignores a cookie holding a locale the project does not ship', async () => {
    get.mockReturnValue({ value: 'de' });

    await expect(getRequestLocale()).resolves.toBe(baseLocale);
  });

  it('ignores a garbage cookie value instead of trusting it', async () => {
    get.mockReturnValue({ value: '../../etc/passwd' });

    await expect(getRequestLocale()).resolves.toBe(baseLocale);
  });
});
