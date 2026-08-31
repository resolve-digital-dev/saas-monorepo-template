import { Injectable } from '@nestjs/common';

export interface ServiceInfo {
  name: string;
  status: 'ok';
  docs: string;
}

@Injectable()
export class AppService {
  /**
   * Service metadata only.
   *
   * This handler used to return `select().from(users)` - every row, every
   * column, unauthenticated and unpaginated. Real data now lives behind
   * `GET /api/v1/users`, which returns a response DTO.
   */
  getServiceInfo(): ServiceInfo {
    return {
      name: '@resolvedigital/backend',
      status: 'ok',
      docs: '/api/docs',
    };
  }
}
