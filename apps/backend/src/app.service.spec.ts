import { describe, expect, it } from 'vitest';

import { AppService } from './app.service';

describe('AppService', () => {
  it('returns service metadata and no database rows', () => {
    const info = new AppService().getServiceInfo();

    expect(info).toEqual({
      name: '@resolvedigital/backend',
      status: 'ok',
      docs: '/api/docs',
    });
    expect(Object.keys(info)).not.toContain('users');
  });
});
