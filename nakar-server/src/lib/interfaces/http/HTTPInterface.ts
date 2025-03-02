import http from 'http';

export class HTTPInterface {
  public getServerInstance(): http.Server {
    return strapi.server.httpServer;
  }
}
