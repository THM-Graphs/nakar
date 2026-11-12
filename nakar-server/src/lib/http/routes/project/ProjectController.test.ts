import type { FixtureContext } from '../../../../e2e/FixtureContext';
import type { CreateProjectRequestBodyDto } from './dto/CreateProjectRequestBodyDto';
import type { UpdateProjectRequestBodyDto } from './dto/UpdateProjectRequestBodyDto';
import type { E2ETestApplicationUser } from '../../../../e2e/E2ETestApplicationUser';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { SuiteContext, TestContext } from 'node:test';
import { after, before, describe, test } from 'node:test';
import z from 'zod';
import { E2ETestManager } from '../../../../e2e/E2ETestManager';

import type { PostAuthResponseBodyDto } from '../auth/dto/PostAuthResponseBodyDto';
import type { ProjectPageDto } from './dto/ProjectPageDto';
import type { UserPreviewDto } from '../../../schema/dtos/UserPreviewDto';
import type { RoomDto } from '../../../schema/dtos/RoomDto';
import { RoomVisibilityDto } from '../../../schema/dtos/RoomVisibilityDto';
import type { DatabaseConnectionDto } from '../../../schema/dtos/DatabaseConnectionDto';
import { DatabaseConnectionDatabaseType } from '../database-connection/dto/DatabaseConnectionDatabaseType';
import type { ScenarioGroupDto } from '../../../schema/dtos/ScenarioGroupDto';
import type { CommonPropertyDto } from '../../../schema/dtos/CommonPropertyDto';

