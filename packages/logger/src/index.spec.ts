import { describe, expect, it } from 'vitest';

import { LOG_LEVELS, isLogLevel, resolveLogLevel } from './index';

describe('resolveLogLevel', () => {
  it('defaults to debug outside production', () => {
    expect(resolveLogLevel(undefined, false)).toBe('debug');
  });

  it('defaults to info in production', () => {
    expect(resolveLogLevel(undefined, true)).toBe('info');
  });

  it('treats an empty value as absent', () => {
    expect(resolveLogLevel('', true)).toBe('info');
  });

  it.each(LOG_LEVELS)('accepts %s', (level) => {
    expect(resolveLogLevel(level, false)).toBe(level);
  });

  it('rejects an unknown level with an actionable message', () => {
    expect(() => resolveLogLevel('verbose', false)).toThrow(/Invalid LOG_LEVEL "verbose"/);
    expect(() => resolveLogLevel('verbose', false)).toThrow(/fatal, error, warn/);
  });
});

describe('isLogLevel', () => {
  it('narrows known levels', () => {
    expect(isLogLevel('trace')).toBe(true);
    expect(isLogLevel('loud')).toBe(false);
    expect(isLogLevel(undefined)).toBe(false);
  });
});
