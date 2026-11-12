import type { UpdateScenarioRequestBodyDto } from './dto/UpdateScenarioRequestBodyDto';
import type { UpdateScenarioQueryEntryDto } from './dto/UpdateScenarioQueryEntryDto';
import type { UpdateScenarioQueryParameterEntryDto } from './dto/UpdateScenarioQueryParameterEntryDto';
import type { UpdateScenarioPostActionEntryDto } from './dto/UpdateScenarioPostActionEntryDto';
import { UpdateScenarioPostActionTypeDto } from './dto/UpdateScenarioPostActionTypeDto';
import { UpdateScenarioPostActionLayoutAlgorithmDto } from './dto/UpdateScenarioPostActionLayoutAlgorithmDto';
import type { UpdateScenarioPostActionColorPresetDto } from './dto/UpdateScenarioPostActionColorPresetDto';
import { ColorPresetIndexDto } from '../../../schema/dtos/ColorPresetIndexDto';
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
import type { ScenarioDto } from '../../../schema/dtos/ScenarioDto';
import { LiveCanvasParameterDataType } from '../../../live-canvas/graph/LiveCanvasParameterDataType';
import { ScenarioPostActionTypeDto } from '../../../schema/dtos/ScenarioPostActionTypeDto';
import { ScenarioPostActionLayoutAlgorithmDto } from '../../../schema/dtos/ScenarioPostActionLayoutAlgorithmDto';

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
// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-assignment -- Zod validates the nested enum values at runtime.
const scenarioSchema: z.ZodType<ScenarioDto> = z.strictObject({
  id: z.string().min(1),
  title: z.string().nullable(),
  description: z.string().nullable(),
  queries: z.array(
    z.strictObject({
      id: z.string().min(1),
      query: z.string(),
      database: databaseSchema.nullable(),
      isTableQuery: z.boolean(),
    }),
  ),
  parameters: z.array(
    z.strictObject({
      id: z.string().min(1),
      identifier: z.string(),
      title: z.string(),
      defaultValue: z.string().nullable(),
      dataType: z.enum(LiveCanvasParameterDataType),
      allowedLabels: z.array(z.string()),
    }),
  ),
  postScenarioActions: z.array(
    z.strictObject({
      id: z.string().min(1),
      type: z.enum(ScenarioPostActionTypeDto),
      label: z.string(),
      circleRadius: z.number(),
      layoutAlgorithm: z.enum(ScenarioPostActionLayoutAlgorithmDto),
      relationshipType: z.string(),
      factor: z.number(),
      width: z.number(),
      color: z.strictObject({
        type: z.literal('ColorPresetDto'),
        index: z.number().int().min(0).max(5),
      }),
      radius: z.number(),
      property: z.string(),
    }),
  ),
  postActionsDescription: z.array(z.string()),
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
const projectStateSchema: z.ZodType<{
  scenarioGroups: { id: string; scenarios: ScenarioDto[] }[];
}> = z.object({
  scenarioGroups: z.array(
    z.object({ id: z.string(), scenarios: z.array(scenarioSchema) }),
  ),
});
describe('/project/:projectId/scenario-group/:scenarioGroupId/scenario', (suiteContext: SuiteContext): void => {
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
      test('uses the published assignment despite draft reassignment', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const project: string = await manager.createPublishedDocument(
          'api::project.project',
          {
            title: 'Published Project',
            owner: owner.documentId,
            collaborators: [],
          },
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
        const group: string = await manager.createPublishedDocument(
          'api::scenario-group.scenario-group',
          { title: 'Published Group', project },
          testContext,
        );
        const draft: Response = await manager.updateDocument(
          'api::scenario-group.scenario-group',
          group,
          { title: 'Draft Group', project: otherProject },
          testContext,
        );
        assert.equal(draft.status, 200);
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario`,
          {
            method: 'POST',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 201);
        const body: ScenarioDto = scenarioSchema.parse(await response.json());
        assert.equal(body.title, 'Untitled Scenario');
        const originalProject: Response = await fetch(
          `${manager.apiUrl}/project/${project}`,
          {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );
        assert.equal(originalProject.status, 200);
        const originalState: z.infer<typeof projectStateSchema> =
          projectStateSchema.parse(await originalProject.json());
        const originalGroup:
          { id: string; scenarios: ScenarioDto[] } | undefined =
          originalState.scenarioGroups.find(
            (item: { id: string }): boolean => item.id === group,
          );
        assert.ok(originalGroup);
        assert.deepEqual(
          originalGroup.scenarios.find(
            (item: ScenarioDto): boolean => item.id === body.id,
          ),
          body,
        );
        const reassignedProject: Response = await fetch(
          `${manager.apiUrl}/project/${otherProject}`,
          {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );
        assert.equal(reassignedProject.status, 200);
        const reassignedState: z.infer<typeof projectStateSchema> =
          projectStateSchema.parse(await reassignedProject.json());
        assert.equal(
          reassignedState.scenarioGroups.some(
            (item: { id: string }): boolean => item.id === group,
          ),
          false,
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
        const group: string = await manager.createPublishedDocument(
          'api::scenario-group.scenario-group',
          { title: 'Scenario Group', project },
          testContext,
        );
        const resource: string = await manager.createPublishedDocument(
          'api::scenario.scenario',
          {
            title: 'Original Scenario',
            description: 'Original description',
            group,
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
          `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario`,
          {
            method: 'POST',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 201);
        const body: ScenarioDto = scenarioSchema.parse(await response.json());
        assert.notEqual(body.id, resource);
        assert.deepEqual(body, {
          id: body.id,
          title: 'Untitled Scenario',
          description: '',
          queries: [],
          parameters: [],
          postScenarioActions: [],
          postActionsDescription: [],
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
        const items: ScenarioDto[] | undefined =
          publishedState.scenarioGroups.find(
            (item: { id: string }): boolean => item.id === group,
          )?.scenarios;
        assert.ok(items != null);
        assert.deepEqual(
          items.find((item: ScenarioDto): boolean => item.id === body.id),
          body,
        );
      });

      test('owner can create a scenario', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const project: string = await manager.createPublishedDocument(
          'api::project.project',
          { title: 'Test Project', owner: owner.documentId, collaborators: [] },
          testContext,
        );
        const group: string = await manager.createPublishedDocument(
          'api::scenario-group.scenario-group',
          { title: 'Scenario Group', project },
          testContext,
        );
        const resource: string = await manager.createPublishedDocument(
          'api::scenario.scenario',
          {
            title: 'Original Scenario',
            description: 'Original description',
            group,
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
          `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario`,
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
        const body: ScenarioDto = scenarioSchema.parse(await response.json());
        assert.notEqual(body.id, resource);
        assert.deepEqual(body, {
          id: body.id,
          title: 'Untitled Scenario',
          description: '',
          queries: [],
          parameters: [],
          postScenarioActions: [],
          postActionsDescription: [],
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
        const items: ScenarioDto[] | undefined =
          publishedState.scenarioGroups.find(
            (item: { id: string }): boolean => item.id === group,
          )?.scenarios;
        assert.ok(items != null);
        assert.deepEqual(
          items.find((item: ScenarioDto): boolean => item.id === body.id),
          body,
        );
      });

      test('collaborator can create a scenario', async (testContext: TestContext): Promise<void> => {
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
        const group: string = await manager.createPublishedDocument(
          'api::scenario-group.scenario-group',
          { title: 'Scenario Group', project },
          testContext,
        );
        const resource: string = await manager.createPublishedDocument(
          'api::scenario.scenario',
          {
            title: 'Original Scenario',
            description: 'Original description',
            group,
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
          `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario`,
          {
            method: 'POST',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 201);
        const body: ScenarioDto = scenarioSchema.parse(await response.json());
        assert.notEqual(body.id, resource);
        assert.deepEqual(body, {
          id: body.id,
          title: 'Untitled Scenario',
          description: '',
          queries: [],
          parameters: [],
          postScenarioActions: [],
          postActionsDescription: [],
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
        const items: ScenarioDto[] | undefined =
          publishedState.scenarioGroups.find(
            (item: { id: string }): boolean => item.id === group,
          )?.scenarios;
        assert.ok(items != null);
        assert.deepEqual(
          items.find((item: ScenarioDto): boolean => item.id === body.id),
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
        const group: string = await manager.createPublishedDocument(
          'api::scenario-group.scenario-group',
          { title: 'Scenario Group', project },
          testContext,
        );
        const resource: string = await manager.createPublishedDocument(
          'api::scenario.scenario',
          {
            title: 'Original Scenario',
            description: 'Original description',
            group,
          },
          testContext,
        );
        await manager.loginUser(owner.username, owner.password, testContext);
        const filters: Record<string, string> = {
          [`filters[group][documentId][$eq]`]: group,
          pageSize: '100',
          sort: 'documentId:asc',
        };
        const originalDraftResponse: Response = await manager.readDocuments(
          'api::scenario.scenario',
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
          'api::scenario.scenario',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(originalPublishedResponse.status, 200);
        const originalPublished: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalPublishedResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario`,
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
          'api::scenario.scenario',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(draftResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await draftResponse.json()),
          originalDraft,
        );
        const publishedResponse: Response = await manager.readDocuments(
          'api::scenario.scenario',
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
        const group: string = await manager.createPublishedDocument(
          'api::scenario-group.scenario-group',
          { title: 'Scenario Group', project },
          testContext,
        );
        const resource: string = await manager.createPublishedDocument(
          'api::scenario.scenario',
          {
            title: 'Original Scenario',
            description: 'Original description',
            group,
          },
          testContext,
        );
        await manager.loginUser(owner.username, owner.password, testContext);
        const filters: Record<string, string> = {
          [`filters[group][documentId][$eq]`]: group,
          pageSize: '100',
          sort: 'documentId:asc',
        };
        const originalDraftResponse: Response = await manager.readDocuments(
          'api::scenario.scenario',
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
          'api::scenario.scenario',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(originalPublishedResponse.status, 200);
        const originalPublished: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalPublishedResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario`,
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
          'api::scenario.scenario',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(draftResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await draftResponse.json()),
          originalDraft,
        );
        const publishedResponse: Response = await manager.readDocuments(
          'api::scenario.scenario',
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
        const group: string = await manager.createPublishedDocument(
          'api::scenario-group.scenario-group',
          { title: 'Scenario Group', project },
          testContext,
        );
        const resource: string = await manager.createPublishedDocument(
          'api::scenario.scenario',
          {
            title: 'Original Scenario',
            description: 'Original description',
            group,
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
          [`filters[group][documentId][$eq]`]: group,
          pageSize: '100',
          sort: 'documentId:asc',
        };
        const originalDraftResponse: Response = await manager.readDocuments(
          'api::scenario.scenario',
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
          'api::scenario.scenario',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(originalPublishedResponse.status, 200);
        const originalPublished: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalPublishedResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario`,
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
          'api::scenario.scenario',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(draftResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await draftResponse.json()),
          originalDraft,
        );
        const publishedResponse: Response = await manager.readDocuments(
          'api::scenario.scenario',
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
        const group: string = await manager.createPublishedDocument(
          'api::scenario-group.scenario-group',
          { title: 'Scenario Group', project },
          testContext,
        );
        const resource: string = await manager.createPublishedDocument(
          'api::scenario.scenario',
          {
            title: 'Original Scenario',
            description: 'Original description',
            group,
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
          [`filters[group][documentId][$eq]`]: group,
          pageSize: '100',
          sort: 'documentId:asc',
        };
        const originalDraftResponse: Response = await manager.readDocuments(
          'api::scenario.scenario',
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
          'api::scenario.scenario',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(originalPublishedResponse.status, 200);
        const originalPublished: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalPublishedResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario`,
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
          'api::scenario.scenario',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(draftResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await draftResponse.json()),
          originalDraft,
        );
        const publishedResponse: Response = await manager.readDocuments(
          'api::scenario.scenario',
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
        const group: string = await manager.createPublishedDocument(
          'api::scenario-group.scenario-group',
          { title: 'Scenario Group', project },
          testContext,
        );
        const resource: string = await manager.createPublishedDocument(
          'api::scenario.scenario',
          {
            title: 'Original Scenario',
            description: 'Original description',
            group,
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
          [`filters[group][documentId][$eq]`]: group,
          pageSize: '100',
          sort: 'documentId:asc',
        };
        const originalDraftResponse: Response = await manager.readDocuments(
          'api::scenario.scenario',
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
          'api::scenario.scenario',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(originalPublishedResponse.status, 200);
        const originalPublished: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalPublishedResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario`,
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
          'api::scenario.scenario',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(draftResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await draftResponse.json()),
          originalDraft,
        );
        const publishedResponse: Response = await manager.readDocuments(
          'api::scenario.scenario',
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
        const group: string = await manager.createPublishedDocument(
          'api::scenario-group.scenario-group',
          { title: 'Scenario Group', project },
          testContext,
        );
        const resource: string = await manager.createPublishedDocument(
          'api::scenario.scenario',
          {
            title: 'Original Scenario',
            description: 'Original description',
            group,
          },
          testContext,
        );
        const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const filters: Record<string, string> = {
          [`filters[group][documentId][$eq]`]: group,
          pageSize: '100',
          sort: 'documentId:asc',
        };
        const originalDraftResponse: Response = await manager.readDocuments(
          'api::scenario.scenario',
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
          'api::scenario.scenario',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(originalPublishedResponse.status, 200);
        const originalPublished: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalPublishedResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${randomUUID()}/scenario-group/${group}/scenario`,
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
          'api::scenario.scenario',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(draftResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await draftResponse.json()),
          originalDraft,
        );
        const publishedResponse: Response = await manager.readDocuments(
          'api::scenario.scenario',
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
        const group: string = await manager.createPublishedDocument(
          'api::scenario-group.scenario-group',
          { title: 'Scenario Group', project },
          testContext,
        );
        const resource: string = await manager.createPublishedDocument(
          'api::scenario.scenario',
          {
            title: 'Original Scenario',
            description: 'Original description',
            group,
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
          [`filters[group][documentId][$eq]`]: group,
          pageSize: '100',
          sort: 'documentId:asc',
        };
        const originalDraftResponse: Response = await manager.readDocuments(
          'api::scenario.scenario',
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
          'api::scenario.scenario',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(originalPublishedResponse.status, 200);
        const originalPublished: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalPublishedResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario`,
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
          'api::scenario.scenario',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(draftResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await draftResponse.json()),
          originalDraft,
        );
        const publishedResponse: Response = await manager.readDocuments(
          'api::scenario.scenario',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(publishedResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await publishedResponse.json()),
          originalPublished,
        );
      });

      test('rejects unknown scenario group', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const project: string = await manager.createPublishedDocument(
          'api::project.project',
          { title: 'Test Project', owner: owner.documentId, collaborators: [] },
          testContext,
        );
        const group: string = await manager.createPublishedDocument(
          'api::scenario-group.scenario-group',
          { title: 'Scenario Group', project },
          testContext,
        );
        const resource: string = await manager.createPublishedDocument(
          'api::scenario.scenario',
          {
            title: 'Original Scenario',
            description: 'Original description',
            group,
          },
          testContext,
        );
        const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const filters: Record<string, string> = {
          [`filters[group][documentId][$eq]`]: group,
          pageSize: '100',
          sort: 'documentId:asc',
        };
        const originalDraftResponse: Response = await manager.readDocuments(
          'api::scenario.scenario',
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
          'api::scenario.scenario',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(originalPublishedResponse.status, 200);
        const originalPublished: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalPublishedResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/scenario-group/${randomUUID()}/scenario`,
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
          'api::scenario.scenario',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(draftResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await draftResponse.json()),
          originalDraft,
        );
        const publishedResponse: Response = await manager.readDocuments(
          'api::scenario.scenario',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(publishedResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await publishedResponse.json()),
          originalPublished,
        );
      });

      test('rejects unpublished scenario group', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const project: string = await manager.createPublishedDocument(
          'api::project.project',
          { title: 'Test Project', owner: owner.documentId, collaborators: [] },
          testContext,
        );
        const group: string = await manager.createPublishedDocument(
          'api::scenario-group.scenario-group',
          { title: 'Scenario Group', project },
          testContext,
        );
        const resource: string = await manager.createPublishedDocument(
          'api::scenario.scenario',
          {
            title: 'Original Scenario',
            description: 'Original description',
            group,
          },
          testContext,
        );
        const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const unpublish: Response = await manager.unpublishDocument(
          'api::scenario-group.scenario-group',
          group,
          {},
          testContext,
        );
        assert.equal(unpublish.status, 200);
        const draftGroup: Response = await manager.readDocument(
          'api::scenario-group.scenario-group',
          group,
          testContext,
        );
        assert.equal(draftGroup.status, 200);
        z.object({ data: z.object({ publishedAt: z.null() }) }).parse(
          await draftGroup.json(),
        );
        const filters: Record<string, string> = {
          [`filters[group][documentId][$eq]`]: group,
          pageSize: '100',
          sort: 'documentId:asc',
        };
        const originalDraftResponse: Response = await manager.readDocuments(
          'api::scenario.scenario',
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
          'api::scenario.scenario',
          { ...filters, status: 'published' },
          testContext,
        );
        assert.equal(originalPublishedResponse.status, 200);
        const originalPublished: z.infer<typeof listStateSchema> =
          listStateSchema.parse(await originalPublishedResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario`,
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
          'api::scenario.scenario',
          { ...filters, status: 'draft' },
          testContext,
        );
        assert.equal(draftResponse.status, 200);
        assert.deepEqual(
          listStateSchema.parse(await draftResponse.json()),
          originalDraft,
        );
        const publishedResponse: Response = await manager.readDocuments(
          'api::scenario.scenario',
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
  describe('/:scenarioId', (): void => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const otherGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Other Group', project },
            testContext,
          );
          const draftChange: Response = await manager.updateDocument(
            'api::scenario.scenario',
            resource,
            { title: 'Draft Scenario', group: otherGroup },
            testContext,
          );
          assert.equal(draftChange.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: ScenarioDto = scenarioSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Scenario');
          assert.equal(result.description, 'Updated description');
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
          const items: ScenarioDto[] | undefined =
            publishedState.scenarioGroups.find(
              (item: { id: string }): boolean => item.id === group,
            )?.scenarios;
          assert.ok(items != null);
          const persisted: ScenarioDto | undefined = items.find(
            (item: ScenarioDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Scenario');
        });

        test('persists a query using a database of the project', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
            { title: 'Query Database', project, databaseType: 'neo4j' },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                parameters: [],
                postScenarioActions: [],
                queries: [
                  {
                    id: randomUUID(),
                    query: 'MATCH (n) RETURN n',
                    isTableQuery: false,
                    databaseId: database,
                  },
                ],
              } satisfies UpdateScenarioRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: ScenarioDto = scenarioSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Scenario');
          assert.equal(result.description, 'Updated description');
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
          const items: ScenarioDto[] | undefined =
            publishedState.scenarioGroups.find(
              (item: { id: string }): boolean => item.id === group,
            )?.scenarios;
          assert.ok(items != null);
          const persisted: ScenarioDto | undefined = items.find(
            (item: ScenarioDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Scenario');
          assert.equal(result.queries[0]?.database?.id, database);
          assert.deepEqual(persisted, result);
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: ScenarioDto = scenarioSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Scenario');
          assert.equal(result.description, 'Updated description');
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
          const items: ScenarioDto[] | undefined =
            publishedState.scenarioGroups.find(
              (item: { id: string }): boolean => item.id === group,
            )?.scenarios;
          assert.ok(items != null);
          const persisted: ScenarioDto | undefined = items.find(
            (item: ScenarioDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Scenario');
        });

        test('persists a new query', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                parameters: [],
                postScenarioActions: [],
                queries: [
                  {
                    id: randomUUID(),
                    query: 'MATCH (n) RETURN n',
                    databaseId: null,
                    isTableQuery: false,
                  },
                ],
              } satisfies UpdateScenarioRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: ScenarioDto = scenarioSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Scenario');
          assert.equal(result.description, 'Updated description');
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
          const items: ScenarioDto[] | undefined =
            publishedState.scenarioGroups.find(
              (item: { id: string }): boolean => item.id === group,
            )?.scenarios;
          assert.ok(items != null);
          const persisted: ScenarioDto | undefined = items.find(
            (item: ScenarioDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Scenario');
          assert.equal(result.queries.length, 1);
          assert.deepEqual(result.queries[0], {
            id: result.queries[0]?.id,
            query: 'MATCH (n) RETURN n',
            database: null,
            isTableQuery: false,
          });
          assert.deepEqual(persisted, result);
        });

        test('persists a new parameter', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [
                  {
                    id: randomUUID(),
                    identifier: 'name',
                    title: 'Name',
                    defaultValue: 'Alice',
                    dataType: LiveCanvasParameterDataType.string,
                    allowedLabels: ['Person'],
                  },
                ],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: ScenarioDto = scenarioSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Scenario');
          assert.equal(result.description, 'Updated description');
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
          const items: ScenarioDto[] | undefined =
            publishedState.scenarioGroups.find(
              (item: { id: string }): boolean => item.id === group,
            )?.scenarios;
          assert.ok(items != null);
          const persisted: ScenarioDto | undefined = items.find(
            (item: ScenarioDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Scenario');
          assert.equal(result.parameters.length, 1);
          assert.deepEqual(result.parameters[0], {
            id: result.parameters[0]?.id,
            identifier: 'name',
            title: 'Name',
            defaultValue: 'Alice',
            dataType: LiveCanvasParameterDataType.string,
            allowedLabels: ['Person'],
          });
          assert.deepEqual(persisted, result);
        });

        test('persists a new post-action', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [
                  {
                    id: randomUUID(),
                    type: UpdateScenarioPostActionTypeDto.layout,
                    label: 'Layout',
                    circleRadius: 2000,
                    layoutAlgorithm:
                      UpdateScenarioPostActionLayoutAlgorithmDto.circle,
                    relationshipType: '',
                    factor: 2,
                    width: 2,
                    color: {
                      type: 'ColorPresetDto',
                      index: ColorPresetIndexDto._0,
                    },
                    radius: 10,
                    property: '',
                  },
                ],
              } satisfies UpdateScenarioRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: ScenarioDto = scenarioSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Scenario');
          assert.equal(result.description, 'Updated description');
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
          const items: ScenarioDto[] | undefined =
            publishedState.scenarioGroups.find(
              (item: { id: string }): boolean => item.id === group,
            )?.scenarios;
          assert.ok(items != null);
          const persisted: ScenarioDto | undefined = items.find(
            (item: ScenarioDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Scenario');
          assert.equal(result.postScenarioActions.length, 1);
          assert.equal(
            result.postScenarioActions[0]?.layoutAlgorithm,
            ScenarioPostActionLayoutAlgorithmDto.circle,
          );
          assert.deepEqual(result.postActionsDescription, ['layout']);
          assert.deepEqual(persisted, result);
        });

        test('updates an existing query without changing its identifier', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const child: string = await manager.createPublishedDocument(
            'api::query.query',
            {
              scenario: resource,
              query: 'Original Query',
              isTableQuery: false,
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [
                  {
                    id: child,
                    query: 'Updated Query',
                    databaseId: null,
                    isTableQuery: true,
                  },
                ],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: ScenarioDto = scenarioSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Scenario');
          assert.equal(result.description, 'Updated description');
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
          const items: ScenarioDto[] | undefined =
            publishedState.scenarioGroups.find(
              (item: { id: string }): boolean => item.id === group,
            )?.scenarios;
          assert.ok(items != null);
          const persisted: ScenarioDto | undefined = items.find(
            (item: ScenarioDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Scenario');
          assert.equal(result.queries.length, 1);
          assert.equal(result.queries[0]?.id, child);
          assert.equal(result.queries[0]?.query, 'Updated Query');
          assert.equal(result.queries[0]?.isTableQuery, true);
          assert.deepEqual(persisted, result);
        });

        test('deletes a query omitted from the update', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const child: string = await manager.createPublishedDocument(
            'api::query.query',
            {
              scenario: resource,
              query: 'Original Query',
              isTableQuery: false,
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: ScenarioDto = scenarioSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Scenario');
          assert.equal(result.description, 'Updated description');
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
          const items: ScenarioDto[] | undefined =
            publishedState.scenarioGroups.find(
              (item: { id: string }): boolean => item.id === group,
            )?.scenarios;
          assert.ok(items != null);
          const persisted: ScenarioDto | undefined = items.find(
            (item: ScenarioDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Scenario');
          assert.deepEqual(result.queries, []);
          const removedChild: Response = await manager.readDocument(
            'api::query.query',
            child,
            testContext,
          );
          assert.equal(removedChild.status, 404);
          assert.deepEqual(persisted, result);
        });

        test('updates an existing parameter without changing its identifier', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const child: string = await manager.createPublishedDocument(
            'api::query-parameter.query-parameter',
            {
              scenario: resource,
              title: 'Original Parameter',
              identifier: 'old',
              defaultValue: 'old',
              dataType: 'string',
              allowedLabels: 'Person',
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [
                  {
                    id: child,
                    identifier: 'updated',
                    title: 'Name',
                    defaultValue: 'Alice',
                    dataType: LiveCanvasParameterDataType.string,
                    allowedLabels: ['Person'],
                  },
                ],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: ScenarioDto = scenarioSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Scenario');
          assert.equal(result.description, 'Updated description');
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
          const items: ScenarioDto[] | undefined =
            publishedState.scenarioGroups.find(
              (item: { id: string }): boolean => item.id === group,
            )?.scenarios;
          assert.ok(items != null);
          const persisted: ScenarioDto | undefined = items.find(
            (item: ScenarioDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Scenario');
          assert.equal(result.parameters.length, 1);
          assert.equal(result.parameters[0]?.id, child);
          assert.equal(result.parameters[0]?.identifier, 'updated');
          assert.deepEqual(persisted, result);
        });

        test('deletes a parameter omitted from the update', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const child: string = await manager.createPublishedDocument(
            'api::query-parameter.query-parameter',
            {
              scenario: resource,
              title: 'Original Parameter',
              identifier: 'old',
              defaultValue: 'old',
              dataType: 'string',
              allowedLabels: 'Person',
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: ScenarioDto = scenarioSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Scenario');
          assert.equal(result.description, 'Updated description');
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
          const items: ScenarioDto[] | undefined =
            publishedState.scenarioGroups.find(
              (item: { id: string }): boolean => item.id === group,
            )?.scenarios;
          assert.ok(items != null);
          const persisted: ScenarioDto | undefined = items.find(
            (item: ScenarioDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Scenario');
          assert.deepEqual(result.parameters, []);
          const removedChild: Response = await manager.readDocument(
            'api::query-parameter.query-parameter',
            child,
            testContext,
          );
          assert.equal(removedChild.status, 404);
          assert.deepEqual(persisted, result);
        });

        test('updates an existing post-action without changing its identifier', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const child: string = await manager.createPublishedDocument(
            'api::post-scenario-action.post-scenario-action',
            {
              scenario: resource,
              type: 'layout',
              label: 'Original Action',
              layoutAlgorithm: 'circle',
              colorIndex: 'c0',
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [
                  {
                    id: child,
                    type: UpdateScenarioPostActionTypeDto.layout,
                    label: 'Updated Action',
                    circleRadius: 2000,
                    layoutAlgorithm:
                      UpdateScenarioPostActionLayoutAlgorithmDto.circle,
                    relationshipType: '',
                    factor: 2,
                    width: 2,
                    color: {
                      type: 'ColorPresetDto',
                      index: ColorPresetIndexDto._0,
                    },
                    radius: 10,
                    property: '',
                  },
                ],
              } satisfies UpdateScenarioRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: ScenarioDto = scenarioSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Scenario');
          assert.equal(result.description, 'Updated description');
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
          const items: ScenarioDto[] | undefined =
            publishedState.scenarioGroups.find(
              (item: { id: string }): boolean => item.id === group,
            )?.scenarios;
          assert.ok(items != null);
          const persisted: ScenarioDto | undefined = items.find(
            (item: ScenarioDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Scenario');
          assert.equal(result.postScenarioActions.length, 1);
          assert.equal(result.postScenarioActions[0]?.id, child);
          assert.equal(result.postScenarioActions[0]?.label, 'Updated Action');
          assert.deepEqual(persisted, result);
        });

        test('deletes a post-action omitted from the update', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const child: string = await manager.createPublishedDocument(
            'api::post-scenario-action.post-scenario-action',
            {
              scenario: resource,
              type: 'layout',
              label: 'Original Action',
              layoutAlgorithm: 'circle',
              colorIndex: 'c0',
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: ScenarioDto = scenarioSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Scenario');
          assert.equal(result.description, 'Updated description');
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
          const items: ScenarioDto[] | undefined =
            publishedState.scenarioGroups.find(
              (item: { id: string }): boolean => item.id === group,
            )?.scenarios;
          assert.ok(items != null);
          const persisted: ScenarioDto | undefined = items.find(
            (item: ScenarioDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Scenario');
          assert.deepEqual(result.postScenarioActions, []);
          const removedChild: Response = await manager.readDocument(
            'api::post-scenario-action.post-scenario-action',
            child,
            testContext,
          );
          assert.equal(removedChild.status, 404);
          assert.deepEqual(persisted, result);
        });

        test('owner can update a scenario', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: ScenarioDto = scenarioSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Scenario');
          assert.equal(result.description, 'Updated description');
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
          const items: ScenarioDto[] | undefined =
            publishedState.scenarioGroups.find(
              (item: { id: string }): boolean => item.id === group,
            )?.scenarios;
          assert.ok(items != null);
          const persisted: ScenarioDto | undefined = items.find(
            (item: ScenarioDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Scenario');
        });

        test('collaborator can update a scenario', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: ScenarioDto = scenarioSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, 'Updated Scenario');
          assert.equal(result.description, 'Updated description');
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
          const items: ScenarioDto[] | undefined =
            publishedState.scenarioGroups.find(
              (item: { id: string }): boolean => item.id === group,
            )?.scenarios;
          assert.ok(items != null);
          const persisted: ScenarioDto | undefined = items.find(
            (item: ScenarioDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, 'Updated Scenario');
        });

        test('accepts empty title and description', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: '',
                description: '',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const result: ScenarioDto = scenarioSchema.parse(
            await response.json(),
          );
          assert.equal(result.id, resource);
          assert.equal(result.title, '');
          assert.equal(result.description, '');
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
          const items: ScenarioDto[] | undefined =
            publishedState.scenarioGroups.find(
              (item: { id: string }): boolean => item.id === group,
            )?.scenarios;
          assert.ok(items != null);
          const persisted: ScenarioDto | undefined = items.find(
            (item: ScenarioDto): boolean => item.id === resource,
          );
          assert.ok(persisted);
          assert.equal(persisted.title, '');
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies Omit<UpdateScenarioRequestBodyDto, 'title'>),
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: null,
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies Omit<UpdateScenarioRequestBodyDto, 'title'> & {
                title: null;
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
              message.includes('title'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 123,
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies Omit<UpdateScenarioRequestBodyDto, 'title'> & {
                title: number;
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
              message.includes('title'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a missing description', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies Omit<UpdateScenarioRequestBodyDto, 'description'>),
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
              message.includes('description'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a null description', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: null,
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies Omit<UpdateScenarioRequestBodyDto, 'description'> & {
                description: null;
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
              message.includes('description'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an invalid description type', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 123,
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies Omit<UpdateScenarioRequestBodyDto, 'description'> & {
                description: number;
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
              message.includes('description'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a missing queries', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                parameters: [],
                postScenarioActions: [],
              } satisfies Omit<UpdateScenarioRequestBodyDto, 'queries'>),
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
              message.includes('queries'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a null queries', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: null,
                parameters: [],
                postScenarioActions: [],
              } satisfies Omit<UpdateScenarioRequestBodyDto, 'queries'> & {
                queries: null;
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
              message.includes('queries'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an invalid queries type', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: {},
                parameters: [],
                postScenarioActions: [],
              } satisfies Omit<UpdateScenarioRequestBodyDto, 'queries'> & {
                queries: Record<string, never>;
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
              message.includes('queries'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a missing parameters', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                postScenarioActions: [],
              } satisfies Omit<UpdateScenarioRequestBodyDto, 'parameters'>),
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
              message.includes('parameters'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a null parameters', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: null,
                postScenarioActions: [],
              } satisfies Omit<UpdateScenarioRequestBodyDto, 'parameters'> & {
                parameters: null;
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
              message.includes('parameters'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an invalid parameters type', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: {},
                postScenarioActions: [],
              } satisfies Omit<UpdateScenarioRequestBodyDto, 'parameters'> & {
                parameters: Record<string, never>;
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
              message.includes('parameters'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a missing postScenarioActions', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
              } satisfies Omit<
                UpdateScenarioRequestBodyDto,
                'postScenarioActions'
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
              message.includes('postScenarioActions'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a null postScenarioActions', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: null,
              } satisfies Omit<
                UpdateScenarioRequestBodyDto,
                'postScenarioActions'
              > & { postScenarioActions: null }),
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
              message.includes('postScenarioActions'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an invalid postScenarioActions type', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: {},
              } satisfies Omit<
                UpdateScenarioRequestBodyDto,
                'postScenarioActions'
              > & { postScenarioActions: Record<string, never> }),
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
              message.includes('postScenarioActions'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
                unexpected: true,
              } satisfies UpdateScenarioRequestBodyDto & {
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects query boolean', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [
                  {
                    id: randomUUID(),
                    query: 'MATCH (n) RETURN n',
                    databaseId: null,
                    isTableQuery: 'false',
                  },
                ],
                parameters: [],
                postScenarioActions: [],
              } satisfies Omit<UpdateScenarioRequestBodyDto, 'queries'> & {
                queries: (Omit<UpdateScenarioQueryEntryDto, 'isTableQuery'> & {
                  isTableQuery: string;
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
              message.includes('queries'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects query text', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [
                  {
                    id: randomUUID(),
                    query: 123,
                    databaseId: null,
                    isTableQuery: false,
                  },
                ],
                parameters: [],
                postScenarioActions: [],
              } satisfies Omit<UpdateScenarioRequestBodyDto, 'queries'> & {
                queries: (Omit<UpdateScenarioQueryEntryDto, 'query'> & {
                  query: number;
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
              message.includes('queries'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects query database identifier', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [
                  {
                    id: randomUUID(),
                    query: 'MATCH (n) RETURN n',
                    databaseId: 123,
                    isTableQuery: false,
                  },
                ],
                parameters: [],
                postScenarioActions: [],
              } satisfies Omit<UpdateScenarioRequestBodyDto, 'queries'> & {
                queries: (Omit<UpdateScenarioQueryEntryDto, 'databaseId'> & {
                  databaseId: number;
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
              message.includes('queries'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects unexpected query properties', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [
                  {
                    id: randomUUID(),
                    query: 'MATCH (n) RETURN n',
                    databaseId: null,
                    isTableQuery: false,
                    unexpected: true,
                  },
                ],
                parameters: [],
                postScenarioActions: [],
              } satisfies Omit<UpdateScenarioRequestBodyDto, 'queries'> & {
                queries: (UpdateScenarioQueryEntryDto & {
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
              message.includes('queries'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects empty parameter identifier', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [
                  {
                    id: randomUUID(),
                    identifier: '',
                    title: 'Name',
                    defaultValue: 'Alice',
                    dataType: LiveCanvasParameterDataType.string,
                    allowedLabels: ['Person'],
                  },
                ],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
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
              message.includes('parameters'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects empty parameter title', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [
                  {
                    id: randomUUID(),
                    identifier: 'name',
                    title: '',
                    defaultValue: 'Alice',
                    dataType: LiveCanvasParameterDataType.string,
                    allowedLabels: ['Person'],
                  },
                ],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
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
              message.includes('parameters'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects unknown parameter data type', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [
                  {
                    id: randomUUID(),
                    identifier: 'name',
                    title: 'Name',
                    defaultValue: 'Alice',
                    dataType: 'unknown',
                    allowedLabels: ['Person'],
                  },
                ],
                postScenarioActions: [],
              } satisfies Omit<UpdateScenarioRequestBodyDto, 'parameters'> & {
                parameters: (Omit<
                  UpdateScenarioQueryParameterEntryDto,
                  'dataType'
                > & { dataType: 'unknown' })[];
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
              message.includes('parameters'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects non-array parameter labels', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [
                  {
                    id: randomUUID(),
                    identifier: 'name',
                    title: 'Name',
                    defaultValue: 'Alice',
                    dataType: LiveCanvasParameterDataType.string,
                    allowedLabels: 'Person',
                  },
                ],
                postScenarioActions: [],
              } satisfies Omit<UpdateScenarioRequestBodyDto, 'parameters'> & {
                parameters: (Omit<
                  UpdateScenarioQueryParameterEntryDto,
                  'allowedLabels'
                > & { allowedLabels: string })[];
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
              message.includes('parameters'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects empty parameter labels', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [
                  {
                    id: randomUUID(),
                    identifier: 'name',
                    title: 'Name',
                    defaultValue: 'Alice',
                    dataType: LiveCanvasParameterDataType.string,
                    allowedLabels: [''],
                  },
                ],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
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
              message.includes('parameters'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects unexpected parameter properties', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [
                  {
                    id: randomUUID(),
                    identifier: 'name',
                    title: 'Name',
                    defaultValue: 'Alice',
                    dataType: LiveCanvasParameterDataType.string,
                    allowedLabels: ['Person'],
                    unexpected: true,
                  },
                ],
                postScenarioActions: [],
              } satisfies Omit<UpdateScenarioRequestBodyDto, 'parameters'> & {
                parameters: (UpdateScenarioQueryParameterEntryDto & {
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
              message.includes('parameters'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects unknown post-action type', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [
                  {
                    id: randomUUID(),
                    type: 'unknown',
                    label: 'Layout',
                    circleRadius: 2000,
                    layoutAlgorithm:
                      UpdateScenarioPostActionLayoutAlgorithmDto.circle,
                    relationshipType: '',
                    factor: 2,
                    width: 2,
                    color: {
                      type: 'ColorPresetDto',
                      index: ColorPresetIndexDto._0,
                    },
                    radius: 10,
                    property: '',
                  },
                ],
              } satisfies Omit<
                UpdateScenarioRequestBodyDto,
                'postScenarioActions'
              > & {
                postScenarioActions: (Omit<
                  UpdateScenarioPostActionEntryDto,
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
              message.includes('postScenarioActions'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects unknown layout algorithm', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [
                  {
                    id: randomUUID(),
                    type: UpdateScenarioPostActionTypeDto.layout,
                    label: 'Layout',
                    circleRadius: 2000,
                    layoutAlgorithm: 'unknown',
                    relationshipType: '',
                    factor: 2,
                    width: 2,
                    color: {
                      type: 'ColorPresetDto',
                      index: ColorPresetIndexDto._0,
                    },
                    radius: 10,
                    property: '',
                  },
                ],
              } satisfies Omit<
                UpdateScenarioRequestBodyDto,
                'postScenarioActions'
              > & {
                postScenarioActions: (Omit<
                  UpdateScenarioPostActionEntryDto,
                  'layoutAlgorithm'
                > & { layoutAlgorithm: 'unknown' })[];
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
              message.includes('postScenarioActions'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects non-numeric post-action radius', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [
                  {
                    id: randomUUID(),
                    type: UpdateScenarioPostActionTypeDto.layout,
                    label: 'Layout',
                    circleRadius: 2000,
                    layoutAlgorithm:
                      UpdateScenarioPostActionLayoutAlgorithmDto.circle,
                    relationshipType: '',
                    factor: 2,
                    width: 2,
                    color: {
                      type: 'ColorPresetDto',
                      index: ColorPresetIndexDto._0,
                    },
                    radius: '10',
                    property: '',
                  },
                ],
              } satisfies Omit<
                UpdateScenarioRequestBodyDto,
                'postScenarioActions'
              > & {
                postScenarioActions: (Omit<
                  UpdateScenarioPostActionEntryDto,
                  'radius'
                > & { radius: string })[];
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
              message.includes('postScenarioActions'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects invalid color discriminator', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [
                  {
                    id: randomUUID(),
                    type: UpdateScenarioPostActionTypeDto.layout,
                    label: 'Layout',
                    circleRadius: 2000,
                    layoutAlgorithm:
                      UpdateScenarioPostActionLayoutAlgorithmDto.circle,
                    relationshipType: '',
                    factor: 2,
                    width: 2,
                    color: {
                      type: 'CustomColorDto',
                      index: ColorPresetIndexDto._0,
                    },
                    radius: 10,
                    property: '',
                  },
                ],
              } satisfies Omit<
                UpdateScenarioRequestBodyDto,
                'postScenarioActions'
              > & {
                postScenarioActions: (Omit<
                  UpdateScenarioPostActionEntryDto,
                  'color'
                > & {
                  color: Omit<
                    UpdateScenarioPostActionColorPresetDto,
                    'type'
                  > & {
                    type: string;
                  };
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
              message.includes('postScenarioActions'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects unknown color preset', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [
                  {
                    id: randomUUID(),
                    type: UpdateScenarioPostActionTypeDto.layout,
                    label: 'Layout',
                    circleRadius: 2000,
                    layoutAlgorithm:
                      UpdateScenarioPostActionLayoutAlgorithmDto.circle,
                    relationshipType: '',
                    factor: 2,
                    width: 2,
                    color: { type: 'ColorPresetDto', index: 99 },
                    radius: 10,
                    property: '',
                  },
                ],
              } satisfies Omit<
                UpdateScenarioRequestBodyDto,
                'postScenarioActions'
              > & {
                postScenarioActions: (Omit<
                  UpdateScenarioPostActionEntryDto,
                  'color'
                > & {
                  color: Omit<
                    UpdateScenarioPostActionColorPresetDto,
                    'index'
                  > & {
                    index: number;
                  };
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
              message.includes('postScenarioActions'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects unexpected post-action properties', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [
                  {
                    id: randomUUID(),
                    type: UpdateScenarioPostActionTypeDto.layout,
                    label: 'Layout',
                    circleRadius: 2000,
                    layoutAlgorithm:
                      UpdateScenarioPostActionLayoutAlgorithmDto.circle,
                    relationshipType: '',
                    factor: 2,
                    width: 2,
                    color: {
                      type: 'ColorPresetDto',
                      index: ColorPresetIndexDto._0,
                    },
                    radius: 10,
                    property: '',
                    unexpected: true,
                  },
                ],
              } satisfies Omit<
                UpdateScenarioRequestBodyDto,
                'postScenarioActions'
              > & {
                postScenarioActions: (UpdateScenarioPostActionEntryDto & {
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
              message.includes('postScenarioActions'),
            ),
          );
          const draftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([['Content-Type', 'application/json']]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', 'Bearer invalid-jwt'],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
        test('rejects a query referencing an unknown database', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [
                  {
                    id: randomUUID(),
                    query: 'MATCH (n) RETURN n',
                    databaseId: database,
                    isTableQuery: false,
                  },
                ],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a query referencing an unpublished database', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
              title: 'Query Database',
              databaseType: 'neo4j',
              project: project,
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
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [
                  {
                    id: randomUUID(),
                    query: 'MATCH (n) RETURN n',
                    databaseId: database,
                    isTableQuery: false,
                  },
                ],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a query referencing a database belonging to another project', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
              title: 'Query Database',
              databaseType: 'neo4j',
              project: otherProject,
            },
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [
                  {
                    id: randomUUID(),
                    query: 'MATCH (n) RETURN n',
                    databaseId: database,
                    isTableQuery: false,
                  },
                ],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${randomUUID()}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an unknown scenario', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${randomUUID()}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an unpublished scenario', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const unpublish: Response = await manager.unpublishDocument(
            'api::scenario.scenario',
            resource,
            {},
            testContext,
          );
          assert.equal(unpublish.status, 200);
          const draftResource: Response = await manager.readDocument(
            'api::scenario.scenario',
            resource,
            testContext,
          );
          assert.equal(draftResource.status, 200);
          z.object({ data: z.object({ publishedAt: z.null() }) }).parse(
            await draftResource.json(),
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a scenario belonging to another existing project', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${otherProject}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects unknown scenario group', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${randomUUID()}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects unpublished scenario group', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const unpublish: Response = await manager.unpublishDocument(
            'api::scenario-group.scenario-group',
            group,
            {},
            testContext,
          );
          assert.equal(unpublish.status, 200);
          const draftGroup: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            group,
            testContext,
          );
          assert.equal(draftGroup.status, 200);
          z.object({ data: z.object({ publishedAt: z.null() }) }).parse(
            await draftGroup.json(),
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a scenario belonging to another existing group', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const otherGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Other Group', project },
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${otherGroup}/scenario/${resource}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Scenario',
                description: 'Updated description',
                queries: [],
                parameters: [],
                postScenarioActions: [],
              } satisfies UpdateScenarioRequestBodyDto),
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const otherGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Other Group', project },
            testContext,
          );
          const draftChange: Response = await manager.updateDocument(
            'api::scenario.scenario',
            resource,
            { title: 'Draft Scenario', group: otherGroup },
            testContext,
          );
          assert.equal(draftChange.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
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
          const items: ScenarioDto[] | undefined =
            publishedState.scenarioGroups.find(
              (item: { id: string }): boolean => item.id === group,
            )?.scenarios;
          assert.ok(items != null);
          assert.equal(
            items.some((item: ScenarioDto): boolean => item.id === resource),
            false,
          );
          const stored: Response = await manager.readDocument(
            'api::scenario.scenario',
            resource,
            testContext,
          );
          assert.equal(stored.status, 404);
        });

        test('preserves a scenario outside the targeted parent', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const otherGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Other Group', project },
            testContext,
          );
          const control: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            { title: 'Unrelated Scenario', group: otherGroup },
            testContext,
          );
          const originalControlResponse: Response = await manager.readDocument(
            'api::scenario.scenario',
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
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
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
          const items: ScenarioDto[] | undefined =
            publishedState.scenarioGroups.find(
              (item: { id: string }): boolean => item.id === group,
            )?.scenarios;
          assert.ok(items != null);
          assert.equal(
            items.some((item: ScenarioDto): boolean => item.id === resource),
            false,
          );
          const stored: Response = await manager.readDocument(
            'api::scenario.scenario',
            resource,
            testContext,
          );
          assert.equal(stored.status, 404);
          const controlResponse: Response = await manager.readDocument(
            'api::scenario.scenario',
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
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
          const items: ScenarioDto[] | undefined =
            publishedState.scenarioGroups.find(
              (item: { id: string }): boolean => item.id === group,
            )?.scenarios;
          assert.ok(items != null);
          assert.equal(
            items.some((item: ScenarioDto): boolean => item.id === resource),
            false,
          );
          const stored: Response = await manager.readDocument(
            'api::scenario.scenario',
            resource,
            testContext,
          );
          assert.equal(stored.status, 404);
        });

        test('owner can delete a scenario', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
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
          const items: ScenarioDto[] | undefined =
            publishedState.scenarioGroups.find(
              (item: { id: string }): boolean => item.id === group,
            )?.scenarios;
          assert.ok(items != null);
          assert.equal(
            items.some((item: ScenarioDto): boolean => item.id === resource),
            false,
          );
          const stored: Response = await manager.readDocument(
            'api::scenario.scenario',
            resource,
            testContext,
          );
          assert.equal(stored.status, 404);
        });

        test('collaborator can delete a scenario', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
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
          const items: ScenarioDto[] | undefined =
            publishedState.scenarioGroups.find(
              (item: { id: string }): boolean => item.id === group,
            )?.scenarios;
          assert.ok(items != null);
          assert.equal(
            items.some((item: ScenarioDto): boolean => item.id === resource),
            false,
          );
          const stored: Response = await manager.readDocument(
            'api::scenario.scenario',
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          await manager.loginUser(owner.username, owner.password, testContext);
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${randomUUID()}/scenario-group/${group}/scenario/${resource}`,
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an unknown scenario', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${randomUUID()}`,
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects an unpublished scenario', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const unpublish: Response = await manager.unpublishDocument(
            'api::scenario.scenario',
            resource,
            {},
            testContext,
          );
          assert.equal(unpublish.status, 200);
          const draftResource: Response = await manager.readDocument(
            'api::scenario.scenario',
            resource,
            testContext,
          );
          assert.equal(draftResource.status, 200);
          z.object({ data: z.object({ publishedAt: z.null() }) }).parse(
            await draftResource.json(),
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a scenario belonging to another existing project', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
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
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${otherProject}/scenario-group/${group}/scenario/${resource}`,
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects unknown scenario group', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${randomUUID()}/scenario/${resource}`,
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects unpublished scenario group', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const unpublish: Response = await manager.unpublishDocument(
            'api::scenario-group.scenario-group',
            group,
            {},
            testContext,
          );
          assert.equal(unpublish.status, 200);
          const draftGroup: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            group,
            testContext,
          );
          assert.equal(draftGroup.status, 200);
          z.object({ data: z.object({ publishedAt: z.null() }) }).parse(
            await draftGroup.json(),
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${group}/scenario/${resource}`,
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
            { ...filters, status: 'published' },
            testContext,
          );
          assert.equal(publishedResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await publishedResponse.json()),
            originalPublished,
          );
        });

        test('rejects a scenario belonging to another existing group', async (testContext: TestContext): Promise<void> => {
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
          const group: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Scenario Group', project },
            testContext,
          );
          const resource: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              title: 'Original Scenario',
              description: 'Original description',
              group,
            },
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const otherGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Other Group', project },
            testContext,
          );
          const filters: Record<string, string> = {
            [`filters[group][documentId][$eq]`]: group,
            pageSize: '100',
            sort: 'documentId:asc',
          };
          const originalDraftResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
              'api::scenario.scenario',
              { ...filters, status: 'published' },
              testContext,
            );
          assert.equal(originalPublishedResponse.status, 200);
          const originalPublished: z.infer<typeof listStateSchema> =
            listStateSchema.parse(await originalPublishedResponse.json());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${otherGroup}/scenario/${resource}`,
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
            'api::scenario.scenario',
            { ...filters, status: 'draft' },
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          assert.deepEqual(
            listStateSchema.parse(await draftResponse.json()),
            originalDraft,
          );
          const publishedResponse: Response = await manager.readDocuments(
            'api::scenario.scenario',
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
