import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

export class E2ESparqlServer {
  private readonly _server: Server = createServer(
    (request: IncomingMessage, response: ServerResponse): void => {
      request.setEncoding('utf8');
      let body: string = '';
      request.on('data', (chunk: string): void => {
        body += chunk;
      });
      request.on('end', (): void => {
        this._respond(request, response, body);
      });
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
  private _respond(
    request: IncomingMessage,
    response: ServerResponse,
    body: string,
  ): void {
    const url: URL = new URL(request.url ?? '/', 'http://127.0.0.1');
    if (url.pathname.startsWith('/unavailable')) {
      response.writeHead(503);
      response.end('Service Unavailable');
      return;
    }
    const query: string =
      url.searchParams.get('query') ??
      new URLSearchParams(body).get('query') ??
      body;
    if (
      (url.pathname.startsWith('/graph/') ||
        url.pathname.startsWith('/empty/')) &&
      query.includes('CONSTRUCT')
    ) {
      response.setHeader('Content-Type', 'text/turtle');
      response.writeHead(200);
      response.end(
        url.pathname.startsWith('/empty/')
          ? ''
          : '<https://example.test/alice> <https://example.test/related> <https://example.test/bob> .',
      );
      return;
    }
    response.setHeader('Content-Type', 'application/sparql-results+json');
    response.writeHead(200);
    if (url.pathname.startsWith('/graph/') && query.includes('?NamedNode1')) {
      response.end(
        JSON.stringify({
          head: { vars: ['NamedNode', 'BlankNode', 'Literal'] },
          results: {
            bindings: [
              {
                ['NamedNode']: {
                  type: 'literal',
                  datatype: 'http://www.w3.org/2001/XMLSchema#integer',
                  value: '2',
                },
                ['BlankNode']: {
                  type: 'literal',
                  datatype: 'http://www.w3.org/2001/XMLSchema#integer',
                  value: '0',
                },
                ['Literal']: {
                  type: 'literal',
                  datatype: 'http://www.w3.org/2001/XMLSchema#integer',
                  value: '0',
                },
              },
            ],
          },
        }),
      );
      return;
    }
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
  }
}