const userSchema: z.ZodType<UserPreviewDto> = z.strictObject({
  id: z.string().min(1),
  displayName: z.string().nullable(),
});
// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-assignment -- Zod validates the database type at runtime.
const databaseSchema: z.ZodType<DatabaseConnectionDto> = z.strictObject({
  id: z.string().min(1),
  title: z.string(),
  connectionUrl: z.string(),
  browserUrl: z.string(),
  database: z.string(),
  databaseType: z.enum(DatabaseConnectionDatabaseType),
  language: z.string().nullable(),
  nodeConfigurations: z.array(z.never()),
});
const scenarioGroupSchema: z.ZodType<ScenarioGroupDto> = z.strictObject({
  id: z.string().min(1),
  title: z.string(),
  scenarios: z.array(z.never()),
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
const roomSchema: z.ZodType<RoomDto> = z.strictObject({
  id: z.string().min(1),
  title: z.string(),
  visibility: z.enum(RoomVisibilityDto),
  canvases: z.array(
    z.strictObject({ id: z.string().min(1), title: z.string() }),
  ),
  joinCanvasId: z.string().min(1),
  projectId: z.string().min(1),
  databases: z.array(databaseSchema),
  activeUsers: z.array(userSchema),
});
const projectSchema: z.ZodType<ProjectPageDto> = z.strictObject({
  id: z.string().min(1),
  title: z.string(),
  owner: userSchema.nullable(),
  collaborators: z.array(userSchema),
  databases: z.array(databaseSchema),
  scenarioGroups: z.array(scenarioGroupSchema),
  rooms: z.array(roomSchema),
  commonProperties: z.array(commonPropertySchema),
});

describe('/project', (suiteContext: SuiteContext): void => {
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
      test('creates a project owned by the authenticated user', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );

        // when
        const response: Response = await fetch(`${manager.apiUrl}/project`, {
          method: 'POST',
          headers: new Headers([
            ['Authorization', `Bearer ${login.jwt}`],
            ['Content-Type', 'application/json'],
          ]),
          body: JSON.stringify({
            title: 'Created Project',
          } satisfies CreateProjectRequestBodyDto),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 201);
        const body: ProjectPageDto = projectSchema.parse(await response.json());
        assert.deepEqual(body, {
          id: body.id,
          title: 'Created Project',
          owner: { id: owner.documentId, displayName: owner.username },
          collaborators: [],
          databases: [],
          scenarioGroups: [],
          rooms: [],
          commonProperties: [],
        });
      });
    });
    describe('400', (): void => {
      test('rejects invalid project creation bodies', async (testContext: TestContext): Promise<void> => {
        const variants: {
          payload: Record<string, unknown>;
          expectedMessages: string[];
        }[] = [
          {
            payload: {},
            expectedMessages: ['title should not be empty'],
          },
          {
            payload: { title: '' },
            expectedMessages: ['title should not be empty'],
          },
          {
            payload: { title: 123 },
            expectedMessages: ['title must be a string'],
          },
          {
            payload: { title: null },
            expectedMessages: ['title should not be empty'],
          },
          {
            payload: { title: 'Test Project', unexpected: true },
            expectedMessages: ['property unexpected should not exist'],
          },
        ];
        for (const variant of variants) {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(`${manager.apiUrl}/project`, {
            method: 'POST',
            headers: new Headers([
              ['Authorization', `Bearer ${login.jwt}`],
              ['Content-Type', 'application/json'],
            ]),
            body: JSON.stringify(variant.payload),
            signal: testContext.signal,
          });

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
          // when
          const response: Response = await fetch(`${manager.apiUrl}/project`, {
            method: 'POST',
            body: JSON.stringify({
              title: 'Test Project',
            } satisfies CreateProjectRequestBodyDto),
            signal: testContext.signal,
            headers: new Headers(variant.headers),
          });

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
  });
  describe('/:projectId', (): void => {
    describe('GET', (): void => {
      describe('200', (): void => {
        test('returns the published owner despite draft reassignment and unrelated owners', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const unpublishedOwner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const draftOwner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const foreignOwner: E2ETestApplicationUser =
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
          const unpublishedProject: Response = await manager.createDocument(
            'api::project.project',
            {
              title: 'Unpublished Project',
              owner: unpublishedOwner.documentId,
              collaborators: [],
            },
            testContext,
          );
          assert.equal(unpublishedProject.status, 201);
          z.object({ data: z.object({ publishedAt: z.null() }) }).parse(
            await unpublishedProject.json(),
          );
          await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Other Project',
              owner: foreignOwner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const draftUpdate: Response = await manager.updateDocument(
            'api::project.project',
            project,
            { owner: draftOwner.documentId, title: 'Draft Project' },
            testContext,
          );
          assert.equal(draftUpdate.status, 200);
          const draftResponse: Response = await manager.readDocument(
            'api::project.project',
            project,
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          z.object({
            data: z.object({
              publishedAt: z.null(),
              title: z.literal('Draft Project'),
            }),
          }).parse(await draftResponse.json());
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: ProjectPageDto = projectSchema.parse(
            await response.json(),
          );
          assert.equal(body.id, project);
          assert.equal(body.title, 'Published Project');
          assert.deepEqual(body.owner, {
            id: owner.documentId,
            displayName: owner.username,
          });
          assert.notEqual(body.owner.id, unpublishedOwner.documentId);
          assert.notEqual(body.owner.id, draftOwner.documentId);
          assert.notEqual(body.owner.id, foreignOwner.documentId);
        });

        test('returns only collaborators assigned in the published project despite draft changes', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const normal: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const draftOnly: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const changed: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const foreign: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Published Project',
              owner: owner.documentId,
              collaborators: [normal.documentId, changed.documentId],
            },
            testContext,
          );
          await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Other Project',
              owner: owner.documentId,
              collaborators: [foreign.documentId],
            },
            testContext,
          );
          const draftUpdate: Response = await manager.updateDocument(
            'api::project.project',
            project,
            {
              title: 'Draft Project',
              collaborators: [normal.documentId, draftOnly.documentId],
            },
            testContext,
          );
          assert.equal(draftUpdate.status, 200);
          const draftResponse: Response = await manager.readDocument(
            'api::project.project',
            project,
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          z.object({
            data: z.object({
              publishedAt: z.null(),
              title: z.literal('Draft Project'),
            }),
          }).parse(await draftResponse.json());
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            changed.username,
            changed.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: ProjectPageDto = projectSchema.parse(
            await response.json(),
          );
          assert.equal(body.id, project);
          assert.equal(body.title, 'Published Project');
          const expected: UserPreviewDto[] = [
            { id: normal.documentId, displayName: normal.username },
            { id: changed.documentId, displayName: changed.username },
          ];
          assert.deepEqual(
            body.collaborators.toSorted(
              (left: UserPreviewDto, right: UserPreviewDto): number =>
                left.id.localeCompare(right.id),
            ),
            expected.toSorted(
              (left: UserPreviewDto, right: UserPreviewDto): number =>
                left.id.localeCompare(right.id),
            ),
          );
          assert.equal(
            body.collaborators.some(
              (item: UserPreviewDto): boolean =>
                item.id === draftOnly.documentId,
            ),
            false,
          );
          assert.equal(
            body.collaborators.some(
              (item: UserPreviewDto): boolean => item.id === foreign.documentId,
            ),
            false,
          );
        });

        test('returns only published databases of the project using published values', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Target Project',
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
          const normal: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Normal Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: 'bolt://normal.example.test:7687',
              browserUrl: 'https://normal.example.test/browser',
              database: 'normal',
              language: 'en',
            },
            testContext,
          );
          const unpublishedResponse: Response = await manager.createDocument(
            'api::database-connection.database-connection',
            { title: 'Unpublished Database', project, databaseType: 'neo4j' },
            testContext,
          );
          assert.equal(unpublishedResponse.status, 201);
          const unpublished: {
            data: { documentId: string; publishedAt: null };
          } = z
            .object({
              data: z.object({
                documentId: z.string().min(1),
                publishedAt: z.null(),
              }),
            })
            .parse(await unpublishedResponse.json());
          const changed: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Published Database',
              project,
              databaseType: 'sparql',
              connectionUrl: 'https://published.example.test/sparql',
              browserUrl: 'https://published.example.test/browser',
              database: 'published',
              language: 'de',
            },
            testContext,
          );
          const draftUpdate: Response = await manager.updateDocument(
            'api::database-connection.database-connection',
            changed,
            {
              title: 'Draft Database',
              project: otherProject,
              databaseType: 'wikidata',
              connectionUrl: 'https://draft.example.test/sparql',
              browserUrl: 'https://draft.example.test/browser',
              database: 'draft',
              language: 'fr',
            },
            testContext,
          );
          assert.equal(draftUpdate.status, 200);
          const draftResponse: Response = await manager.readDocument(
            'api::database-connection.database-connection',
            changed,
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          z.object({
            data: z.object({
              documentId: z.literal(changed),
              publishedAt: z.null(),
              title: z.literal('Draft Database'),
            }),
          }).parse(await draftResponse.json());
          const foreign: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Foreign Database',
              project: otherProject,
              databaseType: 'neo4j',
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: ProjectPageDto = projectSchema.parse(
            await response.json(),
          );
          assert.equal(body.id, project);

          const expected: DatabaseConnectionDto[] = [
            {
              id: normal,
              title: 'Normal Database',
              databaseType: DatabaseConnectionDatabaseType.neo4j,
              connectionUrl: 'bolt://normal.example.test:7687',
              browserUrl: 'https://normal.example.test/browser',
              database: 'normal',
              language: 'en',
              nodeConfigurations: [],
            },
            {
              id: changed,
              title: 'Published Database',
              databaseType: DatabaseConnectionDatabaseType.sparql,
              connectionUrl: 'https://published.example.test/sparql',
              browserUrl: 'https://published.example.test/browser',
              database: 'published',
              language: 'de',
              nodeConfigurations: [],
            },
          ];
          assert.deepEqual(
            body.databases.toSorted(
              (
                left: DatabaseConnectionDto,
                right: DatabaseConnectionDto,
              ): number => left.id.localeCompare(right.id),
            ),
            expected.toSorted(
              (
                left: DatabaseConnectionDto,
                right: DatabaseConnectionDto,
              ): number => left.id.localeCompare(right.id),
            ),
          );
          assert.equal(
            body.databases.some(
              (item: DatabaseConnectionDto): boolean =>
                item.id === unpublished.data.documentId,
            ),
            false,
          );
          assert.equal(
            body.databases.some(
              (item: DatabaseConnectionDto): boolean => item.id === foreign,
            ),
            false,
          );
        });

        test('returns only published scenario groups of the project using published values', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Target Project',
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
          const normal: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Normal Group', project },
            testContext,
          );
          const unpublishedResponse: Response = await manager.createDocument(
            'api::scenario-group.scenario-group',
            { title: 'Unpublished Group', project },
            testContext,
          );
          assert.equal(unpublishedResponse.status, 201);
          const unpublished: {
            data: { documentId: string; publishedAt: null };
          } = z
            .object({
              data: z.object({
                documentId: z.string().min(1),
                publishedAt: z.null(),
              }),
            })
            .parse(await unpublishedResponse.json());
          const changed: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Published Group', project },
            testContext,
          );
          const draftUpdate: Response = await manager.updateDocument(
            'api::scenario-group.scenario-group',
            changed,
            { title: 'Draft Group', project: otherProject },
            testContext,
          );
          assert.equal(draftUpdate.status, 200);
          const draftResponse: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            changed,
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          z.object({
            data: z.object({
              documentId: z.literal(changed),
              publishedAt: z.null(),
              title: z.literal('Draft Group'),
            }),
          }).parse(await draftResponse.json());
          const foreign: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Foreign Group', project: otherProject },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: ProjectPageDto = projectSchema.parse(
            await response.json(),
          );
          assert.equal(body.id, project);

          const expected: ScenarioGroupDto[] = [
            { id: normal, title: 'Normal Group', scenarios: [] },
            { id: changed, title: 'Published Group', scenarios: [] },
          ];
          assert.deepEqual(
            body.scenarioGroups.toSorted(
              (left: ScenarioGroupDto, right: ScenarioGroupDto): number =>
                left.id.localeCompare(right.id),
            ),
            expected.toSorted(
              (left: ScenarioGroupDto, right: ScenarioGroupDto): number =>
                left.id.localeCompare(right.id),
            ),
          );
          assert.equal(
            body.scenarioGroups.some(
              (item: ScenarioGroupDto): boolean =>
                item.id === unpublished.data.documentId,
            ),
            false,
          );
          assert.equal(
            body.scenarioGroups.some(
              (item: ScenarioGroupDto): boolean => item.id === foreign,
            ),
            false,
          );
        });

        test('returns only published common properties of the project using published values', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Target Project',
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
          const leftDatabase: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Left Database',
              project,
              databaseType: 'neo4j',
              connectionUrl: 'bolt://left.example.test:7687',
              browserUrl: 'https://left.example.test/browser',
              database: 'left',
              language: 'en',
            },
            testContext,
          );
          const rightDatabase: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Right Database',
              project,
              databaseType: 'sparql',
              connectionUrl: 'https://right.example.test/sparql',
              browserUrl: 'https://right.example.test/browser',
              database: 'right',
              language: 'de',
            },
            testContext,
          );
          const foreignDatabase: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              title: 'Foreign Database',
              project: otherProject,
              databaseType: 'neo4j',
            },
            testContext,
          );
          const normal: string = await manager.createPublishedDocument(
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Normal Left',
              leftProperty: 'normalLeft',
              rightLabel: 'Normal Right',
              rightProperty: 'normalRight',
              leftDatabase,
              rightDatabase,
            },
            testContext,
          );
          const unpublishedResponse: Response = await manager.createDocument(
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Unpublished Left',
              leftProperty: 'unpublishedLeft',
              rightLabel: 'Unpublished Right',
              rightProperty: 'unpublishedRight',
              leftDatabase,
              rightDatabase,
            },
            testContext,
          );
          assert.equal(unpublishedResponse.status, 201);
          const unpublished: {
            data: { documentId: string; publishedAt: null };
          } = z
            .object({
              data: z.object({
                documentId: z.string().min(1),
                publishedAt: z.null(),
              }),
            })
            .parse(await unpublishedResponse.json());
          const changed: string = await manager.createPublishedDocument(
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Published Left',
              leftProperty: 'publishedLeft',
              rightLabel: 'Published Right',
              rightProperty: 'publishedRight',
              leftDatabase: rightDatabase,
              rightDatabase: leftDatabase,
            },
            testContext,
          );
          const draftUpdate: Response = await manager.updateDocument(
            'api::common-property.common-property',
            changed,
            {
              project: otherProject,
              leftLabel: 'Draft Left',
              leftProperty: 'draftLeft',
              rightLabel: 'Draft Right',
              rightProperty: 'draftRight',
              leftDatabase: foreignDatabase,
              rightDatabase: foreignDatabase,
            },
            testContext,
          );
          assert.equal(draftUpdate.status, 200);
          const draftResponse: Response = await manager.readDocument(
            'api::common-property.common-property',
            changed,
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          z.object({
            data: z.object({
              documentId: z.literal(changed),
              publishedAt: z.null(),
              leftLabel: z.literal('Draft Left'),
              leftProperty: z.literal('draftLeft'),
              rightLabel: z.literal('Draft Right'),
              rightProperty: z.literal('draftRight'),
            }),
          }).parse(await draftResponse.json());
          const foreign: string = await manager.createPublishedDocument(
            'api::common-property.common-property',
            {
              project: otherProject,
              leftLabel: 'Foreign Left',
              leftProperty: 'foreignLeft',
              rightLabel: 'Foreign Right',
              rightProperty: 'foreignRight',
              leftDatabase: foreignDatabase,
              rightDatabase: foreignDatabase,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: ProjectPageDto = projectSchema.parse(
            await response.json(),
          );
          assert.equal(body.id, project);

          const expectedLeftDatabase: DatabaseConnectionDto = {
            id: leftDatabase,
            title: 'Left Database',
            connectionUrl: 'bolt://left.example.test:7687',
            browserUrl: 'https://left.example.test/browser',
            database: 'left',
            databaseType: DatabaseConnectionDatabaseType.neo4j,
            language: 'en',
            nodeConfigurations: [],
          };
          const expectedRightDatabase: DatabaseConnectionDto = {
            id: rightDatabase,
            title: 'Right Database',
            connectionUrl: 'https://right.example.test/sparql',
            browserUrl: 'https://right.example.test/browser',
            database: 'right',
            databaseType: DatabaseConnectionDatabaseType.sparql,
            language: 'de',
            nodeConfigurations: [],
          };
          const expected: CommonPropertyDto[] = [
            {
              id: normal,
              leftLabel: 'Normal Left',
              leftProperty: 'normalLeft',
              rightLabel: 'Normal Right',
              rightProperty: 'normalRight',
              leftDatabase: expectedLeftDatabase,
              rightDatabase: expectedRightDatabase,
            },
            {
              id: changed,
              leftLabel: 'Published Left',
              leftProperty: 'publishedLeft',
              rightLabel: 'Published Right',
              rightProperty: 'publishedRight',
              leftDatabase: expectedRightDatabase,
              rightDatabase: expectedLeftDatabase,
            },
          ];
          assert.deepEqual(
            body.commonProperties.toSorted(
              (left: CommonPropertyDto, right: CommonPropertyDto): number =>
                left.id.localeCompare(right.id),
            ),
            expected.toSorted(
              (left: CommonPropertyDto, right: CommonPropertyDto): number =>
                left.id.localeCompare(right.id),
            ),
          );
          assert.equal(
            body.commonProperties.some(
              (item: CommonPropertyDto): boolean =>
                item.id === unpublished.data.documentId,
            ),
            false,
          );
          assert.equal(
            body.commonProperties.some(
              (item: CommonPropertyDto): boolean => item.id === foreign,
            ),
            false,
          );
        });

        test('returns only published rooms of the project using published values', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Target Project',
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
          const normal: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Normal Room',
              project,
              visibility: RoomVisibilityDto.private,
            },
            testContext,
          );
          const unpublishedResponse: Response = await manager.createDocument(
            'api::room.room',
            {
              title: 'Unpublished Room',
              project,
              visibility: RoomVisibilityDto.public,
            },
            testContext,
          );
          assert.equal(unpublishedResponse.status, 201);
          const unpublished: {
            data: { documentId: string; publishedAt: null };
          } = z
            .object({
              data: z.object({
                documentId: z.string().min(1),
                publishedAt: z.null(),
              }),
            })
            .parse(await unpublishedResponse.json());
          const changed: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Published Room',
              project,
              visibility: RoomVisibilityDto.public,
            },
            testContext,
          );
          const draftUpdate: Response = await manager.updateDocument(
            'api::room.room',
            changed,
            {
              title: 'Draft Room',
              project: otherProject,
              visibility: RoomVisibilityDto.unlisted,
            },
            testContext,
          );
          assert.equal(draftUpdate.status, 200);
          const draftResponse: Response = await manager.readDocument(
            'api::room.room',
            changed,
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          z.object({
            data: z.object({
              documentId: z.literal(changed),
              publishedAt: z.null(),
              title: z.literal('Draft Room'),
              visibility: z.literal(RoomVisibilityDto.unlisted),
            }),
          }).parse(await draftResponse.json());
          const foreign: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Foreign Room',
              project: otherProject,
              visibility: RoomVisibilityDto.public,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: ProjectPageDto = projectSchema.parse(
            await response.json(),
          );
          assert.equal(body.id, project);
          const normalCanvasResponse: Response = await manager.readDocuments(
            'api::canvas.canvas',
            {
              [`filters[room][documentId][$eq]`]: normal,
              status: 'published',
              sort: 'createdAt:asc,id:asc',
            },
            testContext,
          );
          assert.equal(normalCanvasResponse.status, 200);
          const normalCanvases: {
            results: { documentId: string; title: string }[];
          } = z
            .object({
              results: z.array(
                z.object({ documentId: z.string().min(1), title: z.string() }),
              ),
            })
            .parse(await normalCanvasResponse.json());
          assert.equal(normalCanvases.results.length, 1);
          const changedCanvasResponse: Response = await manager.readDocuments(
            'api::canvas.canvas',
            {
              [`filters[room][documentId][$eq]`]: changed,
              status: 'published',
              sort: 'createdAt:asc,id:asc',
            },
            testContext,
          );
          assert.equal(changedCanvasResponse.status, 200);
          const changedCanvases: {
            results: { documentId: string; title: string }[];
          } = z
            .object({
              results: z.array(
                z.object({ documentId: z.string().min(1), title: z.string() }),
              ),
            })
            .parse(await changedCanvasResponse.json());
          assert.equal(changedCanvases.results.length, 1);
          const expected: RoomDto[] = [
            {
              id: normal,
              title: 'Normal Room',
              visibility: RoomVisibilityDto.private,
              projectId: project,
              canvases: normalCanvases.results.map(
                (item: {
                  documentId: string;
                  title: string;
                }): { id: string; title: string } => ({
                  id: item.documentId,
                  title: item.title,
                }),
              ),
              joinCanvasId: normalCanvases.results[0].documentId,
              databases: [],
              activeUsers: [],
            },
            {
              id: changed,
              title: 'Published Room',
              visibility: RoomVisibilityDto.public,
              projectId: project,
              canvases: changedCanvases.results.map(
                (item: {
                  documentId: string;
                  title: string;
                }): { id: string; title: string } => ({
                  id: item.documentId,
                  title: item.title,
                }),
              ),
              joinCanvasId: changedCanvases.results[0].documentId,
              databases: [],
              activeUsers: [],
            },
          ];
          assert.deepEqual(
            body.rooms.toSorted((left: RoomDto, right: RoomDto): number =>
              left.id.localeCompare(right.id),
            ),
            expected.toSorted((left: RoomDto, right: RoomDto): number =>
              left.id.localeCompare(right.id),
            ),
          );
          assert.equal(
            body.rooms.some(
              (item: RoomDto): boolean =>
                item.id === unpublished.data.documentId,
            ),
            false,
          );
          assert.equal(
            body.rooms.some((item: RoomDto): boolean => item.id === foreign),
            false,
          );
        });

        test('owner can read the project', async (testContext: TestContext): Promise<void> => {
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
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              method: 'GET',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: ProjectPageDto = projectSchema.parse(
            await response.json(),
          );
          assert.deepEqual(body, {
            id: project,
            title: 'Test Project',
            owner: { id: owner.documentId, displayName: owner.username },
            collaborators: [],
            databases: [],
            scenarioGroups: [],
            rooms: [],
            commonProperties: [],
          });
        });

        test('collaborator can read the project', async (testContext: TestContext): Promise<void> => {
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
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              method: 'GET',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: ProjectPageDto = projectSchema.parse(
            await response.json(),
          );
          assert.deepEqual(body, {
            id: project,
            title: 'Test Project',
            owner: { id: owner.documentId, displayName: owner.username },
            collaborators: [
              {
                id: collaborator.documentId,
                displayName: collaborator.username,
              },
            ],
            databases: [],
            scenarioGroups: [],
            rooms: [],
            commonProperties: [],
          });
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

            // when
            const response: Response = await fetch(
              `${manager.apiUrl}/project/${fixture.projectId}`,
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
        test('draft collaborator has no access', async (testContext: TestContext): Promise<void> => {
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

          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const update: Response = await manager.updateDocument(
            'api::project.project',
            project,
            {
              title: 'Draft Title',
              collaborators: [collaborator.documentId],
            },
            testContext,
          );
          assert.equal(update.status, 200, await update.text());
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 403);
          const startResponse: Response = await fetch(manager.apiUrl, {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          });
          assert.equal(startResponse.status, 200);
          const startBody: {
            collaborationProjects: { id: string; title: string }[];
          } = z
            .object({
              collaborationProjects: z.array(
                z.object({ id: z.string(), title: z.string() }),
              ),
            })
            .parse(await startResponse.json());
          assert.deepEqual(startBody.collaborationProjects, []);
        });

        test('rejects other project owner access', async (testContext: TestContext): Promise<void> => {
          // given
          const actor: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const sourceProject: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Source Project',
              owner: actor.documentId,
              collaborators: [],
            },
            testContext,
          );
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Target Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            actor.username,
            actor.password,
            testContext,
          );
          const authorized: Response = await fetch(
            `${manager.apiUrl}/project/${sourceProject}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );
          assert.equal(authorized.status, 200);
          await authorized.body?.cancel();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
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
            error: 'Forbidden',
            message: 'Forbidden resource',
          });
        });

        test('rejects other project collaborator access', async (testContext: TestContext): Promise<void> => {
          // given
          const actor: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const sourceOwner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const sourceProject: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Source Project',
              owner: sourceOwner.documentId,
              collaborators: [actor.documentId],
            },
            testContext,
          );
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Target Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            actor.username,
            actor.password,
            testContext,
          );
          const authorized: Response = await fetch(
            `${manager.apiUrl}/project/${sourceProject}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );
          assert.equal(authorized.status, 200);
          await authorized.body?.cancel();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
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
            error: 'Forbidden',
            message: 'Forbidden resource',
          });
        });

        test('rejects removed collaborator access', async (testContext: TestContext): Promise<void> => {
          // Move this test when there is a custom route for revoking access.

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
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const authorized: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );
          assert.equal(authorized.status, 200);
          assert.deepEqual(
            projectSchema.parse(await authorized.json()).collaborators,
            [
              {
                id: collaborator.documentId,
                displayName: collaborator.username,
              },
            ],
          );
          const removal: Response = await manager.publishDocument(
            'api::project.project',
            project,
            { collaborators: [] },
            testContext,
          );
          assert.equal(removal.status, 200, await removal.text());
          const revoked: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(revoked.status, 200);
          assert.deepEqual(
            projectSchema.parse(await revoked.json()).collaborators,
            [],
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
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
            error: 'Forbidden',
            message: 'Forbidden resource',
          });
        });

        test('rejects outsider access', async (testContext: TestContext): Promise<void> => {
          // given
          const fixture: FixtureContext =
            await manager.setupFixture(testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            fixture.outsider.username,
            fixture.outsider.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${fixture.projectId}`,
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
            error: 'Forbidden',
            message: 'Forbidden resource',
          });
        });

        test('public rooms do not grant outsiders project access', async (testContext: TestContext): Promise<void> => {
          // given
          const fixture: FixtureContext =
            await manager.setupFixture(testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            fixture.outsider.username,
            fixture.outsider.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${fixture.projectId}`,
            {
              method: 'GET',
              headers: new Headers([['authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            error: 'Forbidden',
            message: 'Forbidden resource',
          });
        });
      });
      describe('404', (): void => {
        test('rejects a draft project even for its owner', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const creation: Response = await manager.createDocument(
            'api::project.project',
            {
              title: 'Draft Project',
              owner: owner.documentId,
            },
            testContext,
          );
          assert.equal(creation.status, 201);
          const draft: { data: { documentId: string; publishedAt: null } } = z
            .object({
              data: z.object({
                documentId: z.string().min(1),
                publishedAt: z.null(),
              }),
            })
            .parse(await creation.json());
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${draft.data.documentId}`,
            {
              method: 'GET',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
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

        test('rejects an unknown project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${randomUUID()}`,
            {
              method: 'GET',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
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
    describe('PUT', (): void => {
      describe('200', (): void => {
        test('uses the published assignment despite draft reassignment', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const draftOwner: E2ETestApplicationUser =
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
          const draft: Response = await manager.updateDocument(
            'api::project.project',
            project,
            { title: 'Draft Project', owner: draftOwner.documentId },
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
            `${manager.apiUrl}/project/${project}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Project',
              } satisfies UpdateProjectRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: ProjectPageDto = projectSchema.parse(
            await response.json(),
          );
          assert.equal(body.id, project);
          assert.equal(body.title, 'Updated Project');
          assert.deepEqual(body.owner, {
            id: owner.documentId,
            displayName: owner.username,
          });
          const persisted: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );
          assert.equal(persisted.status, 200);
          assert.deepEqual(projectSchema.parse(await persisted.json()), body);
        });

        test('owner can update the title', async (testContext: TestContext): Promise<void> => {
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
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Changed Project',
              } satisfies UpdateProjectRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          const persisted: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          assert.equal(response.status, 200);
          const body: ProjectPageDto = projectSchema.parse(
            await response.json(),
          );
          assert.deepEqual(body, {
            id: project,
            title: 'Changed Project',
            owner: { id: owner.documentId, displayName: owner.username },
            collaborators: [],
            databases: [],
            scenarioGroups: [],
            rooms: [],
            commonProperties: [],
          });
          assert.equal(persisted.status, 200);
          assert.deepEqual(await persisted.json(), body);
        });

        test('collaborator can update the title', async (testContext: TestContext): Promise<void> => {
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
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Changed Project',
              } satisfies UpdateProjectRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          const persisted: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          assert.equal(response.status, 200);
          const body: ProjectPageDto = projectSchema.parse(
            await response.json(),
          );
          assert.deepEqual(body, {
            id: project,
            title: 'Changed Project',
            owner: { id: owner.documentId, displayName: owner.username },
            collaborators: [
              {
                id: collaborator.documentId,
                displayName: collaborator.username,
              },
            ],
            databases: [],
            scenarioGroups: [],
            rooms: [],
            commonProperties: [],
          });
          assert.equal(persisted.status, 200);
          assert.deepEqual(await persisted.json(), body);
        });
      });
      describe('400', (): void => {
        test('rejects invalid project update bodies', async (testContext: TestContext): Promise<void> => {
          const variants: {
            payload: Record<string, unknown>;
            expectedMessages: string[];
          }[] = [
            {
              payload: {},
              expectedMessages: ['title should not be empty'],
            },
            {
              payload: { title: '' },
              expectedMessages: ['title should not be empty'],
            },
            {
              payload: { title: 123 },
              expectedMessages: ['title must be a string'],
            },
            {
              payload: { title: null },
              expectedMessages: ['title should not be empty'],
            },
            {
              payload: { title: 'Test Project', unexpected: true },
              expectedMessages: ['property unexpected should not exist'],
            },
          ];
          for (const variant of variants) {
            // given
            const fixture: FixtureContext =
              await manager.setupFixture(testContext);
            const login: PostAuthResponseBodyDto = await manager.loginUser(
              fixture.owner.username,
              fixture.owner.password,
              testContext,
            );
            const originalResponse: Response = await fetch(
              `${manager.apiUrl}/project/${fixture.projectId}`,
              {
                headers: new Headers([
                  ['Authorization', `Bearer ${login.jwt}`],
                ]),
                signal: testContext.signal,
              },
            );
            assert.equal(originalResponse.status, 200);
            const original: unknown = await originalResponse.json();

            // when
            const response: Response = await fetch(
              `${manager.apiUrl}/project/${fixture.projectId}`,
              {
                method: 'PUT',
                headers: new Headers([
                  ['Authorization', `Bearer ${login.jwt}`],
                  ['Content-Type', 'application/json'],
                ]),
                body: JSON.stringify(variant.payload),
                signal: testContext.signal,
              },
            );

            // then
            const unchanged: Response = await fetch(
              `${manager.apiUrl}/project/${fixture.projectId}`,
              {
                headers: new Headers([
                  ['Authorization', `Bearer ${login.jwt}`],
                ]),
                signal: testContext.signal,
              },
            );

            assert.equal(response.status, 400);
            assert.deepEqual(await response.json(), {
              statusCode: 400,
              error: 'Bad Request',
              message: variant.expectedMessages,
            });
            assert.equal(unchanged.status, 200);
            assert.deepEqual(await unchanged.json(), original);
          }
        });
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
            const login: PostAuthResponseBodyDto = await manager.loginUser(
              fixture.owner.username,
              fixture.owner.password,
              testContext,
            );
            const originalResponse: Response = await fetch(
              `${manager.apiUrl}/project/${fixture.projectId}`,
              {
                headers: new Headers([
                  ['Authorization', `Bearer ${login.jwt}`],
                ]),
                signal: testContext.signal,
              },
            );
            assert.equal(originalResponse.status, 200);
            const original: unknown = await originalResponse.json();

            // when
            const response: Response = await fetch(
              `${manager.apiUrl}/project/${fixture.projectId}`,
              {
                method: 'PUT',
                body: JSON.stringify({
                  title: 'Changed Project',
                } satisfies UpdateProjectRequestBodyDto),
                signal: testContext.signal,
                headers: new Headers(variant.headers),
              },
            );

            // then
            const unchanged: Response = await fetch(
              `${manager.apiUrl}/project/${fixture.projectId}`,
              {
                headers: new Headers([
                  ['Authorization', `Bearer ${login.jwt}`],
                ]),
                signal: testContext.signal,
              },
            );

            assert.equal(response.status, 401);
            assert.equal(response.headers.get('www-authenticate'), 'Bearer');
            assert.deepEqual(await response.json(), {
              statusCode: 401,
              message: 'Unauthorized',
            });
            assert.equal(unchanged.status, 200);
            assert.deepEqual(await unchanged.json(), original);
          }
        });
      });

      describe('403', (): void => {
        test('rejects other project owner access', async (testContext: TestContext): Promise<void> => {
          // given
          const actor: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const sourceProject: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Source Project',
              owner: actor.documentId,
              collaborators: [],
            },
            testContext,
          );
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Target Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            actor.username,
            actor.password,
            testContext,
          );
          const authorized: Response = await fetch(
            `${manager.apiUrl}/project/${sourceProject}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );
          assert.equal(authorized.status, 200);
          await authorized.body?.cancel();
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Unauthorized Change',
              } satisfies UpdateProjectRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            error: 'Forbidden',
            message: 'Forbidden resource',
          });
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), {
            id: project,
            title: 'Target Project',
            owner: { id: owner.documentId, displayName: owner.username },
            collaborators: [],
            databases: [],
            scenarioGroups: [],
            rooms: [],
            commonProperties: [],
          });
        });

        test('rejects other project collaborator access', async (testContext: TestContext): Promise<void> => {
          // given
          const actor: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const sourceOwner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const sourceProject: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Source Project',
              owner: sourceOwner.documentId,
              collaborators: [actor.documentId],
            },
            testContext,
          );
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Target Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            actor.username,
            actor.password,
            testContext,
          );
          const authorized: Response = await fetch(
            `${manager.apiUrl}/project/${sourceProject}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );
          assert.equal(authorized.status, 200);
          await authorized.body?.cancel();
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Unauthorized Change',
              } satisfies UpdateProjectRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            error: 'Forbidden',
            message: 'Forbidden resource',
          });
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), {
            id: project,
            title: 'Target Project',
            owner: { id: owner.documentId, displayName: owner.username },
            collaborators: [],
            databases: [],
            scenarioGroups: [],
            rooms: [],
            commonProperties: [],
          });
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
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const authorized: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );
          assert.equal(authorized.status, 200);
          assert.deepEqual(
            projectSchema.parse(await authorized.json()).collaborators,
            [
              {
                id: collaborator.documentId,
                displayName: collaborator.username,
              },
            ],
          );
          const removal: Response = await manager.publishDocument(
            'api::project.project',
            project,
            { collaborators: [] },
            testContext,
          );
          assert.equal(removal.status, 200, await removal.text());
          const revoked: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(revoked.status, 200);
          assert.deepEqual(
            projectSchema.parse(await revoked.json()).collaborators,
            [],
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Unauthorized Change',
              } satisfies UpdateProjectRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            error: 'Forbidden',
            message: 'Forbidden resource',
          });
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), {
            id: project,
            title: 'Test Project',
            owner: { id: owner.documentId, displayName: owner.username },
            collaborators: [],
            databases: [],
            scenarioGroups: [],
            rooms: [],
            commonProperties: [],
          });
        });

        test('rejects outsider access', async (testContext: TestContext): Promise<void> => {
          // given
          const fixture: FixtureContext =
            await manager.setupFixture(testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            fixture.outsider.username,
            fixture.outsider.password,
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            fixture.owner.username,
            fixture.owner.password,
            testContext,
          );
          const originalResponse: Response = await fetch(
            `${manager.apiUrl}/project/${fixture.projectId}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(originalResponse.status, 200);
          const original: unknown = await originalResponse.json();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${fixture.projectId}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Changed Project',
              } satisfies UpdateProjectRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${fixture.projectId}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            error: 'Forbidden',
            message: 'Forbidden resource',
          });
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), original);
        });
      });
      describe('404', (): void => {
        test('rejects a draft project even for its owner', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const creation: Response = await manager.createDocument(
            'api::project.project',
            {
              title: 'Draft Project',
              owner: owner.documentId,
            },
            testContext,
          );
          assert.equal(creation.status, 201);
          const draft: { data: { documentId: string; publishedAt: null } } = z
            .object({
              data: z.object({
                documentId: z.string().min(1),
                publishedAt: z.null(),
              }),
            })
            .parse(await creation.json());
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${draft.data.documentId}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Changed Project',
              } satisfies UpdateProjectRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
          const storedDraft: Response = await manager.readDocument(
            'api::project.project',
            draft.data.documentId,
            testContext,
          );
          assert.equal(storedDraft.status, 200);
          z.object({
            data: z.object({
              documentId: z.literal(draft.data.documentId),
              title: z.literal('Draft Project'),
              publishedAt: z.null(),
            }),
          }).parse(await storedDraft.json());
        });

        test('rejects an unknown project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${randomUUID()}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Changed Project',
              } satisfies UpdateProjectRequestBodyDto),
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
    describe('DELETE', (): void => {
      describe('204', (): void => {
        test('uses the published assignment despite draft reassignment', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const draftOwner: E2ETestApplicationUser =
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
          const draft: Response = await manager.updateDocument(
            'api::project.project',
            project,
            { title: 'Draft Project', owner: draftOwner.documentId },
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
            `${manager.apiUrl}/project/${project}`,
            {
              method: 'DELETE',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          const persisted: Response = await manager.readDocument(
            'api::project.project',
            project,
            testContext,
          );
          assert.equal(persisted.status, 404);
        });

        test('deletes all common properties of the project and preserves those of other projects', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Target Project',
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

          const normal: string = await manager.createPublishedDocument(
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Normal Left',
              leftProperty: 'normalLeft',
              rightLabel: 'Normal Right',
              rightProperty: 'normalRight',
            },
            testContext,
          );
          const draftCreation: Response = await manager.createDocument(
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Draft Left',
              leftProperty: 'draftLeft',
              rightLabel: 'Draft Right',
              rightProperty: 'draftRight',
            },
            testContext,
          );
          assert.equal(draftCreation.status, 201);
          const unpublished: {
            data: { documentId: string; publishedAt: null };
          } = z
            .object({
              data: z.object({
                documentId: z.string().min(1),
                publishedAt: z.null(),
              }),
            })
            .parse(await draftCreation.json());
          const changed: string = await manager.createPublishedDocument(
            'api::common-property.common-property',
            {
              project,
              leftLabel: 'Published Left',
              leftProperty: 'publishedLeft',
              rightLabel: 'Published Right',
              rightProperty: 'publishedRight',
            },
            testContext,
          );
          const draftUpdate: Response = await manager.updateDocument(
            'api::common-property.common-property',
            changed,
            {
              leftLabel: 'Changed Draft Left',
              leftProperty: 'changedDraftLeft',
            },
            testContext,
          );
          assert.equal(draftUpdate.status, 200);
          const draftResponse: Response = await manager.readDocument(
            'api::common-property.common-property',
            changed,
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          z.object({
            data: z.object({
              documentId: z.literal(changed),
              publishedAt: z.null(),
              leftLabel: z.literal('Changed Draft Left'),
            }),
          }).parse(await draftResponse.json());
          const foreign: string = await manager.createPublishedDocument(
            'api::common-property.common-property',
            {
              project: otherProject,
              leftLabel: 'Foreign Left',
              leftProperty: 'foreignLeft',
              rightLabel: 'Foreign Right',
              rightProperty: 'foreignRight',
            },
            testContext,
          );
          const originalForeignResponse: Response = await manager.readDocument(
            'api::common-property.common-property',
            foreign,
            testContext,
          );
          assert.equal(originalForeignResponse.status, 200);
          const originalForeign: unknown = await originalForeignResponse.json();
          z.object({
            data: z.object({ documentId: z.literal(foreign) }),
          }).parse(originalForeign);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          const deletedProject: Response = await manager.readDocument(
            'api::project.project',
            project,
            testContext,
          );
          assert.equal(deletedProject.status, 404);
          const normalResponse: Response = await manager.readDocument(
            'api::common-property.common-property',
            normal,
            testContext,
          );
          const unpublishedResponse: Response = await manager.readDocument(
            'api::common-property.common-property',
            unpublished.data.documentId,
            testContext,
          );
          const changedResponse: Response = await manager.readDocument(
            'api::common-property.common-property',
            changed,
            testContext,
          );
          const foreignResponse: Response = await manager.readDocument(
            'api::common-property.common-property',
            foreign,
            testContext,
          );
          assert.deepEqual(
            {
              normal: normalResponse.status,
              unpublished: unpublishedResponse.status,
              changed: changedResponse.status,
              foreign: foreignResponse.status,
            },
            { normal: 404, unpublished: 404, changed: 404, foreign: 200 },
          );
          assert.deepEqual(await foreignResponse.json(), originalForeign);
          const remainingProject: Response = await manager.readDocument(
            'api::project.project',
            otherProject,
            testContext,
          );
          assert.equal(remainingProject.status, 200);
          z.object({
            data: z.object({
              documentId: z.literal(otherProject),
              title: z.literal('Other Project'),
            }),
          }).parse(await remainingProject.json());
        });

        test('deletes all database connections of the project and preserves those of other projects', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Target Project',
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

          const normal: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            { project, title: 'Normal Database', databaseType: 'neo4j' },
            testContext,
          );
          const draftCreation: Response = await manager.createDocument(
            'api::database-connection.database-connection',
            { project, title: 'Draft Database', databaseType: 'sparql' },
            testContext,
          );
          assert.equal(draftCreation.status, 201);
          const unpublished: {
            data: { documentId: string; publishedAt: null };
          } = z
            .object({
              data: z.object({
                documentId: z.string().min(1),
                publishedAt: z.null(),
              }),
            })
            .parse(await draftCreation.json());
          const changed: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            { project, title: 'Published Database', databaseType: 'neo4j' },
            testContext,
          );
          const draftUpdate: Response = await manager.updateDocument(
            'api::database-connection.database-connection',
            changed,
            { title: 'Changed Draft Database', database: 'changedDraft' },
            testContext,
          );
          assert.equal(draftUpdate.status, 200);
          const draftResponse: Response = await manager.readDocument(
            'api::database-connection.database-connection',
            changed,
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          z.object({
            data: z.object({
              documentId: z.literal(changed),
              publishedAt: z.null(),
              title: z.literal('Changed Draft Database'),
            }),
          }).parse(await draftResponse.json());
          const foreign: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              project: otherProject,
              title: 'Foreign Database',
              databaseType: 'neo4j',
            },
            testContext,
          );
          const originalForeignResponse: Response = await manager.readDocument(
            'api::database-connection.database-connection',
            foreign,
            testContext,
          );
          assert.equal(originalForeignResponse.status, 200);
          const originalForeign: unknown = await originalForeignResponse.json();
          z.object({
            data: z.object({ documentId: z.literal(foreign) }),
          }).parse(originalForeign);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          const deletedProject: Response = await manager.readDocument(
            'api::project.project',
            project,
            testContext,
          );
          assert.equal(deletedProject.status, 404);
          const normalResponse: Response = await manager.readDocument(
            'api::database-connection.database-connection',
            normal,
            testContext,
          );
          const unpublishedResponse: Response = await manager.readDocument(
            'api::database-connection.database-connection',
            unpublished.data.documentId,
            testContext,
          );
          const changedResponse: Response = await manager.readDocument(
            'api::database-connection.database-connection',
            changed,
            testContext,
          );
          const foreignResponse: Response = await manager.readDocument(
            'api::database-connection.database-connection',
            foreign,
            testContext,
          );
          assert.deepEqual(
            {
              normal: normalResponse.status,
              unpublished: unpublishedResponse.status,
              changed: changedResponse.status,
              foreign: foreignResponse.status,
            },
            { normal: 404, unpublished: 404, changed: 404, foreign: 200 },
          );
          assert.deepEqual(await foreignResponse.json(), originalForeign);
          const remainingProject: Response = await manager.readDocument(
            'api::project.project',
            otherProject,
            testContext,
          );
          assert.equal(remainingProject.status, 200);
          z.object({
            data: z.object({
              documentId: z.literal(otherProject),
              title: z.literal('Other Project'),
            }),
          }).parse(await remainingProject.json());
        });

        test('deletes all scenarios of the project and preserves those of other projects', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Target Project',
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
            { project, title: 'Published Group' },
            testContext,
          );
          const draftParentCreation: Response = await manager.createDocument(
            'api::scenario-group.scenario-group',
            { project, title: 'Draft Group' },
            testContext,
          );
          assert.equal(draftParentCreation.status, 201);
          const draftParent: {
            data: { documentId: string; publishedAt: null };
          } = z
            .object({
              data: z.object({
                documentId: z.string().min(1),
                publishedAt: z.null(),
              }),
            })
            .parse(await draftParentCreation.json());
          const otherGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { project: otherProject, title: 'Foreign Group' },
            testContext,
          );
          const normal: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              group,
              title: 'Normal Scenario',
              description: 'Normal description',
            },
            testContext,
          );
          const draftCreation: Response = await manager.createDocument(
            'api::scenario.scenario',
            {
              group: draftParent.data.documentId,
              title: 'Draft Scenario',
              description: 'Draft description',
            },
            testContext,
          );
          assert.equal(draftCreation.status, 201);
          const unpublished: {
            data: { documentId: string; publishedAt: null };
          } = z
            .object({
              data: z.object({
                documentId: z.string().min(1),
                publishedAt: z.null(),
              }),
            })
            .parse(await draftCreation.json());
          const changed: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              group,
              title: 'Published Scenario',
              description: 'Published description',
            },
            testContext,
          );
          const draftUpdate: Response = await manager.updateDocument(
            'api::scenario.scenario',
            changed,
            {
              title: 'Changed Draft Scenario',
              description: 'Changed draft description',
            },
            testContext,
          );
          assert.equal(draftUpdate.status, 200);
          const draftResponse: Response = await manager.readDocument(
            'api::scenario.scenario',
            changed,
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          z.object({
            data: z.object({
              documentId: z.literal(changed),
              publishedAt: z.null(),
              title: z.literal('Changed Draft Scenario'),
            }),
          }).parse(await draftResponse.json());
          const foreign: string = await manager.createPublishedDocument(
            'api::scenario.scenario',
            {
              group: otherGroup,
              title: 'Foreign Scenario',
              description: 'Foreign description',
            },
            testContext,
          );
          const originalForeignResponse: Response = await manager.readDocument(
            'api::scenario.scenario',
            foreign,
            testContext,
          );
          assert.equal(originalForeignResponse.status, 200);
          const originalForeign: unknown = await originalForeignResponse.json();
          z.object({
            data: z.object({ documentId: z.literal(foreign) }),
          }).parse(originalForeign);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          const deletedProject: Response = await manager.readDocument(
            'api::project.project',
            project,
            testContext,
          );
          assert.equal(deletedProject.status, 404);
          const normalResponse: Response = await manager.readDocument(
            'api::scenario.scenario',
            normal,
            testContext,
          );
          const unpublishedResponse: Response = await manager.readDocument(
            'api::scenario.scenario',
            unpublished.data.documentId,
            testContext,
          );
          const changedResponse: Response = await manager.readDocument(
            'api::scenario.scenario',
            changed,
            testContext,
          );
          const foreignResponse: Response = await manager.readDocument(
            'api::scenario.scenario',
            foreign,
            testContext,
          );
          assert.deepEqual(
            {
              normal: normalResponse.status,
              unpublished: unpublishedResponse.status,
              changed: changedResponse.status,
              foreign: foreignResponse.status,
            },
            { normal: 404, unpublished: 404, changed: 404, foreign: 200 },
          );
          assert.deepEqual(await foreignResponse.json(), originalForeign);
          const remainingProject: Response = await manager.readDocument(
            'api::project.project',
            otherProject,
            testContext,
          );
          assert.equal(remainingProject.status, 200);
          z.object({
            data: z.object({
              documentId: z.literal(otherProject),
              title: z.literal('Other Project'),
            }),
          }).parse(await remainingProject.json());
        });

        test('deletes all node configurations of the project and preserves those of other projects', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Target Project',
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
          const database: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            { project, title: 'Published Database', databaseType: 'neo4j' },
            testContext,
          );
          const draftParentCreation: Response = await manager.createDocument(
            'api::database-connection.database-connection',
            { project, title: 'Draft Database', databaseType: 'neo4j' },
            testContext,
          );
          assert.equal(draftParentCreation.status, 201);
          const draftParent: {
            data: { documentId: string; publishedAt: null };
          } = z
            .object({
              data: z.object({
                documentId: z.string().min(1),
                publishedAt: z.null(),
              }),
            })
            .parse(await draftParentCreation.json());
          const otherDatabase: string = await manager.createPublishedDocument(
            'api::database-connection.database-connection',
            {
              project: otherProject,
              title: 'Foreign Database',
              databaseType: 'neo4j',
            },
            testContext,
          );
          const normal: string = await manager.createPublishedDocument(
            'api::node-configuration.node-configuration',
            {
              database,
              type: 'link',
              label: 'Normal Label',
              property: 'normal',
              linkTemplate: 'https://example.test/normal/{value}',
              urlEncode: true,
              valueRegex: '.*',
            },
            testContext,
          );
          const draftCreation: Response = await manager.createDocument(
            'api::node-configuration.node-configuration',
            {
              database: draftParent.data.documentId,
              type: 'link',
              label: 'Draft Label',
              property: 'draft',
              linkTemplate: 'https://example.test/draft/{value}',
              urlEncode: false,
              valueRegex: '.*',
            },
            testContext,
          );
          assert.equal(draftCreation.status, 201);
          const unpublished: {
            data: { documentId: string; publishedAt: null };
          } = z
            .object({
              data: z.object({
                documentId: z.string().min(1),
                publishedAt: z.null(),
              }),
            })
            .parse(await draftCreation.json());
          const changed: string = await manager.createPublishedDocument(
            'api::node-configuration.node-configuration',
            {
              database,
              type: 'image',
              label: 'Published Label',
              property: 'published',
              linkTemplate: 'https://example.test/published/{value}',
              urlEncode: true,
              valueRegex: '.*',
            },
            testContext,
          );
          const draftUpdate: Response = await manager.updateDocument(
            'api::node-configuration.node-configuration',
            changed,
            { label: 'Changed Draft Label', property: 'changedDraft' },
            testContext,
          );
          assert.equal(draftUpdate.status, 200);
          const draftResponse: Response = await manager.readDocument(
            'api::node-configuration.node-configuration',
            changed,
            testContext,
          );
          assert.equal(draftResponse.status, 200);
          z.object({
            data: z.object({
              documentId: z.literal(changed),
              publishedAt: z.null(),
              label: z.literal('Changed Draft Label'),
            }),
          }).parse(await draftResponse.json());
          const foreign: string = await manager.createPublishedDocument(
            'api::node-configuration.node-configuration',
            {
              database: otherDatabase,
              type: 'link',
              label: 'Foreign Label',
              property: 'foreign',
              linkTemplate: 'https://example.test/foreign/{value}',
              urlEncode: false,
              valueRegex: '.*',
            },
            testContext,
          );
          const originalForeignResponse: Response = await manager.readDocument(
            'api::node-configuration.node-configuration',
            foreign,
            testContext,
          );
          assert.equal(originalForeignResponse.status, 200);
          const originalForeign: unknown = await originalForeignResponse.json();
          z.object({
            data: z.object({ documentId: z.literal(foreign) }),
          }).parse(originalForeign);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          const deletedProject: Response = await manager.readDocument(
            'api::project.project',
            project,
            testContext,
          );
          assert.equal(deletedProject.status, 404);
          const normalResponse: Response = await manager.readDocument(
            'api::node-configuration.node-configuration',
            normal,
            testContext,
          );
          const unpublishedResponse: Response = await manager.readDocument(
            'api::node-configuration.node-configuration',
            unpublished.data.documentId,
            testContext,
          );
          const changedResponse: Response = await manager.readDocument(
            'api::node-configuration.node-configuration',
            changed,
            testContext,
          );
          const foreignResponse: Response = await manager.readDocument(
            'api::node-configuration.node-configuration',
            foreign,
            testContext,
          );
          assert.deepEqual(
            {
              normal: normalResponse.status,
              unpublished: unpublishedResponse.status,
              changed: changedResponse.status,
              foreign: foreignResponse.status,
            },
            { normal: 404, unpublished: 404, changed: 404, foreign: 200 },
          );
          assert.deepEqual(await foreignResponse.json(), originalForeign);
          const remainingProject: Response = await manager.readDocument(
            'api::project.project',
            otherProject,
            testContext,
          );
          assert.equal(remainingProject.status, 200);
          z.object({
            data: z.object({
              documentId: z.literal(otherProject),
              title: z.literal('Other Project'),
            }),
          }).parse(await remainingProject.json());
        });

        test('deletes all scenario groups of the project and preserves groups of other projects', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Scenario Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const firstGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'First Group', project },
            testContext,
          );
          const secondGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Second Group', project },
            testContext,
          );
          const draftCreation: Response = await manager.createDocument(
            'api::scenario-group.scenario-group',
            { title: 'Draft Group', project },
            testContext,
          );
          assert.equal(draftCreation.status, 201);
          const draft: { data: { documentId: string; publishedAt: null } } = z
            .object({
              data: z.object({
                documentId: z.string().min(1),
                publishedAt: z.null(),
              }),
            })
            .parse(await draftCreation.json());
          const otherProject: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Other Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const otherGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Other Group', project: otherProject },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          const deletedProject: Response = await manager.readDocument(
            'api::project.project',
            project,
            testContext,
          );
          assert.equal(deletedProject.status, 404);
          const firstStored: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            firstGroup,
            testContext,
          );
          const secondStored: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            secondGroup,
            testContext,
          );
          const draftStored: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            draft.data.documentId,
            testContext,
          );
          const otherStored: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            otherGroup,
            testContext,
          );
          assert.deepEqual(
            {
              first: firstStored.status,
              second: secondStored.status,
              draft: draftStored.status,
              other: otherStored.status,
            },
            { first: 404, second: 404, draft: 404, other: 200 },
          );
          z.object({
            data: z.object({
              documentId: z.literal(otherGroup),
              title: z.literal('Other Group'),
            }),
          }).parse(await otherStored.json());
        });

        test('owner can delete the project', async (testContext: TestContext): Promise<void> => {
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
          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Project Room',
              visibility: RoomVisibilityDto.private,
              project: project,
            },
            testContext,
          );
          const draftCreation: Response = await manager.createDocument(
            'api::room.room',
            {
              title: 'Draft Project Room',
              visibility: RoomVisibilityDto.private,
              project: project,
            },
            testContext,
          );
          assert.equal(draftCreation.status, 201);
          const draft: { data: { documentId: string; publishedAt: null } } = z
            .object({
              data: z.object({
                documentId: z.string().min(1),
                publishedAt: z.null(),
              }),
            })
            .parse(await draftCreation.json());
          const otherProject: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Other Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const otherRoom: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Other Room',
              visibility: RoomVisibilityDto.private,
              project: otherProject,
            },
            testContext,
          );
          const draftReassignment: Response = await manager.updateDocument(
            'api::room.room',
            otherRoom,
            { project: project },
            testContext,
          );
          assert.equal(
            draftReassignment.status,
            200,
            await draftReassignment.text(),
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          const deleted: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          assert.equal(deleted.status, 404);
          assert.deepEqual(await deleted.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
          const deletedRoom: Response = await manager.readDocument(
            'api::room.room',
            room,
            testContext,
          );
          assert.equal(deletedRoom.status, 404, await deletedRoom.text());
          const deletedDraftRoom: Response = await manager.readDocument(
            'api::room.room',
            draft.data.documentId,
            testContext,
          );
          assert.equal(
            deletedDraftRoom.status,
            404,
            await deletedDraftRoom.text(),
          );
          const deletedReassignedRoom: Response = await manager.readDocument(
            'api::room.room',
            otherRoom,
            testContext,
          );
          assert.equal(
            deletedReassignedRoom.status,
            404,
            await deletedReassignedRoom.text(),
          );
        });

        test('collaborator can delete the project', async (testContext: TestContext): Promise<void> => {
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
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          const deleted: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          assert.equal(deleted.status, 404);
          assert.deepEqual(await deleted.json(), {
            statusCode: 404,

            message: 'Not Found',
          });
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
            const login: PostAuthResponseBodyDto = await manager.loginUser(
              fixture.owner.username,
              fixture.owner.password,
              testContext,
            );
            const originalResponse: Response = await fetch(
              `${manager.apiUrl}/project/${fixture.projectId}`,
              {
                headers: new Headers([
                  ['Authorization', `Bearer ${login.jwt}`],
                ]),
                signal: testContext.signal,
              },
            );
            assert.equal(originalResponse.status, 200);
            const original: unknown = await originalResponse.json();

            // when
            const response: Response = await fetch(
              `${manager.apiUrl}/project/${fixture.projectId}`,
              {
                method: 'DELETE',
                signal: testContext.signal,
                headers: new Headers(variant.headers),
              },
            );

            // then
            const unchanged: Response = await fetch(
              `${manager.apiUrl}/project/${fixture.projectId}`,
              {
                headers: new Headers([
                  ['Authorization', `Bearer ${login.jwt}`],
                ]),
                signal: testContext.signal,
              },
            );

            assert.equal(response.status, 401);
            assert.equal(response.headers.get('www-authenticate'), 'Bearer');
            assert.deepEqual(await response.json(), {
              statusCode: 401,
              message: 'Unauthorized',
            });
            assert.equal(unchanged.status, 200);
            assert.deepEqual(await unchanged.json(), original);
          }
        });
      });

      describe('403', (): void => {
        test('rejects other project owner access', async (testContext: TestContext): Promise<void> => {
          // given
          const actor: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const sourceProject: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Source Project',
              owner: actor.documentId,
              collaborators: [],
            },
            testContext,
          );
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Target Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            actor.username,
            actor.password,
            testContext,
          );
          const authorized: Response = await fetch(
            `${manager.apiUrl}/project/${sourceProject}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );
          assert.equal(authorized.status, 200);
          await authorized.body?.cancel();
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            error: 'Forbidden',
            message: 'Forbidden resource',
          });
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), {
            id: project,
            title: 'Target Project',
            owner: { id: owner.documentId, displayName: owner.username },
            collaborators: [],
            databases: [],
            scenarioGroups: [],
            rooms: [],
            commonProperties: [],
          });
        });

        test('rejects other project collaborator access', async (testContext: TestContext): Promise<void> => {
          // given
          const actor: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const sourceOwner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const sourceProject: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Source Project',
              owner: sourceOwner.documentId,
              collaborators: [actor.documentId],
            },
            testContext,
          );
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Target Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            actor.username,
            actor.password,
            testContext,
          );
          const authorized: Response = await fetch(
            `${manager.apiUrl}/project/${sourceProject}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );
          assert.equal(authorized.status, 200);
          await authorized.body?.cancel();
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            error: 'Forbidden',
            message: 'Forbidden resource',
          });
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), {
            id: project,
            title: 'Target Project',
            owner: { id: owner.documentId, displayName: owner.username },
            collaborators: [],
            databases: [],
            scenarioGroups: [],
            rooms: [],
            commonProperties: [],
          });
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
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const authorized: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );
          assert.equal(authorized.status, 200);
          assert.deepEqual(
            projectSchema.parse(await authorized.json()).collaborators,
            [
              {
                id: collaborator.documentId,
                displayName: collaborator.username,
              },
            ],
          );
          const removal: Response = await manager.publishDocument(
            'api::project.project',
            project,
            { collaborators: [] },
            testContext,
          );
          assert.equal(removal.status, 200, await removal.text());
          const revoked: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(revoked.status, 200);
          assert.deepEqual(
            projectSchema.parse(await revoked.json()).collaborators,
            [],
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            error: 'Forbidden',
            message: 'Forbidden resource',
          });
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), {
            id: project,
            title: 'Test Project',
            owner: { id: owner.documentId, displayName: owner.username },
            collaborators: [],
            databases: [],
            scenarioGroups: [],
            rooms: [],
            commonProperties: [],
          });
        });

        test('rejects outsider access', async (testContext: TestContext): Promise<void> => {
          // given
          const fixture: FixtureContext =
            await manager.setupFixture(testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            fixture.outsider.username,
            fixture.outsider.password,
            testContext,
          );
          const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
            fixture.owner.username,
            fixture.owner.password,
            testContext,
          );
          const originalResponse: Response = await fetch(
            `${manager.apiUrl}/project/${fixture.projectId}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(originalResponse.status, 200);
          const original: unknown = await originalResponse.json();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${fixture.projectId}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${fixture.projectId}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${ownerLogin.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            error: 'Forbidden',
            message: 'Forbidden resource',
          });
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), original);
        });
      });
      describe('404', (): void => {
        test('rejects a draft project even for its owner', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const creation: Response = await manager.createDocument(
            'api::project.project',
            {
              title: 'Draft Project',
              owner: owner.documentId,
            },
            testContext,
          );
          assert.equal(creation.status, 201);
          const draft: { data: { documentId: string; publishedAt: null } } = z
            .object({
              data: z.object({
                documentId: z.string().min(1),
                publishedAt: z.null(),
              }),
            })
            .parse(await creation.json());
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${draft.data.documentId}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
          const storedDraft: Response = await manager.readDocument(
            'api::project.project',
            draft.data.documentId,
            testContext,
          );
          assert.equal(storedDraft.status, 200);
          z.object({
            data: z.object({
              documentId: z.literal(draft.data.documentId),
              title: z.literal('Draft Project'),
              publishedAt: z.null(),
            }),
          }).parse(await storedDraft.json());
        });

        test('rejects an unknown project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${randomUUID()}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
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
});
