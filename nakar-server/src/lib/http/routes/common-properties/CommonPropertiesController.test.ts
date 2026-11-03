import type { UpdateCommonPropertyRequestBodyDto } from './dto/UpdateCommonPropertyRequestBodyDto';
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
import type { CommonPropertyDto } from '../../../schema/dtos/CommonPropertyDto';

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
const commonPropertySchema: z.ZodType<CommonPropertyDto> = z.strictObject({
  id: z.string().min(1),
  leftLabel: z.string(),
  leftProperty: z.string(),
  rightLabel: z.string(),
  rightProperty: z.string(),
  leftDatabase: databaseSchema.nullable(),
  rightDatabase: databaseSchema.nullable(),
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
const projectStateSchema: z.ZodType<{ commonProperties: CommonPropertyDto[] }> =
  z.object({ commonProperties: z.array(commonPropertySchema) });
describe('/project/:projectId/common-property', (suiteContext: SuiteContext): void => {
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
          'api::common-property.common-property',
          {
            project,
            leftLabel: 'Original Label',
            leftProperty: 'original',
            rightLabel: 'Other Label',
            rightProperty: 'other',
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
          `${manager.apiUrl}/project/${project}/common-property`,
          {
            method: 'POST',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 201);
        const body: CommonPropertyDto = commonPropertySchema.parse(
          await response.json(),
        );
        assert.notEqual(body.id, resource);
        assert.deepEqual(body, {
          id: body.id,
          leftLabel: '',
          leftProperty: '',
          rightLabel: '',
          rightProperty: '',
          leftDatabase: null,
          rightDatabase: null,
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
        const items: CommonPropertyDto[] | undefined =
          publishedState.commonProperties;

        assert.deepEqual(
          items.find((item: CommonPropertyDto): boolean => item.id === body.id),
          body,
        );
      });

      test('owner can create a common property', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const project: string = await manager.createPublishedDocument(
          'api::project.project',
          { title: 'Test Project', owner: owner.documentId, collaborators: [] },
          testContext,
        );
        const resource: string = await manager.createPublishedDocument(
          'api::common-property.common-property',
          {
            project,
            leftLabel: 'Original Label',
            leftProperty: 'original',
            rightLabel: 'Other Label',
            rightProperty: 'other',
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
          `${manager.apiUrl}/project/${project}/common-property`,
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
        const body: CommonPropertyDto = commonPropertySchema.parse(
          await response.json(),
        );
        assert.notEqual(body.id, resource);
        assert.deepEqual(body, {
          id: body.id,
          leftLabel: '',
          leftProperty: '',
          rightLabel: '',
          rightProperty: '',
          leftDatabase: null,
          rightDatabase: null,
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
        const items: CommonPropertyDto[] | undefined =
          publishedState.commonProperties;
        assert.deepEqual(
          items.find((item: CommonPropertyDto): boolean => item.id === body.id),
          body,
        );
      });

      test('collaborator can create a common property', async (testContext: TestContext): Promise<void> => {
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
          'api::common-property.common-property',
          {
            project,
            leftLabel: 'Original Label',
            leftProperty: 'original',
            rightLabel: 'Other Label',
            rightProperty: 'other',
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
          `${manager.apiUrl}/project/${project}/common-property`,
          {
            method: 'POST',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 201);
        const body: CommonPropertyDto = commonPropertySchema.parse(
          await response.json(),
        );
        assert.notEqual(body.id, resource);
        assert.deepEqual(body, {
          id: body.id,
          leftLabel: '',
          leftProperty: '',
          rightLabel: '',
          rightProperty: '',
          leftDatabase: null,
          rightDatabase: null,
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
        const items: CommonPropertyDto[] | undefined =
          publishedState.commonProperties;
        assert.deepEqual(
          items.find((item: CommonPropertyDto): boolean => item.id === body.id),
          body,
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
          'api::common-property.common-property',
          {
            project,
            leftLabel: 'Original Label',
            leftProperty: 'original',
            rightLabel: 'Other Label',
            rightProperty: 'other',
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
          'api::common-property.common-property',
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
          'api::common-property.common-property',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(originalPublishedResponse.status, 200);
        const originalPublished: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalPublishedResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/common-property`,
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
          'api::common-property.common-property',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(draftResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await draftResponse.json()),
          originalDraft,
        );
        const publishedResponse: Response = await manager.readDocuments(
          'api::common-property.common-property',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(publishedResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await publishedResponse.json()),
          originalPublished,
        );
      });

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
          'api::common-property.common-property',
          {
            project,
            leftLabel: 'Original Label',
            leftProperty: 'original',
            rightLabel: 'Other Label',
            rightProperty: 'other',
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
          'api::common-property.common-property',
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
          'api::common-property.common-property',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(originalPublishedResponse.status, 200);
        const originalPublished: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalPublishedResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/common-property`,
          {
            method: 'POST',
            headers: new Headers([]),
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
          'api::common-property.common-property',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(draftResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await draftResponse.json()),
          originalDraft,
        );
        const publishedResponse: Response = await manager.readDocuments(
          'api::common-property.common-property',
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
          'api::common-property.common-property',
          {
            project,
            leftLabel: 'Original Label',
            leftProperty: 'original',
            rightLabel: 'Other Label',
            rightProperty: 'other',
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
          'api::common-property.common-property',
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
          'api::common-property.common-property',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(originalPublishedResponse.status, 200);
        const originalPublished: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalPublishedResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/common-property`,
          {
            method: 'POST',
            headers: new Headers([['Authorization', 'Bearer invalid-jwt']]),
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
          'api::common-property.common-property',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(draftResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await draftResponse.json()),
          originalDraft,
        );
        const publishedResponse: Response = await manager.readDocuments(
          'api::common-property.common-property',
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
          'api::common-property.common-property',
          {
            project,
            leftLabel: 'Original Label',
            leftProperty: 'original',
            rightLabel: 'Other Label',
            rightProperty: 'other',
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
          'api::common-property.common-property',
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
          'api::common-property.common-property',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(originalPublishedResponse.status, 200);
        const originalPublished: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalPublishedResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/common-property`,
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
          'api::common-property.common-property',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(draftResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await draftResponse.json()),
          originalDraft,
        );
        const publishedResponse: Response = await manager.readDocuments(
          'api::common-property.common-property',
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
          'api::common-property.common-property',
          {
            project,
            leftLabel: 'Original Label',
            leftProperty: 'original',
            rightLabel: 'Other Label',
            rightProperty: 'other',
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
          'api::common-property.common-property',
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
          'api::common-property.common-property',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(originalPublishedResponse.status, 200);
        const originalPublished: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalPublishedResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/common-property`,
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
          'api::common-property.common-property',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(draftResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await draftResponse.json()),
          originalDraft,
        );
        const publishedResponse: Response = await manager.readDocuments(
          'api::common-property.common-property',
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
          'api::common-property.common-property',
          {
            project,
            leftLabel: 'Original Label',
            leftProperty: 'original',
            rightLabel: 'Other Label',
            rightProperty: 'other',
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
          'api::common-property.common-property',
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
          'api::common-property.common-property',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(originalPublishedResponse.status, 200);
        const originalPublished: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalPublishedResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${randomUUID()}/common-property`,
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
          'api::common-property.common-property',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(draftResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await draftResponse.json()),
          originalDraft,
        );
        const publishedResponse: Response = await manager.readDocuments(
          'api::common-property.common-property',
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
          'api::common-property.common-property',
          {
            project,
            leftLabel: 'Original Label',
            leftProperty: 'original',
            rightLabel: 'Other Label',
            rightProperty: 'other',
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
          'api::common-property.common-property',
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
          'api::common-property.common-property',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(originalPublishedResponse.status, 200);
        const originalPublished: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalPublishedResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/common-property`,
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
          'api::common-property.common-property',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(draftResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await draftResponse.json()),
          originalDraft,
        );
        const publishedResponse: Response = await manager.readDocuments(
          'api::common-property.common-property',
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
  describe('/:commonPropertyId', (): void => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
            resource,
            { leftLabel: 'Draft Label', project: otherProject },
            testContext,
          );
          assert.equal(draftChange.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies UpdateCommonPropertyRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
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
          const items: CommonPropertyDto[] | undefined =
            publishedState.commonProperties;

          const persisted: CommonPropertyDto | undefined = items.find(
            (item: CommonPropertyDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.leftLabel, 'Person');
          assert.equal(persisted.leftProperty, 'name');
          assert.equal(persisted.rightLabel, 'Human');
          assert.equal(persisted.rightProperty, 'label');
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies UpdateCommonPropertyRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
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
          const items: CommonPropertyDto[] | undefined =
            publishedState.commonProperties;

          const persisted: CommonPropertyDto | undefined = items.find(
            (item: CommonPropertyDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.leftLabel, 'Person');
          assert.equal(persisted.leftProperty, 'name');
          assert.equal(persisted.rightLabel, 'Human');
          assert.equal(persisted.rightProperty, 'label');
        });

        test('links databases belonging to the project', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const leftDatabase: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            { title: 'Left Database', project, databaseType: 'neo4j' },
            testContext,
          );
          const rightDatabase: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            { title: 'Right Database', project, databaseType: 'sparql' },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: leftDatabase,
                rightDatabaseId: rightDatabase,
              } satisfies UpdateCommonPropertyRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
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
          const items: CommonPropertyDto[] | undefined =
            publishedState.commonProperties;

          const persisted: CommonPropertyDto | undefined = items.find(
            (item: CommonPropertyDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.leftLabel, 'Person');
          assert.equal(persisted.leftProperty, 'name');
          assert.equal(persisted.rightLabel, 'Human');
          assert.equal(persisted.rightProperty, 'label');
          assert.equal(persisted.leftDatabase?.id, leftDatabase);
          assert.equal(persisted.rightDatabase?.id, rightDatabase);
        });

        test('clears existing database relations with empty identifiers', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const leftDatabase: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            { title: 'Left Database', project, databaseType: 'neo4j' },
            testContext,
          );
          const rightDatabase: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            { title: 'Right Database', project, databaseType: 'sparql' },
            testContext,
          );
          const assignment: Response = await manager.publishDocument(
            'api::common-property.common-property',
            resource,
            { leftDatabase, rightDatabase },
            testContext,
          );
          assert.equal(assignment.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies UpdateCommonPropertyRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
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
          const items: CommonPropertyDto[] | undefined =
            publishedState.commonProperties;

          const persisted: CommonPropertyDto | undefined = items.find(
            (item: CommonPropertyDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.leftLabel, 'Person');
          assert.equal(persisted.leftProperty, 'name');
          assert.equal(persisted.rightLabel, 'Human');
          assert.equal(persisted.rightProperty, 'label');
          assert.equal(persisted.leftDatabase, null);
          assert.equal(persisted.rightDatabase, null);
        });

        test('owner can update a common property', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies UpdateCommonPropertyRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
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
          const items: CommonPropertyDto[] | undefined =
            publishedState.commonProperties;
          const persisted: CommonPropertyDto | undefined = items.find(
            (item: CommonPropertyDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.leftLabel, 'Person');
          assert.equal(persisted.leftProperty, 'name');
          assert.equal(persisted.rightLabel, 'Human');
          assert.equal(persisted.rightProperty, 'label');
        });

        test('collaborator can update a common property', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies UpdateCommonPropertyRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
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
          const items: CommonPropertyDto[] | undefined =
            publishedState.commonProperties;
          const persisted: CommonPropertyDto | undefined = items.find(
            (item: CommonPropertyDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.leftLabel, 'Person');
          assert.equal(persisted.leftProperty, 'name');
          assert.equal(persisted.rightLabel, 'Human');
          assert.equal(persisted.rightProperty, 'label');
        });

        test('accepts empty property fields and clears database relations', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: '',
                leftProperty: '',
                rightLabel: '',
                rightProperty: '',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies UpdateCommonPropertyRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
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
          const items: CommonPropertyDto[] | undefined =
            publishedState.commonProperties;
          const persisted: CommonPropertyDto | undefined = items.find(
            (item: CommonPropertyDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.leftLabel, '');
          assert.equal(persisted.leftProperty, '');
          assert.equal(persisted.rightLabel, '');
          assert.equal(persisted.rightProperty, '');
        });
      });
      describe('400', (): void => {
        test('rejects a missing leftLabel', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies Omit<
                UpdateCommonPropertyRequestBodyDto,
                'leftLabel'
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
              message.includes('leftLabel'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a null leftLabel', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: null,
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies Omit<
                UpdateCommonPropertyRequestBodyDto,
                'leftLabel'
              > & {
                leftLabel: null;
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
              message.includes('leftLabel'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an invalid leftLabel type', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 123,
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies Omit<
                UpdateCommonPropertyRequestBodyDto,
                'leftLabel'
              > & {
                leftLabel: number;
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
              message.includes('leftLabel'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a missing leftProperty', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies Omit<
                UpdateCommonPropertyRequestBodyDto,
                'leftProperty'
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
              message.includes('leftProperty'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a null leftProperty', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: null,
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies Omit<
                UpdateCommonPropertyRequestBodyDto,
                'leftProperty'
              > & { leftProperty: null }),
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
              message.includes('leftProperty'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an invalid leftProperty type', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 123,
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies Omit<
                UpdateCommonPropertyRequestBodyDto,
                'leftProperty'
              > & { leftProperty: number }),
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
              message.includes('leftProperty'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a missing rightLabel', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies Omit<
                UpdateCommonPropertyRequestBodyDto,
                'rightLabel'
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
              message.includes('rightLabel'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a null rightLabel', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: null,
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies Omit<
                UpdateCommonPropertyRequestBodyDto,
                'rightLabel'
              > & {
                rightLabel: null;
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
              message.includes('rightLabel'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an invalid rightLabel type', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 123,
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies Omit<
                UpdateCommonPropertyRequestBodyDto,
                'rightLabel'
              > & {
                rightLabel: number;
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
              message.includes('rightLabel'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a missing rightProperty', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies Omit<
                UpdateCommonPropertyRequestBodyDto,
                'rightProperty'
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
              message.includes('rightProperty'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a null rightProperty', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: null,
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies Omit<
                UpdateCommonPropertyRequestBodyDto,
                'rightProperty'
              > & { rightProperty: null }),
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
              message.includes('rightProperty'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an invalid rightProperty type', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 123,
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies Omit<
                UpdateCommonPropertyRequestBodyDto,
                'rightProperty'
              > & { rightProperty: number }),
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
              message.includes('rightProperty'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a missing leftDatabaseId', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                rightDatabaseId: '',
              } satisfies Omit<
                UpdateCommonPropertyRequestBodyDto,
                'leftDatabaseId'
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
              message.includes('leftDatabaseId'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a null leftDatabaseId', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: null,
                rightDatabaseId: '',
              } satisfies Omit<
                UpdateCommonPropertyRequestBodyDto,
                'leftDatabaseId'
              > & { leftDatabaseId: null }),
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
              message.includes('leftDatabaseId'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an invalid leftDatabaseId type', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: 123,
                rightDatabaseId: '',
              } satisfies Omit<
                UpdateCommonPropertyRequestBodyDto,
                'leftDatabaseId'
              > & { leftDatabaseId: number }),
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
              message.includes('leftDatabaseId'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a missing rightDatabaseId', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
              } satisfies Omit<
                UpdateCommonPropertyRequestBodyDto,
                'rightDatabaseId'
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
              message.includes('rightDatabaseId'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a null rightDatabaseId', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: null,
              } satisfies Omit<
                UpdateCommonPropertyRequestBodyDto,
                'rightDatabaseId'
              > & { rightDatabaseId: null }),
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
              message.includes('rightDatabaseId'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an invalid rightDatabaseId type', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: 123,
              } satisfies Omit<
                UpdateCommonPropertyRequestBodyDto,
                'rightDatabaseId'
              > & { rightDatabaseId: number }),
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
              message.includes('rightDatabaseId'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
                unexpected: true,
              } satisfies UpdateCommonPropertyRequestBodyDto & {
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies UpdateCommonPropertyRequestBodyDto),
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([['Content-Type', 'application/json']]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies UpdateCommonPropertyRequestBodyDto),
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', 'Bearer invalid-jwt'],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies UpdateCommonPropertyRequestBodyDto),
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies UpdateCommonPropertyRequestBodyDto),
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies UpdateCommonPropertyRequestBodyDto),
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
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
        test('rejects an unknown left database', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = randomUUID();
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: database,
                rightDatabaseId: '',
              } satisfies UpdateCommonPropertyRequestBodyDto),
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an unpublished left database', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Referenced Database',
              project: project,
              databaseType: 'neo4j',
            },
            testContext,
          );
          const unpublish: Response = await manager.unpublishDocument(
            'api::database-connection.database-connection',
            database,
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: database,
                rightDatabaseId: '',
              } satisfies UpdateCommonPropertyRequestBodyDto),
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an foreign left database', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Referenced Database',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: database,
                rightDatabaseId: '',
              } satisfies UpdateCommonPropertyRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: `Database ${database} not found.`,
            error: 'Not Found',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an unknown right database', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = randomUUID();
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: project,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: database,
              } satisfies UpdateCommonPropertyRequestBodyDto),
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an unpublished right database', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Referenced Database',
              project: project,
              databaseType: 'neo4j',
            },
            testContext,
          );
          const unpublish: Response = await manager.unpublishDocument(
            'api::database-connection.database-connection',
            database,
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: database,
              } satisfies UpdateCommonPropertyRequestBodyDto),
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an foreign right database', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Referenced Database',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: database,
              } satisfies UpdateCommonPropertyRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: `Database ${database} not found.`,
            error: 'Not Found',
          });
          const draftResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${randomUUID()}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies UpdateCommonPropertyRequestBodyDto),
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies UpdateCommonPropertyRequestBodyDto),
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an unknown common property', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${randomUUID()}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies UpdateCommonPropertyRequestBodyDto),
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an unpublished common property', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const unpublish: Response = await manager.unpublishDocument(
            'api::common-property.common-property',
            resource,
            {},
            testContext,
          );
          assert.equal(unpublish.status, 200);
          const draftResource: Response = await manager.readDocument(
            'api::common-property.common-property',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies UpdateCommonPropertyRequestBodyDto),
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a common property belonging to another existing project', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${otherProject}/common-property/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                leftLabel: 'Person',
                leftProperty: 'name',
                rightLabel: 'Human',
                rightProperty: 'label',
                leftDatabaseId: '',
                rightDatabaseId: '',
              } satisfies UpdateCommonPropertyRequestBodyDto),
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
            resource,
            { leftLabel: 'Draft Label', project: otherProject },
            testContext,
          );
          assert.equal(draftChange.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'DELETE',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
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
          const items: CommonPropertyDto[] | undefined =
            publishedState.commonProperties;

          assert.equal(
            items.some(
              (item: CommonPropertyDto): boolean => item.id === resource,
            ),
            false,
          );
          const stored: Response = await manager.readDocument(
            'api::common-property.common-property',
            resource,
            testContext,
          );
          assert.equal(stored.status, 404);
        });

        test('preserves a common property outside the targeted parent', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
            { project: otherProject, leftLabel: 'Unrelated' },
            testContext,
          );
          const originalControlResponse: Response = await manager.readDocument(
            'api::common-property.common-property',
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
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'DELETE',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
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
          const items: CommonPropertyDto[] | undefined =
            publishedState.commonProperties;

          assert.equal(
            items.some(
              (item: CommonPropertyDto): boolean => item.id === resource,
            ),
            false,
          );
          const stored: Response = await manager.readDocument(
            'api::common-property.common-property',
            resource,
            testContext,
          );
          assert.equal(stored.status, 404);
          const controlResponse: Response = await manager.readDocument(
            'api::common-property.common-property',
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
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
          const items: CommonPropertyDto[] | undefined =
            publishedState.commonProperties;

          assert.equal(
            items.some(
              (item: CommonPropertyDto): boolean => item.id === resource,
            ),
            false,
          );
          const stored: Response = await manager.readDocument(
            'api::common-property.common-property',
            resource,
            testContext,
          );
          assert.equal(stored.status, 404);
        });

        test('owner can delete a common property', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'DELETE',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
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
          const items: CommonPropertyDto[] | undefined =
            publishedState.commonProperties;
          assert.equal(
            items.some(
              (item: CommonPropertyDto): boolean => item.id === resource,
            ),
            false,
          );
          const stored: Response = await manager.readDocument(
            'api::common-property.common-property',
            resource,
            testContext,
          );
          assert.equal(stored.status, 404);
        });

        test('collaborator can delete a common property', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
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
          const items: CommonPropertyDto[] | undefined =
            publishedState.commonProperties;
          assert.equal(
            items.some(
              (item: CommonPropertyDto): boolean => item.id === resource,
            ),
            false,
          );
          const stored: Response = await manager.readDocument(
            'api::common-property.common-property',
            resource,
            testContext,
          );
          assert.equal(stored.status, 404);
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'DELETE',
              headers: new Headers([]),
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', 'Bearer invalid-jwt']]),
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${randomUUID()}/common-property/${resource}`,
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an unknown common property', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${randomUUID()}`,
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an unpublished common property', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const unpublish: Response = await manager.unpublishDocument(
            'api::common-property.common-property',
            resource,
            {},
            testContext,
          );
          assert.equal(unpublish.status, 200);
          const draftResource: Response = await manager.readDocument(
            'api::common-property.common-property',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/common-property/${resource}`,
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a common property belonging to another existing project', async (testContext: TestContext): Promise<void> => {
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
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Original Label',
              leftProperty: 'original',
              rightLabel: 'Other Label',
              rightProperty: 'other',
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
            'api::common-property.common-property',
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
              'api::common-property.common-property',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${otherProject}/common-property/${resource}`,
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
            'api::common-property.common-property',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::common-property.common-property',
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
