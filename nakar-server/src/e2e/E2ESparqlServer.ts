import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

export class E2ESparqlServer {
  private readonly _server: Server = createServer(
    (request: IncomingMessage, response: ServerResponse): void => {
      request.resume();
      response.setHeader('Content-Type', 'application/sparql-results+json');
      response.writeHead(200);
      response.end(
        JSON.stringify({
          head: { vars: ['p', 'count'] },
          results: {
            bindings: [
              {
                p: { type: 'uri', value: 'https://example.test/related' },
                count: {
                  type: 'literal',
                  datatype: 'http://www.w3.org/2001/XMLSchema#integer',
                  value: '7',
                },
              },
            ],
          },
        }),
      );
    },
  );

  public getServerUrl(): string {
    const address: string | AddressInfo | null = this._server.address();
    assert.ok(
      this._server.listening && address != null && typeof address !== 'string',
      'SPARQL server has not been started.',
    );
    return `http://127.0.0.1:${address.port.toString()}`;
  }

  public async start(): Promise<void> {
    if (this._server.listening) {
      return;
    }
    this._server.listen(0, '127.0.0.1');
    await once(this._server, 'listening');
  }

  public async stopp(): Promise<void> {
    if (!this._server.listening) {
      return;
    }
    await new Promise<void>(
      (
        resolve: (value: void | PromiseLike<void>) => void,
        reject: (reason?: unknown) => void,
      ): void => {
        this._server.close((error?: Error): void => {
          if (error != null) {
            reject(error);
          } else {
            resolve();
          }
        });
        this._server.closeAllConnections();
      },
    );
  }
}
