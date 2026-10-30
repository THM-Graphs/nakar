import { Injectable } from '@nestjs/common';
import type { AddressInfo } from 'node:net';

@Injectable()
export class StrapiService {
  public get strapiUrl(): string {
    return `http://localhost:${this.getStrapiPort().toString()}`;
  }

  public getStrapiPort(): number {
    const address: AddressInfo | string | null =
      strapi.server.httpServer.address();
    if (address == null || typeof address === 'string') {
      throw new Error('Strapi HTTP server is not listening on a TCP port.');
    }
    return address.port;
  }
}
