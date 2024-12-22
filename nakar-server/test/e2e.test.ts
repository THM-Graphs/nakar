/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import request from 'supertest';
import { expect, describe, it } from '@jest/globals';

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
    expect(response.body.nodes.length).toBeGreaterThan(0);
    expect(response.body.edges.length).toBeGreaterThan(0);
  });
});

describe('GET /api/frontend/scenarios', () => {
  it('200', async () => {
    const response = await server.get(`/api/frontend/scenarios`);
    expect(response.status).toStrictEqual(200);
    // todo check dto
  });
});
