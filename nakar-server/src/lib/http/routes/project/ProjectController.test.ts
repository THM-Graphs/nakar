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

const userSchema: z.ZodType<UserPreviewDto> = z.strictObject({
  id: z.string().min(1),
  displayName: z.string().nullable(),
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
  databases: z.array(z.never()),
  activeUsers: z.array(userSchema),
});
const projectSchema: z.ZodType<ProjectPageDto> = z.strictObject({
  id: z.string().min(1),
  title: z.string(),
  owner: userSchema.nullable(),
  collaborators: z.array(userSchema),
  databases: z.array(z.never()),
  scenarioGroups: z.array(z.never()),
  rooms: z.array(roomSchema),
  commonProperties: z.array(z.never()),
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
          body: JSON.stringify({ title: 'Created Project' }),
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
      test('rejects a missing title', async (testContext: TestContext): Promise<void> => {
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
          body: JSON.stringify({}),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), {
          statusCode: 400,
          error: 'Bad Request',
          message: ['title should not be empty'],
        });
      });

      test('rejects an empty title', async (testContext: TestContext): Promise<void> => {
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
          body: JSON.stringify({ title: '' }),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), {
          statusCode: 400,
          error: 'Bad Request',
          message: ['title should not be empty'],
        });
      });

      test('rejects a non-string title', async (testContext: TestContext): Promise<void> => {
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
          body: JSON.stringify({ title: 123 }),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), {
          statusCode: 400,
          error: 'Bad Request',
          message: ['title must be a string'],
        });
      });

      test('rejects a null title', async (testContext: TestContext): Promise<void> => {
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
          body: JSON.stringify({ title: null }),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), {
          statusCode: 400,
          error: 'Bad Request',
          message: ['title should not be empty'],
        });
      });

      test('rejects unexpected properties', async (testContext: TestContext): Promise<void> => {
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
          body: JSON.stringify({ title: 'Test Project', unexpected: true }),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), {
          statusCode: 400,
          error: 'Bad Request',
          message: ['property unexpected should not exist'],
        });
      });
    });
    describe('403', (): void => {
      test('rejects anonymous creation', async (testContext: TestContext): Promise<void> => {
        // when
        const response: Response = await fetch(`${manager.apiUrl}/project`, {
          method: 'POST',
          headers: new Headers([['Content-Type', 'application/json']]),
          body: JSON.stringify({ title: 'Test Project' }),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 403);
        assert.deepEqual(await response.json(), {
          statusCode: 403,
          error: 'Forbidden',
          message: 'Forbidden resource',
        });
      });

      test('rejects invalid jwt creation', async (testContext: TestContext): Promise<void> => {
        // when
        const response: Response = await fetch(`${manager.apiUrl}/project`, {
          method: 'POST',
          headers: new Headers([
            ['Authorization', 'Bearer invalid-jwt'],
            ['Content-Type', 'application/json'],
          ]),
          body: JSON.stringify({ title: 'Test Project' }),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 403);
        assert.deepEqual(await response.json(), {
          statusCode: 403,
          error: 'Forbidden',
          message: 'Forbidden resource',
        });
      });
    });
  });
  describe('/:projectId', (): void => {
    describe('GET', (): void => {
      describe('200', (): void => {
        test('excludes draft rooms from a published project', async (testContext: TestContext): Promise<void> => {
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
          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Published Room',
              visibility: RoomVisibilityDto.public,
              project: project,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const creation: Response = await manager.createDocument(
            'api::room.room',
            {
              title: 'Draft Room',
              visibility: RoomVisibilityDto.public,
              project: project,
            },
            testContext,
          );
          assert.equal(creation.status, 201, await creation.text());

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
          assert.deepEqual(
            body.rooms.map((item: RoomDto): string => item.id),
            [room],
          );
        });

        test('published collaborator retains access after draft removal', async (testContext: TestContext): Promise<void> => {
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
          const publication: Response = await manager.publishDocument(
            'api::project.project',
            project,
            {
              collaborators: [collaborator.documentId],
            },
            testContext,
          );
          assert.equal(publication.status, 200, await publication.text());
          const update: Response = await manager.updateDocument(
            'api::project.project',
            project,
            { title: 'Draft Title', collaborators: [] },
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
          assert.equal(response.status, 200);
          const body: ProjectPageDto = projectSchema.parse(
            await response.json(),
          );
          assert.equal(body.title, 'Published Project');
          assert.deepEqual(
            body.collaborators.map((item: UserPreviewDto): string => item.id),
            [collaborator.documentId],
          );
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
          assert.deepEqual(startBody.collaborationProjects, [
            { id: project, title: 'Published Project' },
          ]);
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

        test('returns only rooms belonging to the project', async (testContext: TestContext): Promise<void> => {
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
          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Test Room',
              visibility: RoomVisibilityDto.private,
              project: project,
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
          await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Other Room',
              visibility: RoomVisibilityDto.public,
              project: otherProject,
            },
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
          assert.equal(body.rooms.length, 1);
          assert.equal(body.rooms[0].id, room);
          assert.equal(body.rooms[0].title, 'Test Room');
          assert.equal(body.rooms[0].visibility, RoomVisibilityDto.private);
          assert.equal(body.rooms[0].projectId, project);
          assert.equal(body.rooms[0].canvases.length, 1);
          assert.equal(
            body.rooms[0].joinCanvasId,
            body.rooms[0].canvases[0].id,
          );
          assert.deepEqual(body.rooms[0].databases, []);
          assert.deepEqual(body.rooms[0].activeUsers, []);
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

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              method: 'GET',
              headers: new Headers([]),
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

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              method: 'GET',
              headers: new Headers([['Authorization', 'Bearer invalid-jwt']]),
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
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
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
          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            error: 'Forbidden',
            message: 'Forbidden resource',
          });
        });

        test('public rooms do not grant outsiders project access', async (testContext: TestContext): Promise<void> => {
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
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
            testContext,
          );
          await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Public Room',
              visibility: RoomVisibilityDto.public,
              project: project,
            },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
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
              body: JSON.stringify({ title: 'Changed Project' }),
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
              body: JSON.stringify({ title: 'Changed Project' }),
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
              body: JSON.stringify({}),
              signal: testContext.signal,
            },
          );

          // then
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: ['title should not be empty'],
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
              body: JSON.stringify({ title: '' }),
              signal: testContext.signal,
            },
          );

          // then
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: ['title should not be empty'],
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

        test('rejects a non-string title', async (testContext: TestContext): Promise<void> => {
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
              body: JSON.stringify({ title: 123 }),
              signal: testContext.signal,
            },
          );

          // then
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: ['title must be a string'],
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
              body: JSON.stringify({ title: null }),
              signal: testContext.signal,
            },
          );

          // then
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: ['title should not be empty'],
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
              body: JSON.stringify({ title: 'Test Project', unexpected: true }),
              signal: testContext.signal,
            },
          );

          // then
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: ['property unexpected should not exist'],
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
              body: JSON.stringify({ title: 'Unauthorized Change' }),
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
              body: JSON.stringify({ title: 'Unauthorized Change' }),
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
              body: JSON.stringify({ title: 'Unauthorized Change' }),
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
              headers: new Headers([['Content-Type', 'application/json']]),
              body: JSON.stringify({ title: 'Changed Project' }),
              signal: testContext.signal,
            },
          );

          // then
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
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
                ['Authorization', 'Bearer invalid-jwt'],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({ title: 'Changed Project' }),
              signal: testContext.signal,
            },
          );

          // then
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
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

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({ title: 'Changed Project' }),
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
              body: JSON.stringify({ title: 'Changed Project' }),
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
              body: JSON.stringify({ title: 'Changed Project' }),
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
      describe('200', (): void => {
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
          assert.equal(response.status, 200);
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
          assert.equal(response.status, 200);
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

          assert.equal(response.status, 200);
          assert.equal(await response.text(), '');
          assert.equal(deleted.status, 404);
          assert.deepEqual(await deleted.json(), {
            statusCode: 404,

            message: 'Not Found',
          });
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
              headers: new Headers([]),
              signal: testContext.signal,
            },
          );

          // then
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
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
              headers: new Headers([['Authorization', 'Bearer invalid-jwt']]),
              signal: testContext.signal,
            },
          );

          // then
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
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
