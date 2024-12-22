import request from 'supertest';
import { expect, describe, it } from '@jest/globals';
import { GetInitialGraphDto } from '../src/api/frontend/controllers/dto/GetInitialGraphDto';
import { GetScenariosDto } from '../src/api/frontend/controllers/dto/GetScenariosDto';

const server = request('http://localhost:1337');
const scenarioId = 'w4b8ncvj86v4ctariple6y67';

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
    expect(response.body).toEqual({
      graph: {
        nodes: expect.arrayContaining([
          {
            id: expect.any(String),
            displayTitle: expect.any(String),
            type: expect.any(String),
            properties: expect.any(Array),
          },
        ]),
        edges: expect.arrayContaining([
          {
            id: expect.any(String),
            startNodeId: expect.any(String),
            endNodeId: expect.any(String),
            type: expect.any(String),
            properties: expect.any(Array),
          },
        ]),
      },
    });
    (response.body as GetInitialGraphDto).graph.nodes.forEach((node) => {
      node.properties.map((property) => {
        expect(property).toEqual({
          slug: expect.any(String),
          value: expect.anything(),
        });
      });
    });
    (response.body as GetInitialGraphDto).graph.edges.forEach((edge) => {
      edge.properties.map((property) => {
        expect(property).toEqual({
          slug: expect.any(String),
          value: expect.anything(),
        });
      });
    });
  });
});

describe('GET /api/frontend/scenarios', () => {
  it('200', async () => {
    const response = await server.get(`/api/frontend/scenarios`);
    expect(response.status).toStrictEqual(200);

    expect(response.body).toEqual({
      databases: expect.any(Array),
    });
    (response.body as GetScenariosDto).databases.forEach((database) => {
      expect(database).toEqual({
        id: expect.any(String),
        host: expect.any(String),
        port: expect.any(Number),
        title: expect.any(String),
        scenarios: expect.any(Array),
      });
      database.scenarios.forEach((scenario) => {
        expect(scenario).toEqual({
          id: expect.any(String),
          title: expect.any(String),
          query: expect.any(String),
          databaseId: expect.any(String),
          databaseTitle: expect.any(String),
          databaseHost: expect.any(String),
          databasePort: expect.any(Number),
          coverUrl: expect.any(String),
        });
      });
    });
  });
});
