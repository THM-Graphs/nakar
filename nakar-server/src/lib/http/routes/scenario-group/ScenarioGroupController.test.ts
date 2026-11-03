import type { E2ETestApplicationUser } from '../../../../e2e/E2ETestApplicationUser';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { SuiteContext, TestContext } from 'node:test';
import { after, before, describe, test } from 'node:test';
import z from 'zod';
import { E2ETestManager } from '../../../../e2e/E2ETestManager';
import type { PostAuthResponseBodyDto } from '../auth/dto/PostAuthResponseBodyDto';
import type { ScenarioGroupDto } from '../../../schema/dtos/ScenarioGroupDto';

const scenarioGroupSchema: z.ZodType<ScenarioGroupDto> = z.strictObject({
  id: z.string().min(1),
  title: z.string(),
  scenarios: z.array(z.never()),
});

const scenarioGroupStateSchema: z.ZodType<{
  data: { documentId: string; title: string; publishedAt: string | null };
}> = z.object({
  data: z.object({
    documentId: z.string().min(1),
    title: z.string(),
    publishedAt: z.string().nullable(),
  }),
});

describe('/project/:projectId/scenario-group', (suiteContext: SuiteContext): void => {
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
      test('owner can create a scenario group', async (testContext: TestContext): Promise<void> => {
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
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/scenario-group`,
          {
            method: 'POST',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 201);
        const body: ScenarioGroupDto = scenarioGroupSchema.parse(
          await response.json(),
        );
        assert.deepEqual(body, {
          id: body.id,
          title: 'Untitled Scenario Group',
          scenarios: [],
        });
        const projectResponse: Response = await fetch(
          `${manager.apiUrl}/project/${project}`,
          {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );
        assert.equal(projectResponse.status, 200);
        const persisted: { scenarioGroups: ScenarioGroupDto[] } = z
          .object({ scenarioGroups: z.array(scenarioGroupSchema) })
          .parse(await projectResponse.json());
        assert.ok(
          persisted.scenarioGroups.some(
            (group: ScenarioGroupDto): boolean =>
              group.id === body.id && group.title === body.title,
          ),
        );
      });

      test('collaborator can create a scenario group', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const collaborator: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const project: string = await manager.createPublishedDocument(
          'api::project.project',
          {
            title: 'Scenario Project',
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
          `${manager.apiUrl}/project/${project}/scenario-group`,
          {
            method: 'POST',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 201);
        const body: ScenarioGroupDto = scenarioGroupSchema.parse(
          await response.json(),
        );
        assert.deepEqual(body, {
          id: body.id,
          title: 'Untitled Scenario Group',
          scenarios: [],
        });
        const projectResponse: Response = await fetch(
          `${manager.apiUrl}/project/${project}`,
          {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );
        assert.equal(projectResponse.status, 200);
        const persisted: { scenarioGroups: ScenarioGroupDto[] } = z
          .object({ scenarioGroups: z.array(scenarioGroupSchema) })
          .parse(await projectResponse.json());
        assert.ok(
          persisted.scenarioGroups.some(
            (group: ScenarioGroupDto): boolean =>
              group.id === body.id && group.title === body.title,
          ),
        );
      });
    });

    describe('403', (): void => {
      test('rejects outsider creation', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const outsider: E2ETestApplicationUser =
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
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          outsider.username,
          outsider.password,
          testContext,
        );

        const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const originalResponse: Response = await fetch(
          `${manager.apiUrl}/project/${project}`,
          {
            headers: new Headers([
              ['Authorization', `Bearer ${ownerLogin.jwt}`],
            ]),
            signal: testContext.signal,
          },
        );
        assert.equal(originalResponse.status, 200);
        const original: { scenarioGroups: ScenarioGroupDto[] } = z
          .object({ scenarioGroups: z.array(scenarioGroupSchema) })
          .parse(await originalResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/scenario-group`,
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
        const persisted: Response = await fetch(
          `${manager.apiUrl}/project/${project}`,
          {
            headers: new Headers([
              ['Authorization', `Bearer ${ownerLogin.jwt}`],
            ]),
            signal: testContext.signal,
          },
        );
        assert.equal(persisted.status, 200);
        assert.deepEqual(
          z
            .object({ scenarioGroups: z.array(scenarioGroupSchema) })
            .parse(await persisted.json()),
          original,
        );
      });

      test('rejects anonymous creation', async (testContext: TestContext): Promise<void> => {
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

        const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const originalResponse: Response = await fetch(
          `${manager.apiUrl}/project/${project}`,
          {
            headers: new Headers([
              ['Authorization', `Bearer ${ownerLogin.jwt}`],
            ]),
            signal: testContext.signal,
          },
        );
        assert.equal(originalResponse.status, 200);
        const original: { scenarioGroups: ScenarioGroupDto[] } = z
          .object({ scenarioGroups: z.array(scenarioGroupSchema) })
          .parse(await originalResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/scenario-group`,
          {
            method: 'POST',
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
        const persisted: Response = await fetch(
          `${manager.apiUrl}/project/${project}`,
          {
            headers: new Headers([
              ['Authorization', `Bearer ${ownerLogin.jwt}`],
            ]),
            signal: testContext.signal,
          },
        );
        assert.equal(persisted.status, 200);
        assert.deepEqual(
          z
            .object({ scenarioGroups: z.array(scenarioGroupSchema) })
            .parse(await persisted.json()),
          original,
        );
      });
    });

    describe('404', (): void => {
      test('rejects creating a scenario group in an unpublished project', async (testContext: TestContext): Promise<void> => {
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
        const unpublish: Response = await manager.unpublishDocument(
          'api::project.project',
          project,
          {},
          testContext,
        );
        assert.equal(unpublish.status, 200);
        const stored: Response = await manager.readDocument(
          'api::project.project',
          project,
          testContext,
        );
        assert.equal(stored.status, 200);
        z.object({ data: z.object({ publishedAt: z.null() }) }).parse(
          await stored.json(),
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/scenario-group`,
          {
            method: 'POST',
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

      test('rejects creating a scenario group in an unknown project', async (testContext: TestContext): Promise<void> => {
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
          `${manager.apiUrl}/project/${randomUUID()}/scenario-group`,
          {
            method: 'POST',
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

  describe('/:scenarioGroupId', (): void => {
    describe('PUT', (): void => {
      describe('200', (): void => {
        test('owner can update a scenario group', async (testContext: TestContext): Promise<void> => {
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
          const scenarioGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Original Group', project },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${scenarioGroup}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({ title: 'Updated Group' }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          assert.equal(await response.text(), '');
          const persisted: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            scenarioGroup,
            testContext,
          );
          assert.equal(persisted.status, 200);
          const body: z.infer<typeof scenarioGroupStateSchema> =
            scenarioGroupStateSchema.parse(await persisted.json());
          assert.equal(body.data.documentId, scenarioGroup);
          assert.equal(body.data.title, 'Updated Group');
        });

        test('collaborator can update a scenario group', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Scenario Project',
              owner: owner.documentId,
              collaborators: [collaborator.documentId],
            },
            testContext,
          );
          const scenarioGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Original Group', project },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${scenarioGroup}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({ title: 'Updated Group' }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const persisted: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            scenarioGroup,
            testContext,
          );
          assert.equal(persisted.status, 200);
          assert.equal(
            scenarioGroupStateSchema.parse(await persisted.json()).data.title,
            'Updated Group',
          );
        });
        test('accepts an empty title', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            { title: 'Project', owner: owner.documentId, collaborators: [] },
            testContext,
          );
          const scenarioGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Original Group', project },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${scenarioGroup}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({ title: '' }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const persisted: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            scenarioGroup,
            testContext,
          );
          assert.equal(persisted.status, 200);
          assert.equal(
            scenarioGroupStateSchema.parse(await persisted.json()).data.title,
            '',
          );
        });
      });
      describe('400', (): void => {
        test('rejects a missing title', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            { title: 'Project', owner: owner.documentId, collaborators: [] },
            testContext,
          );
          const scenarioGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Original Group', project },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${scenarioGroup}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({}),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const persisted: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            scenarioGroup,
            testContext,
          );
          assert.equal(persisted.status, 200);
          assert.equal(
            scenarioGroupStateSchema.parse(await persisted.json()).data.title,
            'Original Group',
          );
        });

        test('rejects a null title', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            { title: 'Project', owner: owner.documentId, collaborators: [] },
            testContext,
          );
          const scenarioGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Original Group', project },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${scenarioGroup}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({ title: null }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const persisted: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            scenarioGroup,
            testContext,
          );
          assert.equal(persisted.status, 200);
          assert.equal(
            scenarioGroupStateSchema.parse(await persisted.json()).data.title,
            'Original Group',
          );
        });

        test('rejects a non-string title', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            { title: 'Project', owner: owner.documentId, collaborators: [] },
            testContext,
          );
          const scenarioGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Original Group', project },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${scenarioGroup}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({ title: 123 }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const persisted: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            scenarioGroup,
            testContext,
          );
          assert.equal(persisted.status, 200);
          assert.equal(
            scenarioGroupStateSchema.parse(await persisted.json()).data.title,
            'Original Group',
          );
        });

        test('rejects unexpected properties', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            { title: 'Project', owner: owner.documentId, collaborators: [] },
            testContext,
          );
          const scenarioGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Original Group', project },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${scenarioGroup}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Updated Group',
                unexpected: true,
              }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          const persisted: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            scenarioGroup,
            testContext,
          );
          assert.equal(persisted.status, 200);
          assert.equal(
            scenarioGroupStateSchema.parse(await persisted.json()).data.title,
            'Original Group',
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
              title: 'Scenario Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const scenarioGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Original Group', project },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${scenarioGroup}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({ title: 'Updated Group' }),
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
          const persisted: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            scenarioGroup,
            testContext,
          );
          assert.equal(persisted.status, 200);
          const state: z.infer<typeof scenarioGroupStateSchema> =
            scenarioGroupStateSchema.parse(await persisted.json());
          assert.equal(state.data.documentId, scenarioGroup);
          assert.equal(state.data.title, 'Original Group');
        });

        test('rejects anonymous access', async (testContext: TestContext): Promise<void> => {
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
          const scenarioGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Original Group', project },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${scenarioGroup}`,
            {
              method: 'PUT',
              headers: new Headers([['Content-Type', 'application/json']]),
              body: JSON.stringify({ title: 'Updated Group' }),
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
          const persisted: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            scenarioGroup,
            testContext,
          );
          assert.equal(persisted.status, 200);
          const state: z.infer<typeof scenarioGroupStateSchema> =
            scenarioGroupStateSchema.parse(await persisted.json());
          assert.equal(state.data.documentId, scenarioGroup);
          assert.equal(state.data.title, 'Original Group');
        });
      });

      describe('404', (): void => {
        test('rejects a scenario group belonging to another project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            { title: 'Project', owner: owner.documentId, collaborators: [] },
            testContext,
          );
          const scenarioGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Original Group', project },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
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

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${otherProject}/scenario-group/${scenarioGroup}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({ title: 'Updated Group' }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
          const persisted: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            scenarioGroup,
            testContext,
          );
          assert.equal(persisted.status, 200);
          assert.equal(
            scenarioGroupStateSchema.parse(await persisted.json()).data.title,
            'Original Group',
          );
        });

        test('rejects updating a draft scenario group even for its owner', async (testContext: TestContext): Promise<void> => {
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
          const creation: Response = await manager.createDocument(
            'api::scenario-group.scenario-group',
            { title: 'Draft Group', project },
            testContext,
          );
          assert.equal(creation.status, 201);
          const scenarioGroup: string = z
            .object({
              data: z.object({ documentId: z.string(), publishedAt: z.null() }),
            })
            .parse(await creation.json()).data.documentId;
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${scenarioGroup}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({ title: 'Updated Group' }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
          const persisted: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            scenarioGroup,
            testContext,
          );
          assert.equal(persisted.status, 200);
          const state: z.infer<typeof scenarioGroupStateSchema> =
            scenarioGroupStateSchema.parse(await persisted.json());
          assert.equal(state.data.documentId, scenarioGroup);
          assert.equal(state.data.title, 'Draft Group');
          assert.equal(state.data.publishedAt, null);
        });

        test('rejects updating a published scenario group in a draft project', async (testContext: TestContext): Promise<void> => {
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
          const scenarioGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Original Group', project },
            testContext,
          );
          const unpublish: Response = await manager.unpublishDocument(
            'api::project.project',
            project,
            {},
            testContext,
          );
          assert.equal(unpublish.status, 200);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${scenarioGroup}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({ title: 'Updated Group' }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
          const persisted: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            scenarioGroup,
            testContext,
          );
          assert.equal(persisted.status, 200);
          const state: z.infer<typeof scenarioGroupStateSchema> =
            scenarioGroupStateSchema.parse(await persisted.json());
          assert.equal(state.data.documentId, scenarioGroup);
          assert.equal(state.data.title, 'Original Group');
        });

        test('rejects updating an unknown scenario group', async (testContext: TestContext): Promise<void> => {
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
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${randomUUID()}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({ title: 'Updated Group' }),
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

        test('rejects updating a known scenario group through an unknown project', async (testContext: TestContext): Promise<void> => {
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
          const scenarioGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Original Group', project },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${randomUUID()}/scenario-group/${scenarioGroup}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({ title: 'Updated Group' }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
          const persisted: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            scenarioGroup,
            testContext,
          );
          assert.equal(persisted.status, 200);
          const state: z.infer<typeof scenarioGroupStateSchema> =
            scenarioGroupStateSchema.parse(await persisted.json());
          assert.equal(state.data.documentId, scenarioGroup);
          assert.equal(state.data.title, 'Original Group');
        });
      });
    });

    describe('DELETE', (): void => {
      describe('200', (): void => {
        test('owner can delete a scenario group', async (testContext: TestContext): Promise<void> => {
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
          const scenarioGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Original Group', project },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${scenarioGroup}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          assert.equal(await response.text(), '');
          assert.equal(
            (
              await manager.readDocument(
                'api::scenario-group.scenario-group',
                scenarioGroup,
                testContext,
              )
            ).status,
            404,
          );
        });

        test('collaborator can delete a scenario group', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Scenario Project',
              owner: owner.documentId,
              collaborators: [collaborator.documentId],
            },
            testContext,
          );
          const scenarioGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Original Group', project },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${scenarioGroup}`,
            {
              method: 'DELETE',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          assert.equal(
            (
              await manager.readDocument(
                'api::scenario-group.scenario-group',
                scenarioGroup,
                testContext,
              )
            ).status,
            404,
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
              title: 'Scenario Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const scenarioGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Original Group', project },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${scenarioGroup}`,
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
          const persisted: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            scenarioGroup,
            testContext,
          );
          assert.equal(persisted.status, 200);
          const state: z.infer<typeof scenarioGroupStateSchema> =
            scenarioGroupStateSchema.parse(await persisted.json());
          assert.equal(state.data.documentId, scenarioGroup);
          assert.equal(state.data.title, 'Original Group');
        });

        test('rejects anonymous access', async (testContext: TestContext): Promise<void> => {
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
          const scenarioGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Original Group', project },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${scenarioGroup}`,
            { method: 'DELETE', signal: testContext.signal },
          );

          // then
          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            message: 'Forbidden resource',
            error: 'Forbidden',
          });
          const persisted: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            scenarioGroup,
            testContext,
          );
          assert.equal(persisted.status, 200);
          const state: z.infer<typeof scenarioGroupStateSchema> =
            scenarioGroupStateSchema.parse(await persisted.json());
          assert.equal(state.data.documentId, scenarioGroup);
          assert.equal(state.data.title, 'Original Group');
        });
      });

      describe('404', (): void => {
        test('rejects a scenario group belonging to another project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            { title: 'Project', owner: owner.documentId, collaborators: [] },
            testContext,
          );
          const scenarioGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Original Group', project },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
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

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${otherProject}/scenario-group/${scenarioGroup}`,
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
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
          const persisted: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            scenarioGroup,
            testContext,
          );
          assert.equal(persisted.status, 200);
          assert.equal(
            scenarioGroupStateSchema.parse(await persisted.json()).data.title,
            'Original Group',
          );
        });

        test('rejects deleting a draft scenario group even for its owner', async (testContext: TestContext): Promise<void> => {
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
          const creation: Response = await manager.createDocument(
            'api::scenario-group.scenario-group',
            { title: 'Draft Group', project },
            testContext,
          );
          assert.equal(creation.status, 201);
          const scenarioGroup: string = z
            .object({
              data: z.object({ documentId: z.string(), publishedAt: z.null() }),
            })
            .parse(await creation.json()).data.documentId;
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${scenarioGroup}`,
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
          const persisted: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            scenarioGroup,
            testContext,
          );
          assert.equal(persisted.status, 200);
          const state: z.infer<typeof scenarioGroupStateSchema> =
            scenarioGroupStateSchema.parse(await persisted.json());
          assert.equal(state.data.documentId, scenarioGroup);
          assert.equal(state.data.title, 'Draft Group');
          assert.equal(state.data.publishedAt, null);
        });

        test('rejects deleting a published scenario group in a draft project', async (testContext: TestContext): Promise<void> => {
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
          const scenarioGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Original Group', project },
            testContext,
          );
          const unpublish: Response = await manager.unpublishDocument(
            'api::project.project',
            project,
            {},
            testContext,
          );
          assert.equal(unpublish.status, 200);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${scenarioGroup}`,
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
          const persisted: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            scenarioGroup,
            testContext,
          );
          assert.equal(persisted.status, 200);
          const state: z.infer<typeof scenarioGroupStateSchema> =
            scenarioGroupStateSchema.parse(await persisted.json());
          assert.equal(state.data.documentId, scenarioGroup);
          assert.equal(state.data.title, 'Original Group');
        });

        test('rejects deleting an unknown scenario group', async (testContext: TestContext): Promise<void> => {
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
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/scenario-group/${randomUUID()}`,
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

        test('rejects deleting a known scenario group through an unknown project', async (testContext: TestContext): Promise<void> => {
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
          const scenarioGroup: string = await manager.createPublishedDocument(
            'api::scenario-group.scenario-group',
            { title: 'Original Group', project },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${randomUUID()}/scenario-group/${scenarioGroup}`,
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
          const persisted: Response = await manager.readDocument(
            'api::scenario-group.scenario-group',
            scenarioGroup,
            testContext,
          );
          assert.equal(persisted.status, 200);
          const state: z.infer<typeof scenarioGroupStateSchema> =
            scenarioGroupStateSchema.parse(await persisted.json());
          assert.equal(state.data.documentId, scenarioGroup);
          assert.equal(state.data.title, 'Original Group');
        });
      });
    });
  });
});
