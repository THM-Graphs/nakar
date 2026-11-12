import type { DatabaseStatsLabelDto } from './dto/DatabaseStatsLabelDto';
import type { DatabaseStatsRelationshipDto } from './dto/DatabaseStatsRelationshipDto';
import type { NodePreviewDto } from '../../../schema/dtos/NodePreviewDto';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { SuiteContext, TestContext } from 'node:test';
import { after, before, describe, test } from 'node:test';
import z from 'zod';
import { E2ETestManager } from '../../../../e2e/E2ETestManager';
import type { E2ETestCanvas } from '../../../../e2e/E2ETestManager';
import type { E2ETestApplicationUser } from '../../../../e2e/E2ETestApplicationUser';
import type { PostAuthResponseBodyDto } from '../auth/dto/PostAuthResponseBodyDto';
import { RoomVisibilityDto } from '../../../schema/dtos/RoomVisibilityDto';
import type { GetDatabaseStatsResponseBodyDto } from './dto/GetDatabaseStatsResponseBodyDto';
import type { GetSearchCapabilitiesResponseBodyDto } from './dto/GetSearchCapabilitiesResponseBodyDto';
import type { PostSearchRequestBodyDto } from './dto/PostSearchRequestBodyDto';
import type { PostSearchResponseBodyDto } from './dto/PostSearchResponseBodyDto';
import type { ExpandNodePreviewResponseBodyDto } from './dto/ExpandNodePreviewResponseBodyDto';
import type { LoadNodeRequestBodyDto } from '../canvas-action/dto/LoadNodeRequestBodyDto';
import { IdHash } from '../../../../packages/hash/IdHash';

const statsSchema: z.ZodType<GetDatabaseStatsResponseBodyDto> = z.strictObject({
  relTypeCount: z.number().nullable(),
  labelCount: z.number().nullable(),
  relCount: z.number().nullable(),
  nodeCount: z.number().nullable(),
  labels: z
    .array(
      z.strictObject({ label: z.string(), exploreQuery: z.string().min(1) }),
    )
    .nullable(),
  rels: z
    .array(
      z.strictObject({ relType: z.string(), exploreQuery: z.string().min(1) }),
    )
    .nullable(),
});
const capabilitiesSchema: z.ZodType<GetSearchCapabilitiesResponseBodyDto> =
  z.strictObject({
    canExactMatchNativeId: z.boolean(),
    canExactMatchLabel: z.boolean(),
    exactMatchNodeProperties: z.array(
      z.strictObject({ label: z.string(), property: z.string() }),
    ),
    fuzzyMatchNodeProperties: z.array(
      z.strictObject({ label: z.string(), property: z.string() }),
    ),
    special: z.array(z.string()),
  });
const searchSchema: z.ZodType<PostSearchResponseBodyDto> = z.strictObject({
  nodes: z.array(
    z.strictObject({
      id: z.string().min(1),
      nativeId: z.string(),
      title: z.string(),
      labels: z.array(z.string()),
    }),
  ),
});
const expandSchema: z.ZodType<ExpandNodePreviewResponseBodyDto> =
  z.strictObject({
    labels: z.array(
      z.strictObject({
        identificator: z.string(),
        title: z.string(),
        count: z.number().int().nonnegative(),
      }),
    ),
    relationships: z.array(
      z.strictObject({
        identificator: z.string(),
        title: z.string(),
        count: z.number().int().nonnegative(),
      }),
    ),
  });

