import type { UpdateDatabaseConnectionRequestBodyDto } from './dto/UpdateDatabaseConnectionRequestBodyDto';
import type { UpdateNodeConfigurationRequestBodyDto } from './dto/UpdateNodeConfigurationRequestBodyDto';
import type { TestDatabaseConnectionRequestBodyDto } from './dto/TestDatabaseConnectionRequestBodyDto';
import { encryptionPayloadSchema } from '../../../encryption/encryptionPayloadSchema';
import type { E2ETestApplicationUser } from '../../../../e2e/E2ETestApplicationUser';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { SuiteContext, TestContext } from 'node:test';
import { after, before, describe, test } from 'node:test';
import z from 'zod';
import { E2ETestManager } from '../../../../e2e/E2ETestManager';
import type { PostAuthResponseBodyDto } from '../auth/dto/PostAuthResponseBodyDto';
import type { DatabaseConnectionDto } from '../../../schema/dtos/DatabaseConnectionDto';
import { DatabaseConnectionDatabaseType } from '../database-connection/dto/DatabaseConnectionDatabaseType';
import { NodeConfigurationTypeDto } from '../../../schema/dtos/NodeConfigurationTypeDto';
import { Encryption } from '../../../../packages/encryption/Encryption';

// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-assignment -- Zod validates the nested enum values at runtime.
const databaseSchema: z.ZodType<DatabaseConnectionDto> = z.strictObject({
  id: z.string().min(1),
  title: z.string(),
  browserUrl: z.string(),
  connectionUrl: z.string(),
  database: z.string(),
  databaseType: z.enum(DatabaseConnectionDatabaseType),
  language: z.string().nullable(),
  nodeConfigurations: z.array(
    z.strictObject({
      id: z.string().min(1),
      type: z.enum(NodeConfigurationTypeDto),
      label: z.string(),
      property: z.string(),
      linkTemplate: z.string(),
      urlEncode: z.boolean(),
      valueRegex: z.string(),
    }),
  ),
});
const listStateSchema: z.ZodType<{
  results: ({ documentId: string; publishedAt: string | null } & Record<
    string,
    unknown
  >)[];
}> = z.object({
  results: z.array(
    z
      .object({
        documentId: z.string().min(1),
        publishedAt: z.string().nullable(),
      })
      .loose(),
  ),
});
const projectStateSchema: z.ZodType<{ databases: DatabaseConnectionDto[] }> =
  z.object({ databases: z.array(databaseSchema) });
