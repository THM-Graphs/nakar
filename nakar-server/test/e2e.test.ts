import request from 'supertest';
import { expect, describe, it } from '@jest/globals';
import {
  GetDatabaseStructureDtoSchema,
  GetInitialGraphDtoSchema,
  GetScenariosDtoSchema,
} from '../src/lib/shared/dto';

const server = request('http://localhost:1337');
const scenarioId = 'w4b8ncvj86v4ctariple6y67';
const databaseId = 'a21ce7877ulatqwuadb3jyff';

describe('GET /api/frontend/initial-graph', () => {
  it('400 (no query parameter)', async () => {
    const response = await server.get('/api/frontend/initial-graph');
    expect(response.status).toStrictEqual(400);
    expect(JSON.stringify(response.body)).toEqual(
      expect.stringContaining('scenarioId'),
    );
  });

  it('404 (scenario not found)', async () => {
    const response = await server.get(
      '/api/frontend/initial-graph?scenarioId=notfound',
    );
    expect(response.status).toStrictEqual(404);
    expect(JSON.stringify(response.body)).toEqual(
      expect.stringContaining('Scenario not found'),
    );
  });

  it('200', async () => {
    const response = await server.get(
      `/api/frontend/initial-graph?scenarioId=${scenarioId}`,
    );
    expect(response.status).toStrictEqual(200);
    GetInitialGraphDtoSchema.parse(response.body);
  });
});

describe('GET /api/frontend/scenarios', () => {
  it('200', async () => {
    const response = await server.get(`/api/frontend/scenarios`);
    expect(response.status).toStrictEqual(200);
    GetScenariosDtoSchema.parse(response.body);
  });
});

describe('GET /api/frontend/database-structure', () => {
  it('404 (database not found)', async () => {
    const response = await server.get(
      `/api/frontend/database-structure?databaseId=notfound`,
    );
    expect(response.status).toStrictEqual(404);
    expect(JSON.stringify(response.body)).toEqual(
      expect.stringContaining('Database not found'),
    );
  });

  it('400 (no query parameter)', async () => {
    const response = await server.get(`/api/frontend/database-structure`);
    expect(response.status).toStrictEqual(400);
    expect(JSON.stringify(response.body)).toEqual(
      expect.stringContaining('databaseId'),
    );
  });

  it('200', async () => {
    const response = await server.get(
      `/api/frontend/database-structure?databaseId=${databaseId}`,
    );
    expect(response.status).toStrictEqual(200);
    GetDatabaseStructureDtoSchema.parse(response.body);
  });
});