describe('/room/:roomId/canvas/:canvasId/database-connection/:databaseId', (suiteContext: SuiteContext): void => {
  const manager: E2ETestManager = new E2ETestManager();
  before(
    async (): Promise<void> => {
      await manager.createAndStartApp(suiteContext);
    },
    { timeout: Infinity },
  );
  after(async (): Promise<void> => {
    await manager.destroy(suiteContext);
  });
  describe('/stats', (): void => {
    describe('GET', (): void => {
      describe('200', (): void => {
        test('owner can access a private room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/stats`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: GetDatabaseStatsResponseBodyDto = statsSchema.parse(
            await response.json(),
          );
          assert.equal(body.relTypeCount, 1);
          assert.equal(body.labelCount, 3);
          assert.equal(body.relCount, 7);
          assert.equal(body.nodeCount, null);
          assert.deepEqual(
            body.labels?.map(
              (label: DatabaseStatsLabelDto): string => label.label,
            ),
            ['NamedNode', 'BlankNode', 'Literal'],
          );
          assert.deepEqual(
            body.rels?.map(
              (relationship: DatabaseStatsRelationshipDto): string =>
                relationship.relType,
            ),
            ['https://example.test/related'],
          );
        });
        test('collaborator can access a private room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
            [collaborator.documentId],
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/stats`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: GetDatabaseStatsResponseBodyDto = statsSchema.parse(
            await response.json(),
          );
          assert.equal(body.relTypeCount, 1);
          assert.equal(body.labelCount, 3);
          assert.equal(body.relCount, 7);
          assert.equal(body.nodeCount, null);
          assert.deepEqual(
            body.labels?.map(
              (label: DatabaseStatsLabelDto): string => label.label,
            ),
            ['NamedNode', 'BlankNode', 'Literal'],
          );
          assert.deepEqual(
            body.rels?.map(
              (relationship: DatabaseStatsRelationshipDto): string =>
                relationship.relType,
            ),
            ['https://example.test/related'],
          );
        });
        test('anonymous can access a public room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.public,
          );

          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/stats`,
            {
              method: 'GET',
              headers: new Headers([['Content-Type', 'application/json']]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: GetDatabaseStatsResponseBodyDto = statsSchema.parse(
            await response.json(),
          );
          assert.equal(body.relTypeCount, 1);
          assert.equal(body.labelCount, 3);
          assert.equal(body.relCount, 7);
          assert.equal(body.nodeCount, null);
          assert.deepEqual(
            body.labels?.map(
              (label: DatabaseStatsLabelDto): string => label.label,
            ),
            ['NamedNode', 'BlankNode', 'Literal'],
          );
          assert.deepEqual(
            body.rels?.map(
              (relationship: DatabaseStatsRelationshipDto): string =>
                relationship.relType,
            ),
            ['https://example.test/related'],
          );
        });
        test('anonymous can access an unlisted room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.unlisted,
          );

          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/stats`,
            {
              method: 'GET',
              headers: new Headers([['Content-Type', 'application/json']]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: GetDatabaseStatsResponseBodyDto = statsSchema.parse(
            await response.json(),
          );
          assert.equal(body.relTypeCount, 1);
          assert.equal(body.labelCount, 3);
          assert.equal(body.relCount, 7);
          assert.equal(body.nodeCount, null);
          assert.deepEqual(
            body.labels?.map(
              (label: DatabaseStatsLabelDto): string => label.label,
            ),
            ['NamedNode', 'BlankNode', 'Literal'],
          );
          assert.deepEqual(
            body.rels?.map(
              (relationship: DatabaseStatsRelationshipDto): string =>
                relationship.relType,
            ),
            ['https://example.test/related'],
          );
        });
      });
      describe('401', (): void => {
        test('requires valid authentication for a private room', async (testContext: TestContext): Promise<void> => {
          const variants: { headers: [string, string][] }[] = [
            {
              headers: [['Content-Type', 'application/json']],
            },
            {
              headers: [
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer invalid-jwt`],
              ],
            },
          ];
          for (const variant of variants) {
            // given
            const owner: E2ETestApplicationUser =
              await manager.registerUser(testContext);
            const canvas: E2ETestCanvas = await manager.createCanvas(
              owner,
              testContext,
              RoomVisibilityDto.private,
            );

            const database: string = await manager.createPublishedDocument(
              'api::database-connection.database-connection',
              {
                title: 'Test Database',
                project: canvas.projectId,
                databaseType: 'sparql',
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
                browserUrl: '',
                database: '',
              },
              testContext,
            );

            // when
            const response: Response = await fetch(
              `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/stats`,
              {
                method: 'GET',
                signal: testContext.signal,
                headers: new Headers(variant.headers),
              },
            );

            // then
            assert.equal(response.status, 401);
            assert.equal(response.headers.get('www-authenticate'), 'Bearer');
            assert.deepEqual(await response.json(), {
              statusCode: 401,
              message: 'Unauthorized',
            });
          }
        });
      });
      describe('403', (): void => {
        test('rejects an outsider in a private room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const outsider: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/stats`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            message: 'Forbidden resource',
            error: 'Forbidden',
          });
        });
      });
      describe('404', (): void => {
        test('rejects an unknown database', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          const database: string = randomUUID();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/stats`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unpublished database', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const unpublished: Response = await manager.unpublishDocument(
            'api::database-connection.database-connection',
            database,
            {},
            testContext,
          );
          assert.equal(unpublished.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/stats`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects a database from another project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          const other: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              project: other.projectId,
              title: 'Foreign Database',
              databaseType: 'sparql',
              connectionUrl: manager.getSparqlServer().getServerUrl(),
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/stats`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unknown canvas', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          canvas.canvasId = randomUUID();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/stats`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects a canvas in another room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const other: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
          );
          canvas.roomId = other.roomId;

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/stats`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unpublished canvas', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const unpublished: Response = await manager.unpublishDocument(
            'api::canvas.canvas',
            canvas.canvasId,
            {},
            testContext,
          );
          assert.equal(unpublished.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/stats`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unknown room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          canvas.roomId = randomUUID();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/stats`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unpublished room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const unpublished: Response = await manager.unpublishDocument(
            'api::room.room',
            canvas.roomId,
            {},
            testContext,
          );
          assert.equal(unpublished.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/stats`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unpublished project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const unpublished: Response = await manager.unpublishDocument(
            'api::project.project',
            canvas.projectId,
            {},
            testContext,
          );
          assert.equal(unpublished.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/stats`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
      });
      describe('502', (): void => {
        test('reports a failure of the external database', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/unavailable/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/stats`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 502);
          assert.deepEqual(await response.json(), {
            statusCode: 502,
            message: 'External database request failed.',
            error: 'Bad Gateway',
          });
        });
      });
    });
  });
  describe('/search-capabilities', (): void => {
    describe('GET', (): void => {
      describe('200', (): void => {
        test('owner can access a private room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search-capabilities`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: GetSearchCapabilitiesResponseBodyDto =
            capabilitiesSchema.parse(await response.json());
          assert.deepEqual(body, {
            canExactMatchNativeId: true,
            canExactMatchLabel: false,
            exactMatchNodeProperties: [],
            fuzzyMatchNodeProperties: [],
            special: [],
          });
        });
        test('collaborator can access a private room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
            [collaborator.documentId],
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search-capabilities`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: GetSearchCapabilitiesResponseBodyDto =
            capabilitiesSchema.parse(await response.json());
          assert.deepEqual(body, {
            canExactMatchNativeId: true,
            canExactMatchLabel: false,
            exactMatchNodeProperties: [],
            fuzzyMatchNodeProperties: [],
            special: [],
          });
        });
        test('anonymous can access a public room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.public,
          );

          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search-capabilities`,
            {
              method: 'GET',
              headers: new Headers([['Content-Type', 'application/json']]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: GetSearchCapabilitiesResponseBodyDto =
            capabilitiesSchema.parse(await response.json());
          assert.deepEqual(body, {
            canExactMatchNativeId: true,
            canExactMatchLabel: false,
            exactMatchNodeProperties: [],
            fuzzyMatchNodeProperties: [],
            special: [],
          });
        });
        test('anonymous can access an unlisted room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.unlisted,
          );

          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search-capabilities`,
            {
              method: 'GET',
              headers: new Headers([['Content-Type', 'application/json']]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: GetSearchCapabilitiesResponseBodyDto =
            capabilitiesSchema.parse(await response.json());
          assert.deepEqual(body, {
            canExactMatchNativeId: true,
            canExactMatchLabel: false,
            exactMatchNodeProperties: [],
            fuzzyMatchNodeProperties: [],
            special: [],
          });
        });
        test('returns Wikidata-specific search capabilities', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'wikidata',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search-capabilities`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: GetSearchCapabilitiesResponseBodyDto =
            capabilitiesSchema.parse(await response.json());
          assert.deepEqual(body, {
            canExactMatchNativeId: true,
            canExactMatchLabel: false,
            exactMatchNodeProperties: [],
            fuzzyMatchNodeProperties: [],
            special: ['Q-ID'],
          });
        });
      });
      describe('401', (): void => {
        test('requires valid authentication for a private room', async (testContext: TestContext): Promise<void> => {
          const variants: { headers: [string, string][] }[] = [
            {
              headers: [['Content-Type', 'application/json']],
            },
            {
              headers: [
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer invalid-jwt`],
              ],
            },
          ];
          for (const variant of variants) {
            // given
            const owner: E2ETestApplicationUser =
              await manager.registerUser(testContext);
            const canvas: E2ETestCanvas = await manager.createCanvas(
              owner,
              testContext,
              RoomVisibilityDto.private,
            );

            const database: string = await manager.createPublishedDocument(
              'api::database-connection.database-connection',
              {
                title: 'Test Database',
                project: canvas.projectId,
                databaseType: 'sparql',
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
                browserUrl: '',
                database: '',
              },
              testContext,
            );

            // when
            const response: Response = await fetch(
              `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search-capabilities`,
              {
                method: 'GET',
                signal: testContext.signal,
                headers: new Headers(variant.headers),
              },
            );

            // then
            assert.equal(response.status, 401);
            assert.equal(response.headers.get('www-authenticate'), 'Bearer');
            assert.deepEqual(await response.json(), {
              statusCode: 401,
              message: 'Unauthorized',
            });
          }
        });
      });
      describe('403', (): void => {
        test('rejects an outsider in a private room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const outsider: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search-capabilities`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            message: 'Forbidden resource',
            error: 'Forbidden',
          });
        });
      });
      describe('404', (): void => {
        test('rejects an unknown database', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          const database: string = randomUUID();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search-capabilities`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unpublished database', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const unpublished: Response = await manager.unpublishDocument(
            'api::database-connection.database-connection',
            database,
            {},
            testContext,
          );
          assert.equal(unpublished.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search-capabilities`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects a database from another project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          const other: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              project: other.projectId,
              title: 'Foreign Database',
              databaseType: 'sparql',
              connectionUrl: manager.getSparqlServer().getServerUrl(),
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search-capabilities`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unknown canvas', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          canvas.canvasId = randomUUID();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search-capabilities`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects a canvas in another room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const other: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
          );
          canvas.roomId = other.roomId;

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search-capabilities`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unpublished canvas', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const unpublished: Response = await manager.unpublishDocument(
            'api::canvas.canvas',
            canvas.canvasId,
            {},
            testContext,
          );
          assert.equal(unpublished.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search-capabilities`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unknown room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          canvas.roomId = randomUUID();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search-capabilities`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unpublished room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const unpublished: Response = await manager.unpublishDocument(
            'api::room.room',
            canvas.roomId,
            {},
            testContext,
          );
          assert.equal(unpublished.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search-capabilities`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unpublished project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const unpublished: Response = await manager.unpublishDocument(
            'api::project.project',
            canvas.projectId,
            {},
            testContext,
          );
          assert.equal(unpublished.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search-capabilities`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
      });
    });
  });
  describe('/search', (): void => {
    describe('POST', (): void => {
      describe('200', (): void => {
        test('owner can access a private room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.startCanvas(canvas, login.jwt, testContext);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search`,
            {
              method: 'POST',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                searchTerm: 'https://example.test/alice',
              } satisfies PostSearchRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: PostSearchResponseBodyDto = searchSchema.parse(
            await response.json(),
          );
          assert.equal(body.nodes.length, 1);
          assert.deepEqual(
            body.nodes.map(
              (
                node: NodePreviewDto,
              ): { id: string; nativeId: string; labels: string[] } => ({
                id: node.id,
                nativeId: node.nativeId,
                labels: node.labels,
              }),
            ),
            [
              {
                id:
                  database +
                  '_' +
                  IdHash.create('<https://example.test/alice>'),
                nativeId: '<https://example.test/alice>',
                labels: ['NamedNode'],
              },
            ],
          );
        });
        test('collaborator can access a private room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
            [collaborator.documentId],
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.startCanvas(canvas, login.jwt, testContext);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search`,
            {
              method: 'POST',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                searchTerm: 'https://example.test/alice',
              } satisfies PostSearchRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: PostSearchResponseBodyDto = searchSchema.parse(
            await response.json(),
          );
          assert.equal(body.nodes.length, 1);
          assert.deepEqual(
            body.nodes.map(
              (
                node: NodePreviewDto,
              ): { id: string; nativeId: string; labels: string[] } => ({
                id: node.id,
                nativeId: node.nativeId,
                labels: node.labels,
              }),
            ),
            [
              {
                id:
                  database +
                  '_' +
                  IdHash.create('<https://example.test/alice>'),
                nativeId: '<https://example.test/alice>',
                labels: ['NamedNode'],
              },
            ],
          );
        });
        test('anonymous can access a public room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.public,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.startCanvas(canvas, login.jwt, testContext);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search`,
            {
              method: 'POST',
              headers: new Headers([['Content-Type', 'application/json']]),
              body: JSON.stringify({
                searchTerm: 'https://example.test/alice',
              } satisfies PostSearchRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: PostSearchResponseBodyDto = searchSchema.parse(
            await response.json(),
          );
          assert.equal(body.nodes.length, 1);
          assert.deepEqual(
            body.nodes.map(
              (
                node: NodePreviewDto,
              ): { id: string; nativeId: string; labels: string[] } => ({
                id: node.id,
                nativeId: node.nativeId,
                labels: node.labels,
              }),
            ),
            [
              {
                id:
                  database +
                  '_' +
                  IdHash.create('<https://example.test/alice>'),
                nativeId: '<https://example.test/alice>',
                labels: ['NamedNode'],
              },
            ],
          );
        });
        test('anonymous can access an unlisted room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.unlisted,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.startCanvas(canvas, login.jwt, testContext);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search`,
            {
              method: 'POST',
              headers: new Headers([['Content-Type', 'application/json']]),
              body: JSON.stringify({
                searchTerm: 'https://example.test/alice',
              } satisfies PostSearchRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: PostSearchResponseBodyDto = searchSchema.parse(
            await response.json(),
          );
          assert.equal(body.nodes.length, 1);
          assert.deepEqual(
            body.nodes.map(
              (
                node: NodePreviewDto,
              ): { id: string; nativeId: string; labels: string[] } => ({
                id: node.id,
                nativeId: node.nativeId,
                labels: node.labels,
              }),
            ),
            [
              {
                id:
                  database +
                  '_' +
                  IdHash.create('<https://example.test/alice>'),
                nativeId: '<https://example.test/alice>',
                labels: ['NamedNode'],
              },
            ],
          );
        });
        test('returns no nodes for an unmatched search term', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.startCanvas(canvas, login.jwt, testContext);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search`,
            {
              method: 'POST',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                searchTerm: 'no URI',
              } satisfies PostSearchRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          assert.deepEqual(searchSchema.parse(await response.json()), {
            nodes: [],
          });
        });
        test('returns no nodes when the database has no matching triples', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/empty/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.startCanvas(canvas, login.jwt, testContext);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search`,
            {
              method: 'POST',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                searchTerm: 'https://example.test/alice',
              } satisfies PostSearchRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          assert.deepEqual(searchSchema.parse(await response.json()), {
            nodes: [],
          });
        });
      });
      describe('400', (): void => {
        test('rejects invalid search request bodies', async (testContext: TestContext): Promise<void> => {
          const variants: {
            payload: Record<string, unknown>;
            expectedMessages: string[];
          }[] = [
            {
              payload: {},
              expectedMessages: ['searchTerm must be a string'],
            },
            {
              payload: { searchTerm: null },
              expectedMessages: ['searchTerm must be a string'],
            },
            {
              payload: { searchTerm: 42 },
              expectedMessages: ['searchTerm must be a string'],
            },
            {
              payload: { searchTerm: 'term', extra: true },
              expectedMessages: ['property extra should not exist'],
            },
          ];
          for (const variant of variants) {
            // given
            const owner: E2ETestApplicationUser =
              await manager.registerUser(testContext);
            const canvas: E2ETestCanvas = await manager.createCanvas(
              owner,
              testContext,
              RoomVisibilityDto.private,
            );
            const login: PostAuthResponseBodyDto = await manager.loginUser(
              owner.username,
              owner.password,
              testContext,
            );
            const database: string = await manager.createPublishedDocument(
              'api::database-connection.database-connection',
              {
                title: 'Test Database',
                project: canvas.projectId,
                databaseType: 'sparql',
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
                browserUrl: '',
                database: '',
              },
              testContext,
            );
            await manager.startCanvas(canvas, login.jwt, testContext);

            // when
            const response: Response = await fetch(
              `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search`,
              {
                method: 'POST',
                headers: new Headers([
                  ['Content-Type', 'application/json'],
                  ['Authorization', `Bearer ${login.jwt}`],
                ]),
                body: JSON.stringify(variant.payload),
                signal: testContext.signal,
              },
            );

            // then
            assert.equal(response.status, 400);
            assert.deepEqual(await response.json(), {
              statusCode: 400,
              error: 'Bad Request',
              message: variant.expectedMessages,
            });
          }
        });
      });
      describe('401', (): void => {
        test('requires valid authentication for a private room', async (testContext: TestContext): Promise<void> => {
          const variants: { headers: [string, string][] }[] = [
            {
              headers: [['Content-Type', 'application/json']],
            },
            {
              headers: [
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer invalid-jwt`],
              ],
            },
          ];
          for (const variant of variants) {
            // given
            const owner: E2ETestApplicationUser =
              await manager.registerUser(testContext);
            const canvas: E2ETestCanvas = await manager.createCanvas(
              owner,
              testContext,
              RoomVisibilityDto.private,
            );

            const database: string = await manager.createPublishedDocument(
              'api::database-connection.database-connection',
              {
                title: 'Test Database',
                project: canvas.projectId,
                databaseType: 'sparql',
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
                browserUrl: '',
                database: '',
              },
              testContext,
            );

            // when
            const response: Response = await fetch(
              `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search`,
              {
                method: 'POST',
                body: JSON.stringify({
                  searchTerm: 'https://example.test/alice',
                } satisfies PostSearchRequestBodyDto),
                signal: testContext.signal,
                headers: new Headers(variant.headers),
              },
            );

            // then
            assert.equal(response.status, 401);
            assert.equal(response.headers.get('www-authenticate'), 'Bearer');
            assert.deepEqual(await response.json(), {
              statusCode: 401,
              message: 'Unauthorized',
            });
          }
        });
      });
      describe('403', (): void => {
        test('rejects an outsider in a private room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const outsider: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search`,
            {
              method: 'POST',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                searchTerm: 'https://example.test/alice',
              } satisfies PostSearchRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            message: 'Forbidden resource',
            error: 'Forbidden',
          });
        });
      });
      describe('404', (): void => {
        test('rejects an unknown database', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          const database: string = randomUUID();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search`,
            {
              method: 'POST',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                searchTerm: 'https://example.test/alice',
              } satisfies PostSearchRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unpublished database', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const unpublished: Response = await manager.unpublishDocument(
            'api::database-connection.database-connection',
            database,
            {},
            testContext,
          );
          assert.equal(unpublished.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search`,
            {
              method: 'POST',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                searchTerm: 'https://example.test/alice',
              } satisfies PostSearchRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects a database from another project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          const other: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              project: other.projectId,
              title: 'Foreign Database',
              databaseType: 'sparql',
              connectionUrl: manager.getSparqlServer().getServerUrl(),
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search`,
            {
              method: 'POST',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                searchTerm: 'https://example.test/alice',
              } satisfies PostSearchRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unknown canvas', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          canvas.canvasId = randomUUID();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search`,
            {
              method: 'POST',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                searchTerm: 'https://example.test/alice',
              } satisfies PostSearchRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects a canvas in another room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const other: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
          );
          canvas.roomId = other.roomId;

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search`,
            {
              method: 'POST',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                searchTerm: 'https://example.test/alice',
              } satisfies PostSearchRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unpublished canvas', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const unpublished: Response = await manager.unpublishDocument(
            'api::canvas.canvas',
            canvas.canvasId,
            {},
            testContext,
          );
          assert.equal(unpublished.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search`,
            {
              method: 'POST',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                searchTerm: 'https://example.test/alice',
              } satisfies PostSearchRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unknown room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          canvas.roomId = randomUUID();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search`,
            {
              method: 'POST',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                searchTerm: 'https://example.test/alice',
              } satisfies PostSearchRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unpublished room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const unpublished: Response = await manager.unpublishDocument(
            'api::room.room',
            canvas.roomId,
            {},
            testContext,
          );
          assert.equal(unpublished.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search`,
            {
              method: 'POST',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                searchTerm: 'https://example.test/alice',
              } satisfies PostSearchRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unpublished project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const unpublished: Response = await manager.unpublishDocument(
            'api::project.project',
            canvas.projectId,
            {},
            testContext,
          );
          assert.equal(unpublished.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search`,
            {
              method: 'POST',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                searchTerm: 'https://example.test/alice',
              } satisfies PostSearchRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
      });
      describe('409', (): void => {
        test('rejects a search before the canvas is active', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search`,
            {
              method: 'POST',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                searchTerm: 'https://example.test/alice',
              } satisfies PostSearchRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 409);
          assert.deepEqual(await response.json(), {
            statusCode: 409,
            message: 'Canvas is not active.',
            error: 'Conflict',
          });
        });
      });
      describe('502', (): void => {
        test('reports a failure of the external database', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/unavailable/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.startCanvas(canvas, login.jwt, testContext);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/search`,
            {
              method: 'POST',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                searchTerm: 'https://example.test/alice',
              } satisfies PostSearchRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 502);
          assert.deepEqual(await response.json(), {
            statusCode: 502,
            message: 'External database request failed.',
            error: 'Bad Gateway',
          });
        });
      });
    });
  });
  describe('/expand-node-preview', (): void => {
    describe('GET', (): void => {
      describe('200', (): void => {
        test('returns counts for a loaded node', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.startCanvas(canvas, login.jwt, testContext);
          const loaded: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/action/load-node`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                databaseId: database,
                nativeNodeId: '<https://example.test/alice>',
              } satisfies LoadNodeRequestBodyDto),
              signal: testContext.signal,
            },
          );
          assert.equal(loaded.status, 200);
          await loaded.body?.cancel();
          await manager.startCanvas(canvas, login.jwt, testContext);
          const nodeId: string =
            database + '_' + IdHash.create('<https://example.test/alice>');

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/expand-node-preview?nodeId=${encodeURIComponent(nodeId)}`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: ExpandNodePreviewResponseBodyDto = expandSchema.parse(
            await response.json(),
          );
          assert.deepEqual(body, {
            labels: [
              { identificator: 'NamedNode', title: 'NamedNode', count: 2 },
            ],
            relationships: [
              {
                identificator: '<https://example.test/related>',
                title: '<https://example.test/related>',
                count: 7,
              },
            ],
          });
        });
        test('collaborator can preview a loaded node', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
            [collaborator.documentId],
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.startCanvas(canvas, login.jwt, testContext);
          const loaded: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/action/load-node`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                databaseId: database,
                nativeNodeId: '<https://example.test/alice>',
              } satisfies LoadNodeRequestBodyDto),
              signal: testContext.signal,
            },
          );
          assert.equal(loaded.status, 200);
          await loaded.body?.cancel();
          await manager.startCanvas(canvas, login.jwt, testContext);
          const nodeId: string =
            database + '_' + IdHash.create('<https://example.test/alice>');

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/expand-node-preview?nodeId=${encodeURIComponent(nodeId)}`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: ExpandNodePreviewResponseBodyDto = expandSchema.parse(
            await response.json(),
          );
          assert.deepEqual(body, {
            labels: [
              { identificator: 'NamedNode', title: 'NamedNode', count: 2 },
            ],
            relationships: [
              {
                identificator: '<https://example.test/related>',
                title: '<https://example.test/related>',
                count: 7,
              },
            ],
          });
        });
        test('anonymous can preview a loaded node in a public room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.public,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.startCanvas(canvas, login.jwt, testContext);
          const loaded: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/action/load-node`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                databaseId: database,
                nativeNodeId: '<https://example.test/alice>',
              } satisfies LoadNodeRequestBodyDto),
              signal: testContext.signal,
            },
          );
          assert.equal(loaded.status, 200);
          await loaded.body?.cancel();
          await manager.startCanvas(canvas, login.jwt, testContext);
          const nodeId: string =
            database + '_' + IdHash.create('<https://example.test/alice>');

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/expand-node-preview?nodeId=${encodeURIComponent(nodeId)}`,
            {
              method: 'GET',
              headers: new Headers([['Content-Type', 'application/json']]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: ExpandNodePreviewResponseBodyDto = expandSchema.parse(
            await response.json(),
          );
          assert.deepEqual(body, {
            labels: [
              { identificator: 'NamedNode', title: 'NamedNode', count: 2 },
            ],
            relationships: [
              {
                identificator: '<https://example.test/related>',
                title: '<https://example.test/related>',
                count: 7,
              },
            ],
          });
        });
      });
      describe('400', (): void => {
        test('rejects invalid node identifier query parameters', async (testContext: TestContext): Promise<void> => {
          const variants: {
            expectedMessages: string[];
            query: string;
          }[] = [
            {
              expectedMessages: ['nodeId must be a string'],
              query: '',
            },
            {
              expectedMessages: ['nodeId must be a string'],
              query: `?nodeId=a&nodeId=b`,
            },
            {
              expectedMessages: ['property extra should not exist'],
              query: `?nodeId=a&extra=true`,
            },
          ];
          for (const variant of variants) {
            // given
            const owner: E2ETestApplicationUser =
              await manager.registerUser(testContext);
            const canvas: E2ETestCanvas = await manager.createCanvas(
              owner,
              testContext,
              RoomVisibilityDto.private,
            );
            const login: PostAuthResponseBodyDto = await manager.loginUser(
              owner.username,
              owner.password,
              testContext,
            );
            const database: string = await manager.createPublishedDocument(
              'api::database-connection.database-connection',
              {
                title: 'Test Database',
                project: canvas.projectId,
                databaseType: 'sparql',
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
                browserUrl: '',
                database: '',
              },
              testContext,
            );
            await manager.startCanvas(canvas, login.jwt, testContext);

            // when
            const response: Response = await fetch(
              `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/expand-node-preview${variant.query}`,
              {
                method: 'GET',
                headers: new Headers([
                  ['Content-Type', 'application/json'],
                  ['Authorization', `Bearer ${login.jwt}`],
                ]),
                signal: testContext.signal,
              },
            );

            // then
            assert.equal(response.status, 400);
            assert.deepEqual(await response.json(), {
              statusCode: 400,
              error: 'Bad Request',
              message: variant.expectedMessages,
            });
          }
        });
      });
      describe('401', (): void => {
        test('requires valid authentication for a private room', async (testContext: TestContext): Promise<void> => {
          const variants: { headers: [string, string][] }[] = [
            {
              headers: [['Content-Type', 'application/json']],
            },
            {
              headers: [
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer invalid-jwt`],
              ],
            },
          ];
          for (const variant of variants) {
            // given
            const owner: E2ETestApplicationUser =
              await manager.registerUser(testContext);
            const canvas: E2ETestCanvas = await manager.createCanvas(
              owner,
              testContext,
              RoomVisibilityDto.private,
            );

            const database: string = await manager.createPublishedDocument(
              'api::database-connection.database-connection',
              {
                title: 'Test Database',
                project: canvas.projectId,
                databaseType: 'sparql',
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
                browserUrl: '',
                database: '',
              },
              testContext,
            );

            // when
            const response: Response = await fetch(
              `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/expand-node-preview?nodeId=unknown`,
              {
                method: 'GET',
                signal: testContext.signal,
                headers: new Headers(variant.headers),
              },
            );

            // then
            assert.equal(response.status, 401);
            assert.equal(response.headers.get('www-authenticate'), 'Bearer');
            assert.deepEqual(await response.json(), {
              statusCode: 401,
              message: 'Unauthorized',
            });
          }
        });
      });
      describe('403', (): void => {
        test('rejects an outsider in a private room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const outsider: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/expand-node-preview?nodeId=unknown`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            message: 'Forbidden resource',
            error: 'Forbidden',
          });
        });
      });
      describe('404', (): void => {
        test('rejects an unknown node', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.startCanvas(canvas, login.jwt, testContext);
          const nodeId: string = randomUUID();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/expand-node-preview?nodeId=${nodeId}`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            error: 'Not Found',
            message: `Node ${nodeId} not found.`,
          });
        });
        test('rejects a loaded node from another database', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          let database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.startCanvas(canvas, login.jwt, testContext);
          const loaded: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/action/load-node`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                databaseId: database,
                nativeNodeId: '<https://example.test/alice>',
              } satisfies LoadNodeRequestBodyDto),
              signal: testContext.signal,
            },
          );
          assert.equal(loaded.status, 200);
          await loaded.body?.cancel();
          await manager.startCanvas(canvas, login.jwt, testContext);
          const nodeId: string =
            database + '_' + IdHash.create('<https://example.test/alice>');
          database = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Other Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/expand-node-preview?nodeId=${encodeURIComponent(nodeId)}`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            error: 'Not Found',
            message: `Node ${nodeId} not found.`,
          });
        });
        test('rejects an unknown database', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          const database: string = randomUUID();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/expand-node-preview?nodeId=unknown`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unpublished database', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const unpublished: Response = await manager.unpublishDocument(
            'api::database-connection.database-connection',
            database,
            {},
            testContext,
          );
          assert.equal(unpublished.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/expand-node-preview?nodeId=unknown`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects a database from another project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          const other: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              project: other.projectId,
              title: 'Foreign Database',
              databaseType: 'sparql',
              connectionUrl: manager.getSparqlServer().getServerUrl(),
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/expand-node-preview?nodeId=unknown`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unknown canvas', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          canvas.canvasId = randomUUID();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/expand-node-preview?nodeId=unknown`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects a canvas in another room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const other: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
          );
          canvas.roomId = other.roomId;

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/expand-node-preview?nodeId=unknown`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unpublished canvas', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const unpublished: Response = await manager.unpublishDocument(
            'api::canvas.canvas',
            canvas.canvasId,
            {},
            testContext,
          );
          assert.equal(unpublished.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/expand-node-preview?nodeId=unknown`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unknown room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          canvas.roomId = randomUUID();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/expand-node-preview?nodeId=unknown`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unpublished room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const unpublished: Response = await manager.unpublishDocument(
            'api::room.room',
            canvas.roomId,
            {},
            testContext,
          );
          assert.equal(unpublished.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/expand-node-preview?nodeId=unknown`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
        test('rejects an unpublished project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const unpublished: Response = await manager.unpublishDocument(
            'api::project.project',
            canvas.projectId,
            {},
            testContext,
          );
          assert.equal(unpublished.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/expand-node-preview?nodeId=unknown`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });
      });
      describe('409', (): void => {
        test('rejects a preview before the canvas is active', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/expand-node-preview?nodeId=unknown`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 409);
          assert.deepEqual(await response.json(), {
            statusCode: 409,
            message: 'Canvas is not active.',
            error: 'Conflict',
          });
        });
      });
      describe('502', (): void => {
        test('reports a failure while previewing an external node', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Test Database',
              project: canvas.projectId,
              databaseType: 'sparql',
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/graph/${randomUUID()}`,
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.startCanvas(canvas, login.jwt, testContext);
          const loaded: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/action/load-node`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                databaseId: database,
                nativeNodeId: '<https://example.test/alice>',
              } satisfies LoadNodeRequestBodyDto),
              signal: testContext.signal,
            },
          );
          assert.equal(loaded.status, 200);
          await loaded.body?.cancel();
          await manager.startCanvas(canvas, login.jwt, testContext);
          const nodeId: string =
            database + '_' + IdHash.create('<https://example.test/alice>');
          const update: Response = await manager.publishDocument(
            'api::database-connection.database-connection',
            database,
            {
              connectionUrl: `${manager.getSparqlServer().getServerUrl()}/unavailable/${randomUUID()}`,
            },
            testContext,
          );
          assert.equal(update.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/database-connection/${database}/expand-node-preview?nodeId=${encodeURIComponent(nodeId)}`,
            {
              method: 'GET',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 502);
          assert.deepEqual(await response.json(), {
            statusCode: 502,
            message: 'External database request failed.',
            error: 'Bad Gateway',
          });
        });
      });
    });
  });
});