describe('/project/:projectId/database-connection', (suiteContext: SuiteContext): void => {
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
  describe('POST', (): void => {
    describe('201', (): void => {
      test('published collaborator retains access after draft removal', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const collaborator: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const project: string = await manager.createPublishedDocument(
          'api::project.project',
          {
            title: 'Test Project',
            owner: owner.documentId,
            collaborators: [collaborator.documentId],
          },
          testContext,
        );
        const resource: string = await manager.createPublishedDocument(
          'api::database-connection.database-connection',
          {
            title: 'Original Database',
            project,
            databaseType: 'neo4j',
            connectionUrl: '',
            browserUrl: '',
            database: '',
          },
          testContext,
        );
        const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          collaborator.username,
          collaborator.password,
          testContext,
        );
        const draftRemoval: Response = await manager.updateDocument(
          'api::project.project',
          project,
          { collaborators: [] },
          testContext,
        );
        assert.equal(draftRemoval.status, 200);

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/database-connection`,
          {
            method: 'POST',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 201);
        const body: DatabaseConnectionDto = databaseSchema.parse(
          await response.json(),
        );
        assert.notEqual(body.id, resource);
        assert.deepEqual(body, {
          id: body.id,
          title: 'Untitled Database Connection',
          browserUrl: '',
          connectionUrl: '',
          database: '',
          databaseType: DatabaseConnectionDatabaseType.neo4j,
          language: null,
          nodeConfigurations: [],
        });
        const projectResponse: Response = await fetch(
          `${manager.apiUrl}/project/${project}`,
          {
            headers: new Headers([
              ['Authorization', `Bearer ${ownerLogin.jwt}`],
            ]),
            signal: testContext.signal,
          },
        );
        assert.equal(projectResponse.status, 200);
        const publishedState: z.infer<typeof projectStateSchema> =
          projectStateSchema.parse(await projectResponse.json());
        assert.deepEqual(
          publishedState.databases.find(
            (item: DatabaseConnectionDto): boolean => item.id === body.id,
          ),
          body,
        );
      });
      test('owner can create a database connection', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);

        const project: string = await manager.createPublishedDocument(
          'api::project.project',
          { title: 'Test Project', owner: owner.documentId, collaborators: [] },
          testContext,
        );
        const resource: string = await manager.createPublishedDocument(
          'api::database-connection.database-connection',
          {
            title: 'Original Database',
            project,
            databaseType: 'neo4j',
            connectionUrl: '',
            browserUrl: '',
            database: '',
          },
          testContext,
        );
        const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/database-connection`,
          {
            method: 'POST',
            headers: new Headers([
              ['Authorization', `Bearer ${ownerLogin.jwt}`],
            ]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 201);
        const body: DatabaseConnectionDto = databaseSchema.parse(
          await response.json(),
        );
        assert.notEqual(body.id, resource);
        assert.deepEqual(body, {
          id: body.id,
          title: 'Untitled Database Connection',
          browserUrl: '',
          connectionUrl: '',
          database: '',
          databaseType: DatabaseConnectionDatabaseType.neo4j,
          language: null,
          nodeConfigurations: [],
        });
        const projectResponse: Response = await fetch(
          `${manager.apiUrl}/project/${project}`,
          {
            headers: new Headers([
              ['Authorization', `Bearer ${ownerLogin.jwt}`],
            ]),
            signal: testContext.signal,
          },
        );
        assert.equal(projectResponse.status, 200);
        const publishedState: z.infer<typeof projectStateSchema> =
          projectStateSchema.parse(await projectResponse.json());
        assert.deepEqual(
          publishedState.databases.find(
            (item: DatabaseConnectionDto): boolean => item.id === body.id,
          ),
          body,
        );
      });
      test('collaborator can create a database connection', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const collaborator: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const project: string = await manager.createPublishedDocument(
          'api::project.project',
          {
            title: 'Test Project',
            owner: owner.documentId,
            collaborators: [collaborator.documentId],
          },
          testContext,
        );
        const resource: string = await manager.createPublishedDocument(
          'api::database-connection.database-connection',
          {
            title: 'Original Database',
            project,
            databaseType: 'neo4j',
            connectionUrl: '',
            browserUrl: '',
            database: '',
          },
          testContext,
        );
        const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          collaborator.username,
          collaborator.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/database-connection`,
          {
            method: 'POST',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 201);
        const body: DatabaseConnectionDto = databaseSchema.parse(
          await response.json(),
        );
        assert.notEqual(body.id, resource);
        assert.deepEqual(body, {
          id: body.id,
          title: 'Untitled Database Connection',
          browserUrl: '',
          connectionUrl: '',
          database: '',
          databaseType: DatabaseConnectionDatabaseType.neo4j,
          language: null,
          nodeConfigurations: [],
        });
        const projectResponse: Response = await fetch(
          `${manager.apiUrl}/project/${project}`,
          {
            headers: new Headers([
              ['Authorization', `Bearer ${ownerLogin.jwt}`],
            ]),
            signal: testContext.signal,
          },
        );
        assert.equal(projectResponse.status, 200);
        const publishedState: z.infer<typeof projectStateSchema> =
          projectStateSchema.parse(await projectResponse.json());
        assert.deepEqual(
          publishedState.databases.find(
            (item: DatabaseConnectionDto): boolean => item.id === body.id,
          ),
          body,
        );
      });
    });
    describe('401', (): void => {
      test('rejects anonymous access', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const project: string = await manager.createPublishedDocument(
          'api::project.project',
          { title: 'Test Project', owner: owner.documentId, collaborators: [] },
          testContext,
        );
        const resource: string = await manager.createPublishedDocument(
          'api::database-connection.database-connection',
          {
            title: 'Original Database',
            project,
            databaseType: 'neo4j',
            connectionUrl: '',
            browserUrl: '',
            database: '',
          },
          testContext,
        );
        await manager.loginUser(owner.username, owner.password, testContext);
        const filters: Record<string, string> = {
          [`filters[project][documentId][$eq]`]: project,
          pageSize: '100',
          sort: 'documentId:asc',
        };
        const originalDraftResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(originalDraftResponse.status, 200);
        const originalDraft: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalDraftResponse.json());
        assert.ok(
          originalDraft.results.some(
            (item: { documentId: string }): boolean =>
              item.documentId === resource,
          ),
        );
        const originalPublishedResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(originalPublishedResponse.status, 200);
        const originalPublished: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalPublishedResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/database-connection`,
          {
            method: 'POST',
            headers: new Headers([]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 401);
        assert.equal(response.headers.get('www-authenticate'), 'Bearer');
        assert.deepEqual(await response.json(), {
          statusCode: 401,
          message: 'Unauthorized',
        });
        const draftResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(draftResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await draftResponse.json()),
          originalDraft,
        );
        const publishedResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(publishedResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await publishedResponse.json()),
          originalPublished,
        );
      });
      test('rejects invalid jwt access', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const project: string = await manager.createPublishedDocument(
          'api::project.project',
          { title: 'Test Project', owner: owner.documentId, collaborators: [] },
          testContext,
        );
        const resource: string = await manager.createPublishedDocument(
          'api::database-connection.database-connection',
          {
            title: 'Original Database',
            project,
            databaseType: 'neo4j',
            connectionUrl: '',
            browserUrl: '',
            database: '',
          },
          testContext,
        );
        await manager.loginUser(owner.username, owner.password, testContext);
        const filters: Record<string, string> = {
          [`filters[project][documentId][$eq]`]: project,
          pageSize: '100',
          sort: 'documentId:asc',
        };
        const originalDraftResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(originalDraftResponse.status, 200);
        const originalDraft: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalDraftResponse.json());
        assert.ok(
          originalDraft.results.some(
            (item: { documentId: string }): boolean =>
              item.documentId === resource,
          ),
        );
        const originalPublishedResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(originalPublishedResponse.status, 200);
        const originalPublished: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalPublishedResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/database-connection`,
          {
            method: 'POST',
            headers: new Headers([['Authorization', 'Bearer invalid-jwt']]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 401);
        assert.equal(response.headers.get('www-authenticate'), 'Bearer');
        assert.deepEqual(await response.json(), {
          statusCode: 401,
          message: 'Unauthorized',
        });
        const draftResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(draftResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await draftResponse.json()),
          originalDraft,
        );
        const publishedResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(publishedResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await publishedResponse.json()),
          originalPublished,
        );
      });
    });

    describe('403', (): void => {
      test('rejects outsider access', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const outsider: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const project: string = await manager.createPublishedDocument(
          'api::project.project',
          { title: 'Test Project', owner: owner.documentId, collaborators: [] },
          testContext,
        );
        const resource: string = await manager.createPublishedDocument(
          'api::database-connection.database-connection',
          {
            title: 'Original Database',
            project,
            databaseType: 'neo4j',
            connectionUrl: '',
            browserUrl: '',
            database: '',
          },
          testContext,
        );
        await manager.loginUser(owner.username, owner.password, testContext);
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          outsider.username,
          outsider.password,
          testContext,
        );
        const filters: Record<string, string> = {
          [`filters[project][documentId][$eq]`]: project,
          pageSize: '100',
          sort: 'documentId:asc',
        };
        const originalDraftResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(originalDraftResponse.status, 200);
        const originalDraft: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalDraftResponse.json());
        assert.ok(
          originalDraft.results.some(
            (item: { documentId: string }): boolean =>
              item.documentId === resource,
          ),
        );
        const originalPublishedResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(originalPublishedResponse.status, 200);
        const originalPublished: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalPublishedResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/database-connection`,
          {
            method: 'POST',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
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
        const draftResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(draftResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await draftResponse.json()),
          originalDraft,
        );
        const publishedResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(publishedResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await publishedResponse.json()),
          originalPublished,
        );
      });

      test('rejects removed collaborator access', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const collaborator: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const project: string = await manager.createPublishedDocument(
          'api::project.project',
          {
            title: 'Test Project',
            owner: owner.documentId,
            collaborators: [collaborator.documentId],
          },
          testContext,
        );
        const resource: string = await manager.createPublishedDocument(
          'api::database-connection.database-connection',
          {
            title: 'Original Database',
            project,
            databaseType: 'neo4j',
            connectionUrl: '',
            browserUrl: '',
            database: '',
          },
          testContext,
        );
        await manager.loginUser(owner.username, owner.password, testContext);
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          collaborator.username,
          collaborator.password,
          testContext,
        );
        const removal: Response = await manager.publishDocument(
          'api::project.project',
          project,
          { collaborators: [] },
          testContext,
        );
        assert.equal(removal.status, 200);
        const filters: Record<string, string> = {
          [`filters[project][documentId][$eq]`]: project,
          pageSize: '100',
          sort: 'documentId:asc',
        };
        const originalDraftResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(originalDraftResponse.status, 200);
        const originalDraft: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalDraftResponse.json());
        assert.ok(
          originalDraft.results.some(
            (item: { documentId: string }): boolean =>
              item.documentId === resource,
          ),
        );
        const originalPublishedResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(originalPublishedResponse.status, 200);
        const originalPublished: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalPublishedResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/database-connection`,
          {
            method: 'POST',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
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
        const draftResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(draftResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await draftResponse.json()),
          originalDraft,
        );
        const publishedResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(publishedResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await publishedResponse.json()),
          originalPublished,
        );
      });

      test('rejects draft collaborator access', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const collaborator: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const project: string = await manager.createPublishedDocument(
          'api::project.project',
          { title: 'Test Project', owner: owner.documentId, collaborators: [] },
          testContext,
        );
        const resource: string = await manager.createPublishedDocument(
          'api::database-connection.database-connection',
          {
            title: 'Original Database',
            project,
            databaseType: 'neo4j',
            connectionUrl: '',
            browserUrl: '',
            database: '',
          },
          testContext,
        );
        await manager.loginUser(owner.username, owner.password, testContext);
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          collaborator.username,
          collaborator.password,
          testContext,
        );
        const draftAccess: Response = await manager.updateDocument(
          'api::project.project',
          project,
          { collaborators: [collaborator.documentId] },
          testContext,
        );
        assert.equal(draftAccess.status, 200);
        const filters: Record<string, string> = {
          [`filters[project][documentId][$eq]`]: project,
          pageSize: '100',
          sort: 'documentId:asc',
        };
        const originalDraftResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(originalDraftResponse.status, 200);
        const originalDraft: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalDraftResponse.json());
        assert.ok(
          originalDraft.results.some(
            (item: { documentId: string }): boolean =>
              item.documentId === resource,
          ),
        );
        const originalPublishedResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(originalPublishedResponse.status, 200);
        const originalPublished: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalPublishedResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/database-connection`,
          {
            method: 'POST',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
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
        const draftResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(draftResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await draftResponse.json()),
          originalDraft,
        );
        const publishedResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(publishedResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await publishedResponse.json()),
          originalPublished,
        );
      });
    });
    describe('404', (): void => {
      test('rejects an unknown project', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const project: string = await manager.createPublishedDocument(
          'api::project.project',
          { title: 'Test Project', owner: owner.documentId, collaborators: [] },
          testContext,
        );
        const resource: string = await manager.createPublishedDocument(
          'api::database-connection.database-connection',
          {
            title: 'Original Database',
            project,
            databaseType: 'neo4j',
            connectionUrl: '',
            browserUrl: '',
            database: '',
          },
          testContext,
        );
        const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const filters: Record<string, string> = {
          [`filters[project][documentId][$eq]`]: project,
          pageSize: '100',
          sort: 'documentId:asc',
        };
        const originalDraftResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(originalDraftResponse.status, 200);
        const originalDraft: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalDraftResponse.json());
        assert.ok(
          originalDraft.results.some(
            (item: { documentId: string }): boolean =>
              item.documentId === resource,
          ),
        );
        const originalPublishedResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(originalPublishedResponse.status, 200);
        const originalPublished: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalPublishedResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${randomUUID()}/database-connection`,
          {
            method: 'POST',
            headers: new Headers([
              ['Authorization', `Bearer ${ownerLogin.jwt}`],
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
        const draftResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(draftResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await draftResponse.json()),
          originalDraft,
        );
        const publishedResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(publishedResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await publishedResponse.json()),
          originalPublished,
        );
      });

      test('rejects an unpublished project', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const project: string = await manager.createPublishedDocument(
          'api::project.project',
          { title: 'Test Project', owner: owner.documentId, collaborators: [] },
          testContext,
        );
        const resource: string = await manager.createPublishedDocument(
          'api::database-connection.database-connection',
          {
            title: 'Original Database',
            project,
            databaseType: 'neo4j',
            connectionUrl: '',
            browserUrl: '',
            database: '',
          },
          testContext,
        );
        const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const unpublish: Response = await manager.unpublishDocument(
          'api::project.project',
          project,
          {},
          testContext,
        );
        assert.equal(unpublish.status, 200);
        const draftProject: Response = await manager.readDocument(
          'api::project.project',
          project,
          testContext,
        );
        assert.equal(draftProject.status, 200);
        z.object({ data: z.object({ publishedAt: z.null() }) }).parse(
          await draftProject.json(),
        );
        const filters: Record<string, string> = {
          [`filters[project][documentId][$eq]`]: project,
          pageSize: '100',
          sort: 'documentId:asc',
        };
        const originalDraftResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(originalDraftResponse.status, 200);
        const originalDraft: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalDraftResponse.json());
        assert.ok(
          originalDraft.results.some(
            (item: { documentId: string }): boolean =>
              item.documentId === resource,
          ),
        );
        const originalPublishedResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(originalPublishedResponse.status, 200);
        const originalPublished: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalPublishedResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/database-connection`,
          {
            method: 'POST',
            headers: new Headers([
              ['Authorization', `Bearer ${ownerLogin.jwt}`],
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
        const draftResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(draftResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await draftResponse.json()),
          originalDraft,
        );
        const publishedResponse: Response = await manager.readDocuments(
          'api::database-connection.database-connection',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(publishedResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await publishedResponse.json()),
          originalPublished,
        );
      });
    });
  });
  describe('/test', (): void => {
    describe('POST', (): void => {
      describe('200', (): void => {
        test('owner can test a connection without persisting it', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies TestDatabaseConnectionRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: { success: boolean; message: string } = z
            .strictObject({ success: z.boolean(), message: z.string() })
            .parse(await response.json());
          assert.deepEqual(result, {
            success: true,
            message: 'Success: Nodes: null, Relationships: 7.',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('collaborator can test a connection without persisting it', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [collaborator.documentId],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies TestDatabaseConnectionRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: { success: boolean; message: string } = z
            .strictObject({ success: z.boolean(), message: z.string() })
            .parse(await response.json());
          assert.deepEqual(result, {
            success: true,
            message: 'Success: Nodes: null, Relationships: 7.',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('reports a connection error without changing stored data', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/unavailable/${randomUUID()}`,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies TestDatabaseConnectionRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: { success: boolean; message: string } = z
            .strictObject({ success: z.boolean(), message: z.string() })
            .parse(await response.json());
          assert.equal(result.success, false);
          assert.ok(result.message.length > 0);
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('accepts null optional connection fields', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies TestDatabaseConnectionRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: { success: boolean; message: string } = z
            .strictObject({ success: z.boolean(), message: z.string() })
            .parse(await response.json());
          assert.deepEqual(result, {
            success: true,
            message: 'Success: Nodes: null, Relationships: 7.',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('can test an existing connection in the same project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: resource,
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies TestDatabaseConnectionRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: { success: boolean; message: string } = z
            .strictObject({ success: z.boolean(), message: z.string() })
            .parse(await response.json());
          assert.deepEqual(result, {
            success: true,
            message: 'Success: Nodes: null, Relationships: 7.',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
      });
      describe('400', (): void => {
        test('rejects a malformed connection URL', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: 'invalid-url',
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies TestDatabaseConnectionRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: 'Invalid connection URL.',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an unsupported connection URL protocol', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: 'ftp://example.test/database',
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies TestDatabaseConnectionRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: 'Unsupported connection URL.',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('rejects a missing connectionUrl', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies Omit<
                TestDatabaseConnectionRequestBodyDto,
                'connectionUrl'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('connectionUrl'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('rejects a missing databaseType', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                id: null,
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies Omit<
                TestDatabaseConnectionRequestBodyDto,
                'databaseType'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('databaseType'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('rejects empty connection URL', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: '',
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies TestDatabaseConnectionRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('connectionUrl'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('rejects null connection URL', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: null,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies Omit<
                TestDatabaseConnectionRequestBodyDto,
                'connectionUrl'
              > & { connectionUrl: null }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('connectionUrl'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('rejects non-string connection URL', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: 123,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies Omit<
                TestDatabaseConnectionRequestBodyDto,
                'connectionUrl'
              > & { connectionUrl: number }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('connectionUrl'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('rejects unknown database type', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                databaseType: 'unknown',
                id: null,
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies Omit<
                TestDatabaseConnectionRequestBodyDto,
                'databaseType'
              > & { databaseType: 'unknown' }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('databaseType'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('rejects null database type', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                databaseType: null,
                id: null,
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies Omit<
                TestDatabaseConnectionRequestBodyDto,
                'databaseType'
              > & { databaseType: null }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('databaseType'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('rejects empty identifier', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: '',
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies TestDatabaseConnectionRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('id'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('rejects non-string identifier', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: 123,
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies Omit<TestDatabaseConnectionRequestBodyDto, 'id'> & {
                id: number;
              }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('id'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('rejects empty username', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: '',
                password: null,
                database: null,
                language: null,
              } satisfies TestDatabaseConnectionRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('username'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('rejects non-string username', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: 123,
                password: null,
                database: null,
                language: null,
              } satisfies Omit<
                TestDatabaseConnectionRequestBodyDto,
                'username'
              > & { username: number }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('username'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('rejects non-string password', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: null,
                password: 123,
                database: null,
                language: null,
              } satisfies Omit<
                TestDatabaseConnectionRequestBodyDto,
                'password'
              > & { password: number }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('password'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('rejects non-string database name', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: null,
                password: null,
                database: 123,
                language: null,
              } satisfies Omit<
                TestDatabaseConnectionRequestBodyDto,
                'database'
              > & { database: number }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('database'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('rejects invalid language', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: null,
                password: null,
                database: null,
                language: 'e',
              } satisfies TestDatabaseConnectionRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('language'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('rejects non-string language', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: null,
                password: null,
                database: null,
                language: 123,
              } satisfies Omit<
                TestDatabaseConnectionRequestBodyDto,
                'language'
              > & { language: number }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('language'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('rejects unexpected properties', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: null,
                password: null,
                database: null,
                language: null,
                unexpected: true,
              } satisfies TestDatabaseConnectionRequestBodyDto & {
                unexpected: boolean;
              }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('unexpected'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
      });
      describe('401', (): void => {
        test('rejects anonymous access', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([['Content-Type', 'application/json']]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies TestDatabaseConnectionRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 401);
          assert.equal(response.headers.get('www-authenticate'), 'Bearer');
          assert.deepEqual(await response.json(), {
            statusCode: 401,
            message: 'Unauthorized',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('rejects invalid jwt access', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', 'Bearer invalid-jwt'],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies TestDatabaseConnectionRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 401);
          assert.equal(response.headers.get('www-authenticate'), 'Bearer');
          assert.deepEqual(await response.json(), {
            statusCode: 401,
            message: 'Unauthorized',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
      });

      describe('403', (): void => {
        test('rejects outsider access', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const outsider: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies TestDatabaseConnectionRequestBodyDto),
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
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects removed collaborator access', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [collaborator.documentId],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const removal: Response = await manager.publishDocument(
            'api::project.project',
            project,
            { collaborators: [] },
            testContext,
          );
          assert.equal(removal.status, 200);
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies TestDatabaseConnectionRequestBodyDto),
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
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('rejects draft collaborator access', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const draftAccess: Response = await manager.updateDocument(
            'api::project.project',
            project,
            { collaborators: [collaborator.documentId] },
            testContext,
          );
          assert.equal(draftAccess.status, 200);
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies TestDatabaseConnectionRequestBodyDto),
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
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
      });
      describe('404', (): void => {
        test('rejects a database identifier belonging to another existing project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const otherProject: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Other Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const otherDatabase: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Other Database',
              project: otherProject,
              databaseType: 'neo4j',
            },
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: otherDatabase,
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies TestDatabaseConnectionRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('rejects an unknown project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${randomUUID()}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies TestDatabaseConnectionRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('rejects an unpublished project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const unpublish: Response = await manager.unpublishDocument(
            'api::project.project',
            project,
            {},
            testContext,
          );
          assert.equal(unpublish.status, 200);
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/test`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                connectionUrl: `${manager.getSparqlServer().getServerUrl()}/${randomUUID()}`,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                id: null,
                username: null,
                password: null,
                database: null,
                language: null,
              } satisfies TestDatabaseConnectionRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
      });
    });
  });
  describe('/:databaseConnectionId', (): void => {
    describe('GET', (): void => {
      describe('200', (): void => {
        test('uses the published assignment despite draft reassignment', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const otherProject: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Other Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const draftChange: Response = await manager.updateDocument(
            'api::database-connection.database-connection',
            resource,
            { title: 'Draft Database', project: otherProject },
            testContext,
          );
          assert.equal(draftChange.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'GET',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(projectResponse.status, 200);
          const publishedState: z.infer<typeof projectStateSchema> =
            projectStateSchema.parse(await projectResponse.json());
          const items: DatabaseConnectionDto[] | undefined =
            publishedState.databases;

          const body: DatabaseConnectionDto = databaseSchema.parse(
            await response.json(),
          );
          assert.equal(body.id, resource);
          assert.equal(body.title, 'Original Database');
          assert.deepEqual(
            items.find(
              (item: DatabaseConnectionDto): boolean => item.id === resource,
            ),
            body,
          );
        });

        test('published collaborator retains access after draft removal', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [collaborator.documentId],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const draftRemoval: Response = await manager.updateDocument(
            'api::project.project',
            project,
            { collaborators: [] },
            testContext,
          );
          assert.equal(draftRemoval.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'GET',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(projectResponse.status, 200);
          const publishedState: z.infer<typeof projectStateSchema> =
            projectStateSchema.parse(await projectResponse.json());
          const items: DatabaseConnectionDto[] | undefined =
            publishedState.databases;

          const body: DatabaseConnectionDto = databaseSchema.parse(
            await response.json(),
          );
          assert.equal(body.id, resource);
          assert.equal(body.title, 'Original Database');
          assert.deepEqual(
            items.find(
              (item: DatabaseConnectionDto): boolean => item.id === resource,
            ),
            body,
          );
        });

        test('owner can read a database connection', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'GET',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(projectResponse.status, 200);
          const publishedState: z.infer<typeof projectStateSchema> =
            projectStateSchema.parse(await projectResponse.json());
          const items: DatabaseConnectionDto[] | undefined =
            publishedState.databases;
          const body: DatabaseConnectionDto = databaseSchema.parse(
            await response.json(),
          );
          assert.equal(body.id, resource);
          assert.equal(body.title, 'Original Database');
          assert.deepEqual(
            items.find(
              (item: DatabaseConnectionDto): boolean => item.id === resource,
            ),
            body,
          );
        });

        test('collaborator can read a database connection', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [collaborator.documentId],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'GET',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(projectResponse.status, 200);
          const publishedState: z.infer<typeof projectStateSchema> =
            projectStateSchema.parse(await projectResponse.json());
          const items: DatabaseConnectionDto[] | undefined =
            publishedState.databases;
          const body: DatabaseConnectionDto = databaseSchema.parse(
            await response.json(),
          );
          assert.equal(body.id, resource);
          assert.equal(body.title, 'Original Database');
          assert.deepEqual(
            items.find(
              (item: DatabaseConnectionDto): boolean => item.id === resource,
            ),
            body,
          );
        });
      });
      describe('401', (): void => {
        test('rejects anonymous access', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'GET',
              headers: new Headers([]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 401);
          assert.equal(response.headers.get('www-authenticate'), 'Bearer');
          assert.deepEqual(await response.json(), {
            statusCode: 401,
            message: 'Unauthorized',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('rejects invalid jwt access', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'GET',
              headers: new Headers([['Authorization', 'Bearer invalid-jwt']]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 401);
          assert.equal(response.headers.get('www-authenticate'), 'Bearer');
          assert.deepEqual(await response.json(), {
            statusCode: 401,
            message: 'Unauthorized',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
      });

      describe('403', (): void => {
        test('rejects outsider access', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const outsider: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'GET',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
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
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects removed collaborator access', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [collaborator.documentId],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const removal: Response = await manager.publishDocument(
            'api::project.project',
            project,
            { collaborators: [] },
            testContext,
          );
          assert.equal(removal.status, 200);
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'GET',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
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
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects draft collaborator access', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const draftAccess: Response = await manager.updateDocument(
            'api::project.project',
            project,
            { collaborators: [collaborator.documentId] },
            testContext,
          );
          assert.equal(draftAccess.status, 200);
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'GET',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
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
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
      });
      describe('404', (): void => {
        test('rejects an unknown project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${randomUUID()}/database-connection/${resource}`,
            {
              method: 'GET',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
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
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an unpublished project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const unpublish: Response = await manager.unpublishDocument(
            'api::project.project',
            project,
            {},
            testContext,
          );
          assert.equal(unpublish.status, 200);
          const draftProject: Response = await manager.readDocument(
            'api::project.project',
            project,
            testContext,
          );
          assert.equal(draftProject.status, 200);
          z.object({ data: z.object({ publishedAt: z.null() }) }).parse(
            await draftProject.json(),
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'GET',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
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
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an unknown database connection', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${randomUUID()}`,
            {
              method: 'GET',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
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
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an unpublished database connection', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const unpublish: Response = await manager.unpublishDocument(
            'api::database-connection.database-connection',
            resource,
            {},
            testContext,
          );
          assert.equal(unpublish.status, 200);
          const draftResource: Response = await manager.readDocument(
            'api::database-connection.database-connection',
            resource,
            testContext,
          );
          assert.equal(draftResource.status, 200);
          z.object({ data: z.object({ publishedAt: z.null() }) }).parse(
            await draftResource.json(),
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'GET',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
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
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a database connection belonging to another existing project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const otherProject: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Other Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${otherProject}/database-connection/${resource}`,
            {
              method: 'GET',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
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
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
      });
    });
    describe('PUT', (): void => {
      describe('200', (): void => {
        test('uses the published assignment despite draft reassignment', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const otherProject: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Other Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const draftChange: Response = await manager.updateDocument(
            'api::database-connection.database-connection',
            resource,
            { title: 'Draft Database', project: otherProject },
            testContext,
          );
          assert.equal(draftChange.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: DatabaseConnectionDto = databaseSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Database');
          assert.equal(result.connectionUrl, 'bolt://127.0.0.1:7687');
          assert.equal(result.databaseType, 'neo4j');
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(projectResponse.status, 200);
          const publishedState: z.infer<typeof projectStateSchema> =
            projectStateSchema.parse(await projectResponse.json());
          const items: DatabaseConnectionDto[] | undefined =
            publishedState.databases;

          const persisted: DatabaseConnectionDto | undefined = items.find(
            (item: DatabaseConnectionDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Database');
        });

        test('published collaborator retains access after draft removal', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [collaborator.documentId],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const draftRemoval: Response = await manager.updateDocument(
            'api::project.project',
            project,
            { collaborators: [] },
            testContext,
          );
          assert.equal(draftRemoval.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: DatabaseConnectionDto = databaseSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Database');
          assert.equal(result.connectionUrl, 'bolt://127.0.0.1:7687');
          assert.equal(result.databaseType, 'neo4j');
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(projectResponse.status, 200);
          const publishedState: z.infer<typeof projectStateSchema> =
            projectStateSchema.parse(await projectResponse.json());
          const items: DatabaseConnectionDto[] | undefined =
            publishedState.databases;

          const persisted: DatabaseConnectionDto | undefined = items.find(
            (item: DatabaseConnectionDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Database');
        });

        test('stores credentials only after consent without exposing them in the response', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: true,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
                username: 'alice',
                password: 'secret-value',
              } satisfies UpdateDatabaseConnectionRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: DatabaseConnectionDto = databaseSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Database');
          assert.equal(result.connectionUrl, 'bolt://127.0.0.1:7687');
          assert.equal(result.databaseType, 'neo4j');
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(projectResponse.status, 200);
          const publishedState: z.infer<typeof projectStateSchema> =
            projectStateSchema.parse(await projectResponse.json());
          const items: DatabaseConnectionDto[] | undefined =
            publishedState.databases;

          const persisted: DatabaseConnectionDto | undefined = items.find(
            (item: DatabaseConnectionDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Database');
          const stored: Response = await manager.readDocument(
            'api::database-connection.database-connection',
            resource,
            testContext,
          );
          assert.equal(stored.status, 200);
          const credentials: { data: { username: string; password: string } } =
            z
              .object({
                data: z.object({ username: z.string(), password: z.string() }),
              })
              .parse(await stored.json());
          assert.equal(credentials.data.username, 'alice');
          assert.notEqual(credentials.data.password, 'secret-value');
          const encryptedPassword: z.infer<typeof encryptionPayloadSchema> =
            encryptionPayloadSchema.parse(
              JSON.parse(credentials.data.password),
            );
          assert.equal(
            encryptedPassword.keyId,
            manager.context.encryptionKeys.currentKeyId,
          );
          const encryption: Encryption = new Encryption(
            manager.context.encryptionKeys,
          );
          assert.equal(encryption.decrypt(encryptedPassword), 'secret-value');
        });

        test('preserves omitted credentials without requiring renewed consent', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const credentialSetup: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: true,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
                username: 'alice',
                password: 'stored-secret',
              } satisfies UpdateDatabaseConnectionRequestBodyDto),
              signal: testContext.signal,
            },
          );
          assert.equal(credentialSetup.status, 200);
          const originalCredentialsResponse: Response =
            await manager.readDocument(
              'api::database-connection.database-connection',
              resource,
              testContext,
            );
          assert.equal(originalCredentialsResponse.status, 200);
          const originalCredentials: {
            data: { username: string; password: string };
          } = z
            .object({
              data: z.object({ username: z.string(), password: z.string() }),
            })
            .parse(await originalCredentialsResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: DatabaseConnectionDto = databaseSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Database');
          assert.equal(result.connectionUrl, 'bolt://127.0.0.1:7687');
          assert.equal(result.databaseType, 'neo4j');
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(projectResponse.status, 200);
          const publishedState: z.infer<typeof projectStateSchema> =
            projectStateSchema.parse(await projectResponse.json());
          const items: DatabaseConnectionDto[] | undefined =
            publishedState.databases;

          const persisted: DatabaseConnectionDto | undefined = items.find(
            (item: DatabaseConnectionDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Database');
          const storedCredentialsResponse: Response =
            await manager.readDocument(
              'api::database-connection.database-connection',
              resource,
              testContext,
            );
          assert.equal(storedCredentialsResponse.status, 200);
          const storedCredentials: {
            data: { username: string; password: string };
          } = z
            .object({
              data: z.object({ username: z.string(), password: z.string() }),
            })
            .parse(await storedCredentialsResponse.json());
          assert.deepEqual(storedCredentials, originalCredentials);
        });

        test('preserves null credentials without requiring renewed consent', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const credentialSetup: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: true,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
                username: 'alice',
                password: 'stored-secret',
              } satisfies UpdateDatabaseConnectionRequestBodyDto),
              signal: testContext.signal,
            },
          );
          assert.equal(credentialSetup.status, 200);
          const originalCredentialsResponse: Response =
            await manager.readDocument(
              'api::database-connection.database-connection',
              resource,
              testContext,
            );
          assert.equal(originalCredentialsResponse.status, 200);
          const originalCredentials: {
            data: { username: string; password: string };
          } = z
            .object({
              data: z.object({ username: z.string(), password: z.string() }),
            })
            .parse(await originalCredentialsResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
                username: null,
                password: null,
              } satisfies UpdateDatabaseConnectionRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: DatabaseConnectionDto = databaseSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Database');
          assert.equal(result.connectionUrl, 'bolt://127.0.0.1:7687');
          assert.equal(result.databaseType, 'neo4j');
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(projectResponse.status, 200);
          const publishedState: z.infer<typeof projectStateSchema> =
            projectStateSchema.parse(await projectResponse.json());
          const items: DatabaseConnectionDto[] | undefined =
            publishedState.databases;

          const persisted: DatabaseConnectionDto | undefined = items.find(
            (item: DatabaseConnectionDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Database');
          const storedCredentialsResponse: Response =
            await manager.readDocument(
              'api::database-connection.database-connection',
              resource,
              testContext,
            );
          assert.equal(storedCredentialsResponse.status, 200);
          const storedCredentials: {
            data: { username: string; password: string };
          } = z
            .object({
              data: z.object({ username: z.string(), password: z.string() }),
            })
            .parse(await storedCredentialsResponse.json());
          assert.deepEqual(storedCredentials, originalCredentials);
        });

        test('clears the password with explicit consent', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const credentialSetup: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: true,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
                username: 'alice',
                password: 'stored-secret',
              } satisfies UpdateDatabaseConnectionRequestBodyDto),
              signal: testContext.signal,
            },
          );
          assert.equal(credentialSetup.status, 200);
          const originalCredentialsResponse: Response =
            await manager.readDocument(
              'api::database-connection.database-connection',
              resource,
              testContext,
            );
          assert.equal(originalCredentialsResponse.status, 200);
          const originalCredentials: {
            data: { username: string; password: string };
          } = z
            .object({
              data: z.object({ username: z.string(), password: z.string() }),
            })
            .parse(await originalCredentialsResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: true,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
                password: '',
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: DatabaseConnectionDto = databaseSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Database');
          assert.equal(result.connectionUrl, 'bolt://127.0.0.1:7687');
          assert.equal(result.databaseType, 'neo4j');
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(projectResponse.status, 200);
          const publishedState: z.infer<typeof projectStateSchema> =
            projectStateSchema.parse(await projectResponse.json());
          const items: DatabaseConnectionDto[] | undefined =
            publishedState.databases;

          const persisted: DatabaseConnectionDto | undefined = items.find(
            (item: DatabaseConnectionDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Database');
          const storedCredentialsResponse: Response =
            await manager.readDocument(
              'api::database-connection.database-connection',
              resource,
              testContext,
            );
          assert.equal(storedCredentialsResponse.status, 200);
          const storedCredentials: {
            data: { username: string; password: string };
          } = z
            .object({
              data: z.object({ username: z.string(), password: z.string() }),
            })
            .parse(await storedCredentialsResponse.json());
          assert.equal(storedCredentials.data.username, 'alice');
          assert.notEqual(
            storedCredentials.data.password,
            originalCredentials.data.password,
          );
          encryptionPayloadSchema.parse(
            JSON.parse(storedCredentials.data.password),
          );
        });

        test('persists a new node configuration', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [
                  {
                    id: randomUUID(),
                    type: NodeConfigurationTypeDto.link,
                    label: 'Person',
                    property: 'id',
                    linkTemplate: 'https://example.test/{value}',
                    urlEncode: true,
                    valueRegex: '.*',
                  },
                ],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: DatabaseConnectionDto = databaseSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Database');
          assert.equal(result.connectionUrl, 'bolt://127.0.0.1:7687');
          assert.equal(result.databaseType, 'neo4j');
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(projectResponse.status, 200);
          const publishedState: z.infer<typeof projectStateSchema> =
            projectStateSchema.parse(await projectResponse.json());
          const items: DatabaseConnectionDto[] | undefined =
            publishedState.databases;

          const persisted: DatabaseConnectionDto | undefined = items.find(
            (item: DatabaseConnectionDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Database');
          assert.equal(result.nodeConfigurations.length, 1);
          assert.equal(
            result.nodeConfigurations[0]?.linkTemplate,
            'https://example.test/{value}',
          );
          assert.equal(result.nodeConfigurations[0]?.urlEncode, true);
          assert.deepEqual(persisted, result);
        });

        test('updates an existing node configuration without changing its identifier', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const child: string = await manager.createPublishedDocument(
            'api::node-configuration.node-configuration',
            {
              database: resource,
              type: 'link',
              label: 'Original Label',
              property: 'id',
              linkTemplate: 'https://example.test/{value}',
              urlEncode: false,
              valueRegex: '.*',
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [
                  {
                    id: child,
                    type: NodeConfigurationTypeDto.image,
                    label: 'Person',
                    property: 'id',
                    linkTemplate: 'https://example.test/{value}',
                    urlEncode: true,
                    valueRegex: '.*',
                  },
                ],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: DatabaseConnectionDto = databaseSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Database');
          assert.equal(result.connectionUrl, 'bolt://127.0.0.1:7687');
          assert.equal(result.databaseType, 'neo4j');
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(projectResponse.status, 200);
          const publishedState: z.infer<typeof projectStateSchema> =
            projectStateSchema.parse(await projectResponse.json());
          const items: DatabaseConnectionDto[] | undefined =
            publishedState.databases;

          const persisted: DatabaseConnectionDto | undefined = items.find(
            (item: DatabaseConnectionDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Database');
          assert.equal(result.nodeConfigurations.length, 1);
          assert.equal(result.nodeConfigurations[0]?.id, child);
          assert.equal(
            result.nodeConfigurations[0]?.type,
            NodeConfigurationTypeDto.image,
          );
          assert.deepEqual(persisted, result);
        });

        test('deletes node configurations omitted from the update', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const child: string = await manager.createPublishedDocument(
            'api::node-configuration.node-configuration',
            {
              database: resource,
              type: 'link',
              label: 'Original Label',
              property: 'id',
              linkTemplate: 'https://example.test/{value}',
              urlEncode: false,
              valueRegex: '.*',
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: DatabaseConnectionDto = databaseSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Database');
          assert.equal(result.connectionUrl, 'bolt://127.0.0.1:7687');
          assert.equal(result.databaseType, 'neo4j');
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(projectResponse.status, 200);
          const publishedState: z.infer<typeof projectStateSchema> =
            projectStateSchema.parse(await projectResponse.json());
          const items: DatabaseConnectionDto[] | undefined =
            publishedState.databases;

          const persisted: DatabaseConnectionDto | undefined = items.find(
            (item: DatabaseConnectionDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Database');
          assert.deepEqual(result.nodeConfigurations, []);
          const removedConfiguration: Response = await manager.readDocument(
            'api::node-configuration.node-configuration',
            child,
            testContext,
          );
          assert.equal(removedConfiguration.status, 404);
          assert.deepEqual(persisted, result);
        });

        test('owner can update a database connection', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: DatabaseConnectionDto = databaseSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Database');
          assert.equal(result.connectionUrl, 'bolt://127.0.0.1:7687');
          assert.equal(result.databaseType, 'neo4j');
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(projectResponse.status, 200);
          const publishedState: z.infer<typeof projectStateSchema> =
            projectStateSchema.parse(await projectResponse.json());
          const items: DatabaseConnectionDto[] | undefined =
            publishedState.databases;
          const persisted: DatabaseConnectionDto | undefined = items.find(
            (item: DatabaseConnectionDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Database');
        });

        test('collaborator can update a database connection', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [collaborator.documentId],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: DatabaseConnectionDto = databaseSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Database');
          assert.equal(result.connectionUrl, 'bolt://127.0.0.1:7687');
          assert.equal(result.databaseType, 'neo4j');
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(projectResponse.status, 200);
          const publishedState: z.infer<typeof projectStateSchema> =
            projectStateSchema.parse(await projectResponse.json());
          const items: DatabaseConnectionDto[] | undefined =
            publishedState.databases;
          const persisted: DatabaseConnectionDto | undefined = items.find(
            (item: DatabaseConnectionDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Database');
        });

        test('can change the database type to sparql', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.sparql,
                nodeConfigurations: [],
                language: 'de',
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: DatabaseConnectionDto = databaseSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Database');
          assert.equal(result.connectionUrl, 'bolt://127.0.0.1:7687');
          assert.equal(result.databaseType, 'sparql');
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(projectResponse.status, 200);
          const publishedState: z.infer<typeof projectStateSchema> =
            projectStateSchema.parse(await projectResponse.json());
          const items: DatabaseConnectionDto[] | undefined =
            publishedState.databases;
          const persisted: DatabaseConnectionDto | undefined = items.find(
            (item: DatabaseConnectionDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Database');
        });

        test('can change the database type to wikidata', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.wikidata,
                nodeConfigurations: [],
                language: 'de',
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: DatabaseConnectionDto = databaseSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Database');
          assert.equal(result.connectionUrl, 'bolt://127.0.0.1:7687');
          assert.equal(result.databaseType, 'wikidata');
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(projectResponse.status, 200);
          const publishedState: z.infer<typeof projectStateSchema> =
            projectStateSchema.parse(await projectResponse.json());
          const items: DatabaseConnectionDto[] | undefined =
            publishedState.databases;
          const persisted: DatabaseConnectionDto | undefined = items.find(
            (item: DatabaseConnectionDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Database');
        });
      });
      describe('400', (): void => {
        test('rejects a missing title', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'title' | 'username' | 'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('title'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a null title', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: null,
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'title' | 'username' | 'password'
              > & { title: null }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('title'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an invalid title type', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 123,
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'title' | 'username' | 'password'
              > & { title: number }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('title'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an empty title', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: '',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('title'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a missing database', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password' | 'database'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('database'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a null database', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: null,
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password' | 'database'
              > & { database: null }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('database'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an invalid database type', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 123,
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password' | 'database'
              > & { database: number }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('database'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a missing connectionUrl', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password' | 'connectionUrl'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('connectionUrl'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a null connectionUrl', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: null,
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password' | 'connectionUrl'
              > & { connectionUrl: null }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('connectionUrl'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an invalid connectionUrl type', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 123,
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password' | 'connectionUrl'
              > & { connectionUrl: number }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('connectionUrl'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a missing browserUrl', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password' | 'browserUrl'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('browserUrl'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a null browserUrl', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: null,
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password' | 'browserUrl'
              > & { browserUrl: null }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('browserUrl'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an invalid browserUrl type', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 123,
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password' | 'browserUrl'
              > & { browserUrl: number }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('browserUrl'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a missing credentialStoreConsent', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password' | 'credentialStoreConsent'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('credentialStoreConsent'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a null credentialStoreConsent', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: null,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password' | 'credentialStoreConsent'
              > & { credentialStoreConsent: null }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('credentialStoreConsent'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an invalid credentialStoreConsent type', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: 'true',
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password' | 'credentialStoreConsent'
              > & { credentialStoreConsent: string }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('credentialStoreConsent'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a missing databaseType', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password' | 'databaseType'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('databaseType'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a null databaseType', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: null,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password' | 'databaseType'
              > & { databaseType: null }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('databaseType'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an invalid databaseType type', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: 123,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password' | 'databaseType'
              > & { databaseType: number }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('databaseType'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an unknown databaseType', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: 'unknown',
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password' | 'databaseType'
              > & { databaseType: 'unknown' }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('databaseType'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a missing nodeConfigurations', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password' | 'nodeConfigurations'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('nodeConfigurations'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a null nodeConfigurations', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: null,
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password' | 'nodeConfigurations'
              > & { nodeConfigurations: null }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('nodeConfigurations'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an invalid nodeConfigurations type', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: {},
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password' | 'nodeConfigurations'
              > & { nodeConfigurations: Record<string, never> }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('nodeConfigurations'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects unexpected properties', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
                unexpected: true,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              > & { unexpected: boolean }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('unexpected'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects username when empty', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
                username: '',
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('username'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects username with a non-string value', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
                username: 123,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              > & { username: number }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('username'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects password with a non-string value', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
                password: 123,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              > & { password: number }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('password'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects language with an invalid language code', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: 'e',
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('language'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects language with a non-string value', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: 123,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password' | 'language'
              > & { language: number }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('language'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects unknown node configuration type', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [
                  {
                    id: randomUUID(),
                    type: 'unknown',
                    label: 'Person',
                    property: 'id',
                    linkTemplate: 'https://example.test/{value}',
                    urlEncode: true,
                    valueRegex: '.*',
                  },
                ],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password' | 'nodeConfigurations'
              > & {
                nodeConfigurations: (Omit<
                  UpdateNodeConfigurationRequestBodyDto,
                  'type'
                > & { type: 'unknown' })[];
              }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('nodeConfigurations'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects empty node configuration identifier', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [
                  {
                    id: '',
                    type: NodeConfigurationTypeDto.link,
                    label: 'Person',
                    property: 'id',
                    linkTemplate: 'https://example.test/{value}',
                    urlEncode: true,
                    valueRegex: '.*',
                  },
                ],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('nodeConfigurations'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects non-boolean URL encoding', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [
                  {
                    id: randomUUID(),
                    type: NodeConfigurationTypeDto.link,
                    label: 'Person',
                    property: 'id',
                    linkTemplate: 'https://example.test/{value}',
                    urlEncode: 'true',
                    valueRegex: '.*',
                  },
                ],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password' | 'nodeConfigurations'
              > & {
                nodeConfigurations: (Omit<
                  UpdateNodeConfigurationRequestBodyDto,
                  'urlEncode'
                > & { urlEncode: string })[];
              }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('nodeConfigurations'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects invalid regular expression', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [
                  {
                    id: randomUUID(),
                    type: NodeConfigurationTypeDto.link,
                    label: 'Person',
                    property: 'id',
                    linkTemplate: 'https://example.test/{value}',
                    urlEncode: true,
                    valueRegex: '[',
                  },
                ],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('nodeConfigurations'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects unexpected node configuration property', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [
                  {
                    id: randomUUID(),
                    type: NodeConfigurationTypeDto.link,
                    label: 'Person',
                    property: 'id',
                    linkTemplate: 'https://example.test/{value}',
                    urlEncode: true,
                    valueRegex: '.*',
                    unexpected: true,
                  },
                ],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password' | 'nodeConfigurations'
              > & {
                nodeConfigurations: (UpdateNodeConfigurationRequestBodyDto & {
                  unexpected: boolean;
                })[];
              }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const error: {
            statusCode: number;
            message: string[];
            error: string;
          } = z
            .object({
              statusCode: z.literal(400),
              message: z.array(z.string()),
              error: z.literal('Bad Request'),
            })
            .parse(await response.json());
          assert.ok(
            error.message.some((message: string): boolean =>
              message.includes('nodeConfigurations'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects username without consent', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
                username: 'alice',
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            message: 'Consent required.',
            error: 'Bad Request',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects password without consent', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
                password: 'secret',
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            message: 'Consent required.',
            error: 'Bad Request',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects empty password without consent', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
                password: '',
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            message: 'Consent required.',
            error: 'Bad Request',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
      });
      describe('401', (): void => {
        test('rejects anonymous access', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([['Content-Type', 'application/json']]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 401);
          assert.equal(response.headers.get('www-authenticate'), 'Bearer');
          assert.deepEqual(await response.json(), {
            statusCode: 401,
            message: 'Unauthorized',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('rejects invalid jwt access', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', 'Bearer invalid-jwt'],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 401);
          assert.equal(response.headers.get('www-authenticate'), 'Bearer');
          assert.deepEqual(await response.json(), {
            statusCode: 401,
            message: 'Unauthorized',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
      });

      describe('403', (): void => {
        test('rejects outsider access', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const outsider: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
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
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects removed collaborator access', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [collaborator.documentId],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const removal: Response = await manager.publishDocument(
            'api::project.project',
            project,
            { collaborators: [] },
            testContext,
          );
          assert.equal(removal.status, 200);
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
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
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects draft collaborator access', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const draftAccess: Response = await manager.updateDocument(
            'api::project.project',
            project,
            { collaborators: [collaborator.documentId] },
            testContext,
          );
          assert.equal(draftAccess.status, 200);
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
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
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
      });
      describe('404', (): void => {
        test('rejects an unknown project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${randomUUID()}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an unpublished project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const unpublish: Response = await manager.unpublishDocument(
            'api::project.project',
            project,
            {},
            testContext,
          );
          assert.equal(unpublish.status, 200);
          const draftProject: Response = await manager.readDocument(
            'api::project.project',
            project,
            testContext,
          );
          assert.equal(draftProject.status, 200);
          z.object({ data: z.object({ publishedAt: z.null() }) }).parse(
            await draftProject.json(),
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an unknown database connection', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${randomUUID()}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an unpublished database connection', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const unpublish: Response = await manager.unpublishDocument(
            'api::database-connection.database-connection',
            resource,
            {},
            testContext,
          );
          assert.equal(unpublish.status, 200);
          const draftResource: Response = await manager.readDocument(
            'api::database-connection.database-connection',
            resource,
            testContext,
          );
          assert.equal(draftResource.status, 200);
          z.object({ data: z.object({ publishedAt: z.null() }) }).parse(
            await draftResource.json(),
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a database connection belonging to another existing project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const otherProject: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Other Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${otherProject}/database-connection/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Database',
                database: 'neo4j',
                connectionUrl: 'bolt://127.0.0.1:7687',
                browserUrl: 'https://example.test/browser',
                credentialStoreConsent: false,
                databaseType: DatabaseConnectionDatabaseType.neo4j,
                nodeConfigurations: [],
                language: null,
              } satisfies Omit<
                UpdateDatabaseConnectionRequestBodyDto,
                'username' | 'password'
              >),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
      });
    });
    describe('DELETE', (): void => {
      describe('204', (): void => {
        test('uses the published assignment despite draft reassignment', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const otherProject: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Other Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const draftChange: Response = await manager.updateDocument(
            'api::database-connection.database-connection',
            resource,
            { title: 'Draft Database', project: otherProject },
            testContext,
          );
          assert.equal(draftChange.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'DELETE',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(projectResponse.status, 200);
          const publishedState: z.infer<typeof projectStateSchema> =
            projectStateSchema.parse(await projectResponse.json());
          const items: DatabaseConnectionDto[] | undefined =
            publishedState.databases;

          assert.equal(
            items.some(
              (item: DatabaseConnectionDto): boolean => item.id === resource,
            ),
            false,
          );
          const stored: Response = await manager.readDocument(
            'api::database-connection.database-connection',
            resource,
            testContext,
          );
          assert.equal(stored.status, 404);
        });

        test('preserves a database connection outside the targeted parent', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const otherProject: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Other Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const control: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Unrelated Database',
              project: otherProject,
              databaseType: 'neo4j',
            },
            testContext,
          );
          const originalControlResponse: Response = await manager.readDocument(
            'api::database-connection.database-connection',
            control,
            testContext,
          );
          assert.equal(originalControlResponse.status, 200);
          const originalControl: unknown = await originalControlResponse.json();
          z.object({
            data: z.object({ documentId: z.literal(control) }),
          }).parse(originalControl);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'DELETE',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(projectResponse.status, 200);
          const publishedState: z.infer<typeof projectStateSchema> =
            projectStateSchema.parse(await projectResponse.json());
          const items: DatabaseConnectionDto[] | undefined =
            publishedState.databases;

          assert.equal(
            items.some(
              (item: DatabaseConnectionDto): boolean => item.id === resource,
            ),
            false,
          );
          const stored: Response = await manager.readDocument(
            'api::database-connection.database-connection',
            resource,
            testContext,
          );
          assert.equal(stored.status, 404);
          const controlResponse: Response = await manager.readDocument(
            'api::database-connection.database-connection',
            control,
            testContext,
          );
          assert.equal(controlResponse.status, 200);
          assert.deepEqual(await controlResponse.json(), originalControl);
        });

        test('published collaborator retains access after draft removal', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [collaborator.documentId],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const draftRemoval: Response = await manager.updateDocument(
            'api::project.project',
            project,
            { collaborators: [] },
            testContext,
          );
          assert.equal(draftRemoval.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(projectResponse.status, 200);
          const publishedState: z.infer<typeof projectStateSchema> =
            projectStateSchema.parse(await projectResponse.json());
          const items: DatabaseConnectionDto[] | undefined =
            publishedState.databases;

          assert.equal(
            items.some(
              (item: DatabaseConnectionDto): boolean => item.id === resource,
            ),
            false,
          );
          const stored: Response = await manager.readDocument(
            'api::database-connection.database-connection',
            resource,
            testContext,
          );
          assert.equal(stored.status, 404);
        });

        test('owner can delete a database connection', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'DELETE',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(projectResponse.status, 200);
          const publishedState: z.infer<typeof projectStateSchema> =
            projectStateSchema.parse(await projectResponse.json());
          const items: DatabaseConnectionDto[] | undefined =
            publishedState.databases;
          assert.equal(
            items.some(
              (item: DatabaseConnectionDto): boolean => item.id === resource,
            ),
            false,
          );
          const stored: Response = await manager.readDocument(
            'api::database-connection.database-connection',
            resource,
            testContext,
          );
          assert.equal(stored.status, 404);
        });

        test('collaborator can delete a database connection', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [collaborator.documentId],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(projectResponse.status, 200);
          const publishedState: z.infer<typeof projectStateSchema> =
            projectStateSchema.parse(await projectResponse.json());
          const items: DatabaseConnectionDto[] | undefined =
            publishedState.databases;
          assert.equal(
            items.some(
              (item: DatabaseConnectionDto): boolean => item.id === resource,
            ),
            false,
          );
          const stored: Response = await manager.readDocument(
            'api::database-connection.database-connection',
            resource,
            testContext,
          );
          assert.equal(stored.status, 404);
        });
      });
      describe('401', (): void => {
        test('rejects anonymous access', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'DELETE',
              headers: new Headers([]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 401);
          assert.equal(response.headers.get('www-authenticate'), 'Bearer');
          assert.deepEqual(await response.json(), {
            statusCode: 401,
            message: 'Unauthorized',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
        test('rejects invalid jwt access', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', 'Bearer invalid-jwt']]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 401);
          assert.equal(response.headers.get('www-authenticate'), 'Bearer');
          assert.deepEqual(await response.json(), {
            statusCode: 401,
            message: 'Unauthorized',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
      });

      describe('403', (): void => {
        test('rejects outsider access', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const outsider: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
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
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects removed collaborator access', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [collaborator.documentId],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const removal: Response = await manager.publishDocument(
            'api::project.project',
            project,
            { collaborators: [] },
            testContext,
          );
          assert.equal(removal.status, 200);
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
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
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects draft collaborator access', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const draftAccess: Response = await manager.updateDocument(
            'api::project.project',
            project,
            { collaborators: [collaborator.documentId] },
            testContext,
          );
          assert.equal(draftAccess.status, 200);
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
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
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
      });
      describe('404', (): void => {
        test('rejects an unknown project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${randomUUID()}/database-connection/${resource}`,
            {
              method: 'DELETE',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
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
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an unpublished project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const unpublish: Response = await manager.unpublishDocument(
            'api::project.project',
            project,
            {},
            testContext,
          );
          assert.equal(unpublish.status, 200);
          const draftProject: Response = await manager.readDocument(
            'api::project.project',
            project,
            testContext,
          );
          assert.equal(draftProject.status, 200);
          z.object({ data: z.object({ publishedAt: z.null() }) }).parse(
            await draftProject.json(),
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'DELETE',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
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
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an unknown database connection', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${randomUUID()}`,
            {
              method: 'DELETE',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
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
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an unpublished database connection', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const unpublish: Response = await manager.unpublishDocument(
            'api::database-connection.database-connection',
            resource,
            {},
            testContext,
          );
          assert.equal(unpublish.status, 200);
          const draftResource: Response = await manager.readDocument(
            'api::database-connection.database-connection',
            resource,
            testContext,
          );
          assert.equal(draftResource.status, 200);
          z.object({ data: z.object({ publishedAt: z.null() }) }).parse(
            await draftResource.json(),
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/database-connection/${resource}`,
            {
              method: 'DELETE',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
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
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a database connection belonging to another existing project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Test Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Original Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: '',
              browserUrl: '',
              database: '',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const otherProject: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Other Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(originalDraftResponse.status, 200);
          const originalDraft: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalDraftResponse.json());
          assert.ok(
            originalDraft.results.some(
              (item: { documentId: string }): boolean =>
                item.documentId === resource,
            ),
          );
          const originalPublishedResponse: Response =
            await manager.readDocuments(
              'api::database-connection.database-connection',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${otherProject}/database-connection/${resource}`,
            {
              method: 'DELETE',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
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
          const draftResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::database-connection.database-connection',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });
      });
    });
  });
});
