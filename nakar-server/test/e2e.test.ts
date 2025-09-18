import request from 'supertest';
import { expect, describe, it } from '@jest/globals';

const server = request('http://localhost:1337');
const scenarioId = 'so8ujqw4jwd21g3sqphb05vw';
const databaseId = 'a21ce7877ulatqwuadb3jyff';

describe('GET /api/frontend/initial-graph', () => {
  it('400 (no query parameter)', async () => {
    const response = await server.get('/api/frontend/initial-graph');
    expect(response.status).toStrictEqual(400);
    expect(response.body).toStrictEqual({
      message: 'Query parameter scenarioId not provided.',
      name: 'BadRequestError',
      status: 400,
    });
  });

  it('404 (scenario not found)', async () => {
    const response = await server.get(
      '/api/frontend/initial-graph?scenarioId=notfound',
    );
    expect(response.status).toStrictEqual(404);
    expect(response.body).toStrictEqual({
      status: 404,
      message: 'Document with id notfound not found.',
      name: 'NotFoundError',
    });
  });

  it('200', async () => {
    const response = await server.get(
      `/api/frontend/initial-graph?scenarioId=${scenarioId}`,
    );
    expect(response.status).toStrictEqual(200);
  });
});

describe('GET /api/frontend/scenarios', () => {
  it('200', async () => {
    const response = await server.get(`/api/frontend/scenarios`);
    expect(response.status).toStrictEqual(200);
  });
});

describe('GET /api/frontend/database-structure', () => {
  it('404 (database not found)', async () => {
    const response = await server.get(
      `/api/frontend/database-structure?databaseId=notfound`,
    );
    expect(response.status).toStrictEqual(404);
    expect(response.body).toStrictEqual({
      status: 404,
      message: 'Document with id notfound not found.',
      name: 'NotFoundError',
    });
  });

  it('400 (no query parameter)', async () => {
    const response = await server.get(`/api/frontend/database-structure`);
    expect(response.status).toStrictEqual(400);
    expect(response.body).toStrictEqual({
      message: 'Query parameter databaseId not provided.',
      name: 'BadRequestError',
      status: 400,
    });
  });

  it('200', async () => {
    const response = await server.get(
      `/api/frontend/database-structure?databaseId=${databaseId}`,
    );
    expect(response.status).toStrictEqual(200);
  });
});
