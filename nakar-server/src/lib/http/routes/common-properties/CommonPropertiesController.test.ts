import type { FixtureContext } from '../../../../e2e/FixtureContext';
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
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.owner.username,
          fixture.owner.password,
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.collaborator.username,
          fixture.collaborator.password,
          testContext,
        );
        const draftRemoval: Response = await manager.updateDocument(
          'api::project.project',
          fixture.projectId,
          { collaborators: [] },
          testContext,
        );
        assert.equal(draftRemoval.status, 200);

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${fixture.projectId}/common-property`,
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
        assert.notEqual(body.id, fixture.commonPropertyId);
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
          `${manager.apiUrl}/project/${fixture.projectId}`,
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
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.owner.username,
          fixture.owner.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${fixture.projectId}/common-property`,
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
        assert.notEqual(body.id, fixture.commonPropertyId);
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
          `${manager.apiUrl}/project/${fixture.projectId}`,
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
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.owner.username,
          fixture.owner.password,
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.collaborator.username,
          fixture.collaborator.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${fixture.projectId}/common-property`,
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
        assert.notEqual(body.id, fixture.commonPropertyId);
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
          `${manager.apiUrl}/project/${fixture.projectId}`,
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
    describe('401', (): void => {
      test('rejects requests without valid authentication', async (testContext: TestContext): Promise<void> => {
        const variants: { headers: [string, string][] }[] = [
          { headers: [] },
          {
            headers: [['Authorization', 'Bearer invalid-jwt']],
          },
        ];
        for (const variant of variants) {
          // given
          const fixture: FixtureContext =
            await manager.setupFixture(testContext);
          await manager.loginUser(
            fixture.owner.username,
            fixture.owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: fixture.projectId,
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
                item.documentId === fixture.commonPropertyId,
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
            `${manager.apiUrl}/project/${fixture.projectId}/common-property`,
            {
              method: 'POST',
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
        }
      });
    });

    describe('403', (): void => {
      test('rejects outsider access', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        await manager.loginUser(
          fixture.owner.username,
          fixture.owner.password,
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.outsider.username,
          fixture.outsider.password,
          testContext,
        );
        const filters: Record<string, string> = {
          [`filters[project][documentId][$eq]`]: fixture.projectId,
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
              item.documentId === fixture.commonPropertyId,
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
          `${manager.apiUrl}/project/${fixture.projectId}/common-property`,
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

      test('rejects removed collaborator access', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        await manager.loginUser(
          fixture.owner.username,
          fixture.owner.password,
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.collaborator.username,
          fixture.collaborator.password,
          testContext,
        );
        const removal: Response = await manager.publishDocument(
          'api::project.project',
          fixture.projectId,
          { collaborators: [] },
          testContext,
        );
        assert.equal(removal.status, 200);
        const filters: Record<string, string> = {
          [`filters[project][documentId][$eq]`]: fixture.projectId,
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
              item.documentId === fixture.commonPropertyId,
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
          `${manager.apiUrl}/project/${fixture.projectId}/common-property`,
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
          const fixture: FixtureContext =
            await manager.setupFixture(testContext);
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            fixture.owner.username,
            fixture.owner.password,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            fixture.collaborator.username,
            fixture.collaborator.password,
            testContext,
          );
          const draftRemoval: Response = await manager.updateDocument(
            'api::project.project',
            fixture.projectId,
            { collaborators: [] },
            testContext,
          );
          assert.equal(draftRemoval.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${fixture.projectId}/common-property/${fixture.commonPropertyId}`,
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
          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${fixture.projectId}`,
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
            (item: CommonPropertyDto): boolean =>
              item.id === fixture.commonPropertyId,
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
          const fixture: FixtureContext =
            await manager.setupFixture(testContext);
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            fixture.owner.username,
            fixture.owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${fixture.projectId}/common-property/${fixture.commonPropertyId}`,
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
          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${fixture.projectId}`,
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
            (item: CommonPropertyDto): boolean =>
              item.id === fixture.commonPropertyId,
          );
          assert.ok(persisted);
          assert.equal(persisted.leftLabel, 'Person');
          assert.equal(persisted.leftProperty, 'name');
          assert.equal(persisted.rightLabel, 'Human');
          assert.equal(persisted.rightProperty, 'label');
        });

        test('collaborator can update a common property', async (testContext: TestContext): Promise<void> => {
          // given
          const fixture: FixtureContext =
            await manager.setupFixture(testContext);
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            fixture.owner.username,
            fixture.owner.password,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            fixture.collaborator.username,
            fixture.collaborator.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${fixture.projectId}/common-property/${fixture.commonPropertyId}`,
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
          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${fixture.projectId}`,
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
            (item: CommonPropertyDto): boolean =>
              item.id === fixture.commonPropertyId,
          );
          assert.ok(persisted);
          assert.equal(persisted.leftLabel, 'Person');
          assert.equal(persisted.leftProperty, 'name');
          assert.equal(persisted.rightLabel, 'Human');
          assert.equal(persisted.rightProperty, 'label');
        });

        test('accepts empty property fields and clears database relations', async (testContext: TestContext): Promise<void> => {
          // given
          const fixture: FixtureContext =
            await manager.setupFixture(testContext);
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            fixture.owner.username,
            fixture.owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${fixture.projectId}/common-property/${fixture.commonPropertyId}`,
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
          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          const projectResponse: Response = await fetch(
            `${manager.apiUrl}/project/${fixture.projectId}`,
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
            (item: CommonPropertyDto): boolean =>
              item.id === fixture.commonPropertyId,
          );
          assert.ok(persisted);
          assert.equal(persisted.leftLabel, '');
          assert.equal(persisted.leftProperty, '');
          assert.equal(persisted.rightLabel, '');
          assert.equal(persisted.rightProperty, '');
        });
      });
      describe('400', (): void => {
        test(
          'rejects invalid common property request bodies',
          { timeout: 180_000 },
          async (testContext: TestContext): Promise<void> => {
            const variants: {
              payload: Record<string, unknown>;
              expectedMessage: string;
            }[] = [
              {
                payload: { leftLabel: undefined },
                expectedMessage: 'leftLabel',
              },
              {
                payload: { leftLabel: null },
                expectedMessage: 'leftLabel',
              },
              {
                payload: { leftLabel: 123 },
                expectedMessage: 'leftLabel',
              },
              {
                payload: { leftProperty: undefined },
                expectedMessage: 'leftProperty',
              },
              {
                payload: { leftProperty: null },
                expectedMessage: 'leftProperty',
              },
              {
                payload: { leftProperty: 123 },
                expectedMessage: 'leftProperty',
              },
              {
                payload: { rightLabel: undefined },
                expectedMessage: 'rightLabel',
              },
              {
                payload: { rightLabel: null },
                expectedMessage: 'rightLabel',
              },
              {
                payload: { rightLabel: 123 },
                expectedMessage: 'rightLabel',
              },
              {
                payload: { rightProperty: undefined },
                expectedMessage: 'rightProperty',
              },
              {
                payload: { rightProperty: null },
                expectedMessage: 'rightProperty',
              },
              {
                payload: { rightProperty: 123 },
                expectedMessage: 'rightProperty',
              },
              {
                payload: { leftDatabaseId: undefined },
                expectedMessage: 'leftDatabaseId',
              },
              {
                payload: { leftDatabaseId: null },
                expectedMessage: 'leftDatabaseId',
              },
              {
                payload: { leftDatabaseId: 123 },
                expectedMessage: 'leftDatabaseId',
              },
              {
                payload: { rightDatabaseId: undefined },
                expectedMessage: 'rightDatabaseId',
              },
              {
                payload: { rightDatabaseId: null },
                expectedMessage: 'rightDatabaseId',
              },
              {
                payload: { rightDatabaseId: 123 },
                expectedMessage: 'rightDatabaseId',
              },
              {
                payload: { unexpected: true },
                expectedMessage: 'unexpected',
              },
            ];
            for (const variant of variants) {
              // given
              const fixture: FixtureContext =
                await manager.setupFixture(testContext);
              const ownerLogin: PostAuthResponseBodyDto =
                await manager.loginUser(
                  fixture.owner.username,
                  fixture.owner.password,
                  testContext,
                );
              const filters: Record<string, string> = {
                [`filters[project][documentId][$eq]`]: fixture.projectId,
                pageSize: '100',
                sort: 'documentId:asc',
              };
              const originalDraftResponse: Response =
                await manager.readDocuments(
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
                    item.documentId === fixture.commonPropertyId,
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
                `${manager.apiUrl}/project/${fixture.projectId}/common-property/${fixture.commonPropertyId}`,
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
                    leftLabel: 'Person',
                    ...variant.payload,
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
                  message.includes(variant.expectedMessage),
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
            }
          },
        );
      });
      describe('401', (): void => {
        test('rejects requests without valid authentication', async (testContext: TestContext): Promise<void> => {
          const variants: { headers: [string, string][] }[] = [
            {
              headers: [['Content-Type', 'application/json']],
            },
            {
              headers: [
                ['Authorization', 'Bearer invalid-jwt'],
                ['Content-Type', 'application/json'],
              ],
            },
          ];
          for (const variant of variants) {
            // given
            const fixture: FixtureContext =
              await manager.setupFixture(testContext);
            await manager.loginUser(
              fixture.owner.username,
              fixture.owner.password,
              testContext,
            );
            const filters: Record<string, string> = {
              [`filters[project][documentId][$eq]`]: fixture.projectId,
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
                  item.documentId === fixture.commonPropertyId,
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
              `${manager.apiUrl}/project/${fixture.projectId}/common-property/${fixture.commonPropertyId}`,
              {
                method: 'PUT',
                body: JSON.stringify({
                  leftLabel: 'Person',
                  leftProperty: 'name',
                  rightLabel: 'Human',
                  rightProperty: 'label',
                  leftDatabaseId: '',
                  rightDatabaseId: '',
                } satisfies UpdateCommonPropertyRequestBodyDto),
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
          }
        });
      });

      describe('403', (): void => {
        test('rejects outsider access', async (testContext: TestContext): Promise<void> => {
          // given
          const fixture: FixtureContext =
            await manager.setupFixture(testContext);
          await manager.loginUser(
            fixture.owner.username,
            fixture.owner.password,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            fixture.outsider.username,
            fixture.outsider.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: fixture.projectId,
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
                item.documentId === fixture.commonPropertyId,
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
            `${manager.apiUrl}/project/${fixture.projectId}/common-property/${fixture.commonPropertyId}`,
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

        test('rejects removed collaborator access', async (testContext: TestContext): Promise<void> => {
          // given
          const fixture: FixtureContext =
            await manager.setupFixture(testContext);
          await manager.loginUser(
            fixture.owner.username,
            fixture.owner.password,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            fixture.collaborator.username,
            fixture.collaborator.password,
            testContext,
          );
          const removal: Response = await manager.publishDocument(
            'api::project.project',
            fixture.projectId,
            { collaborators: [] },
            testContext,
          );
          assert.equal(removal.status, 200);
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: fixture.projectId,
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
                item.documentId === fixture.commonPropertyId,
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
            `${manager.apiUrl}/project/${fixture.projectId}/common-property/${fixture.commonPropertyId}`,
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
        test('rejects an unknown database on either side', async (testContext: TestContext): Promise<void> => {
          const sides: ('left' | 'right')[] = ['left', 'right'];
          for (const side of sides) {
            // given
            const fixture: FixtureContext =
              await manager.setupFixture(testContext);
            const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
              fixture.owner.username,
              fixture.owner.password,
              testContext,
            );
            const database: string = randomUUID();
            const filters: Record<string, string> = {
              [`filters[project][documentId][$eq]`]: fixture.projectId,
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
                  item.documentId === fixture.commonPropertyId,
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
              `${manager.apiUrl}/project/${fixture.projectId}/common-property/${fixture.commonPropertyId}`,
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
                  leftDatabaseId: side === 'left' ? database : '',
                  rightDatabaseId: side === 'right' ? database : '',
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
          }
        });

        test('rejects an unpublished database on either side', async (testContext: TestContext): Promise<void> => {
          const sides: ('left' | 'right')[] = ['left', 'right'];
          for (const side of sides) {
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
                  leftDatabaseId: side === 'left' ? database : '',
                  rightDatabaseId: side === 'right' ? database : '',
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
          }
        });

        test('rejects a foreign database on either side', async (testContext: TestContext): Promise<void> => {
          const sides: ('left' | 'right')[] = ['left', 'right'];
          for (const side of sides) {
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
                  leftDatabaseId: side === 'left' ? database : '',
                  rightDatabaseId: side === 'right' ? database : '',
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
          }
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
          const fixture: FixtureContext =
            await manager.setupFixture(testContext);
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            fixture.owner.username,
            fixture.owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: fixture.projectId,
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
                item.documentId === fixture.commonPropertyId,
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
            `${manager.apiUrl}/project/${fixture.projectId}/common-property/${randomUUID()}`,
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
          const fixture: FixtureContext =
            await manager.setupFixture(testContext);
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            fixture.owner.username,
            fixture.owner.password,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            fixture.collaborator.username,
            fixture.collaborator.password,
            testContext,
          );
          const draftRemoval: Response = await manager.updateDocument(
            'api::project.project',
            fixture.projectId,
            { collaborators: [] },
            testContext,
          );
          assert.equal(draftRemoval.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${fixture.projectId}/common-property/${fixture.commonPropertyId}`,
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
            `${manager.apiUrl}/project/${fixture.projectId}`,
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
              (item: CommonPropertyDto): boolean =>
                item.id === fixture.commonPropertyId,
            ),
            false,
          );
          const stored: Response = await manager.readDocument(
            'api::common-property.common-property',
            fixture.commonPropertyId,
            testContext,
          );
          assert.equal(stored.status, 404);
        });

        test('owner can delete a common property', async (testContext: TestContext): Promise<void> => {
          // given
          const fixture: FixtureContext =
            await manager.setupFixture(testContext);
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            fixture.owner.username,
            fixture.owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${fixture.projectId}/common-property/${fixture.commonPropertyId}`,
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
            `${manager.apiUrl}/project/${fixture.projectId}`,
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
              (item: CommonPropertyDto): boolean =>
                item.id === fixture.commonPropertyId,
            ),
            false,
          );
          const stored: Response = await manager.readDocument(
            'api::common-property.common-property',
            fixture.commonPropertyId,
            testContext,
          );
          assert.equal(stored.status, 404);
        });

        test('collaborator can delete a common property', async (testContext: TestContext): Promise<void> => {
          // given
          const fixture: FixtureContext =
            await manager.setupFixture(testContext);
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            fixture.owner.username,
            fixture.owner.password,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            fixture.collaborator.username,
            fixture.collaborator.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${fixture.projectId}/common-property/${fixture.commonPropertyId}`,
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
            `${manager.apiUrl}/project/${fixture.projectId}`,
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
              (item: CommonPropertyDto): boolean =>
                item.id === fixture.commonPropertyId,
            ),
            false,
          );
          const stored: Response = await manager.readDocument(
            'api::common-property.common-property',
            fixture.commonPropertyId,
            testContext,
          );
          assert.equal(stored.status, 404);
        });
      });
      describe('401', (): void => {
        test('rejects requests without valid authentication', async (testContext: TestContext): Promise<void> => {
          const variants: { headers: [string, string][] }[] = [
            { headers: [] },
            {
              headers: [['Authorization', 'Bearer invalid-jwt']],
            },
          ];
          for (const variant of variants) {
            // given
            const fixture: FixtureContext =
              await manager.setupFixture(testContext);
            await manager.loginUser(
              fixture.owner.username,
              fixture.owner.password,
              testContext,
            );
            const filters: Record<string, string> = {
              [`filters[project][documentId][$eq]`]: fixture.projectId,
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
                  item.documentId === fixture.commonPropertyId,
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
              `${manager.apiUrl}/project/${fixture.projectId}/common-property/${fixture.commonPropertyId}`,
              {
                method: 'DELETE',
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
          }
        });
      });

      describe('403', (): void => {
        test('rejects outsider access', async (testContext: TestContext): Promise<void> => {
          // given
          const fixture: FixtureContext =
            await manager.setupFixture(testContext);
          await manager.loginUser(
            fixture.owner.username,
            fixture.owner.password,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            fixture.outsider.username,
            fixture.outsider.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: fixture.projectId,
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
                item.documentId === fixture.commonPropertyId,
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
            `${manager.apiUrl}/project/${fixture.projectId}/common-property/${fixture.commonPropertyId}`,
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

        test('rejects removed collaborator access', async (testContext: TestContext): Promise<void> => {
          // given
          const fixture: FixtureContext =
            await manager.setupFixture(testContext);
          await manager.loginUser(
            fixture.owner.username,
            fixture.owner.password,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            fixture.collaborator.username,
            fixture.collaborator.password,
            testContext,
          );
          const removal: Response = await manager.publishDocument(
            'api::project.project',
            fixture.projectId,
            { collaborators: [] },
            testContext,
          );
          assert.equal(removal.status, 200);
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: fixture.projectId,
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
                item.documentId === fixture.commonPropertyId,
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
            `${manager.apiUrl}/project/${fixture.projectId}/common-property/${fixture.commonPropertyId}`,
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
          const fixture: FixtureContext =
            await manager.setupFixture(testContext);
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            fixture.owner.username,
            fixture.owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[project][documentId][$eq]`]: fixture.projectId,
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
                item.documentId === fixture.commonPropertyId,
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
            `${manager.apiUrl}/project/${fixture.projectId}/common-property/${randomUUID()}`,
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
