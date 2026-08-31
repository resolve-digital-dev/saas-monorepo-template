import { describe, expect, it } from 'vitest';

import { isEnvFlagEnabled, parseClientEnv } from './env.schema';

describe('parseClientEnv', () => {
  it('accepts an absolute API url', () => {
    expect(parseClientEnv({ VITE_API_URL: 'http://localhost:3001/api' })).toEqual({
      VITE_API_URL: 'http://localhost:3001/api',
    });
  });

  it.each([undefined, '', '/api', 'localhost:3001'])('rejects %o', (value) => {
    expect(() => parseClientEnv({ VITE_API_URL: value })).toThrow(/VITE_API_URL/);
  });

  it('can be bypassed explicitly, which is what the build arg does', () => {
    expect(parseClientEnv({ VITE_API_URL: undefined }, true)).toEqual({ VITE_API_URL: '' });
  });
});

describe('isEnvFlagEnabled', () => {
  it.each([
    ['1', true],
    ['true', true],
    ['YES', true],
    ['0', false],
    ['false', false],
    [undefined, false],
  ])('treats %o as %s', (value, expected) => {
    expect(isEnvFlagEnabled(value)).toBe(expected);
  });
});
