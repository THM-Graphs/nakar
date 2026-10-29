import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { SuiteContext, TestContext } from 'node:test';
import { after, before, describe, test } from 'node:test';
import z from 'zod';
import { E2ETestManager } from '../../../../e2e/E2ETestManager';
import type { E2ETestApplicationUser } from '../../../../e2e/E2ETestApplicationUser';
import type { E2ETestApplicationProject } from '../../../../e2e/E2ETestApplicationProject';
import type { E2ETestApplicationRoom } from '../../../../e2e/E2ETestApplicationRoom';
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
        const owner: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        // when
        const response: Response = await fetch(`${manager.apiUrl}/project`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${login.jwt}`,
            'Content-Type': 'application/json',
          },
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
        const owner: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );

        // when
        const response: Response = await fetch(`${manager.apiUrl}/project`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${login.jwt}`,
            'Content-Type': 'application/json',
          },
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
        const owner: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );

        // when
        const response: Response = await fetch(`${manager.apiUrl}/project`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${login.jwt}`,
            'Content-Type': 'application/json',
          },
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
        const owner: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );

        // when
        const response: Response = await fetch(`${manager.apiUrl}/project`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${login.jwt}`,
            'Content-Type': 'application/json',
          },
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
        const owner: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );

        // when
        const response: Response = await fetch(`${manager.apiUrl}/project`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${login.jwt}`,
            'Content-Type': 'application/json',
          },
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
        const owner: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );

        // when
        const response: Response = await fetch(`${manager.apiUrl}/project`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${login.jwt}`,
            'Content-Type': 'application/json',
          },
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
          headers: { 'Content-Type': 'application/json' },
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
          headers: {
            Authorization: 'Bearer invalid-jwt',
            'Content-Type': 'application/json',
          },
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
        test('owner can read the project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const project: E2ETestApplicationProject =
            await manager.createProject('Test Project', owner, [], testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'GET',
              headers: { Authorization: `Bearer ${login.jwt}` },
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: ProjectPageDto = projectSchema.parse(
            await response.json(),
          );
          assert.deepEqual(body, {
            id: project.documentId,
            title: project.title,
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
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(
              `e2e-${randomUUID()}`,
              randomUUID(),
              testContext,
            );
          const project: E2ETestApplicationProject =
            await manager.createProject(
              'Test Project',
              owner,
              [collaborator],
              testContext,
            );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'GET',
              headers: { Authorization: `Bearer ${login.jwt}` },

              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: ProjectPageDto = projectSchema.parse(
            await response.json(),
          );
          assert.deepEqual(body, {
            id: project.documentId,
            title: project.title,
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
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const project: E2ETestApplicationProject =
            await manager.createProject('Test Project', owner, [], testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Test Room',
            RoomVisibilityDto.private,
            project,
            testContext,
          );
          const otherProject: E2ETestApplicationProject =
            await manager.createProject(
              'Other Project',
              owner,
              [],
              testContext,
            );
          await manager.createRoom(
            'Other Room',
            RoomVisibilityDto.public,
            otherProject,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'GET',
              headers: { Authorization: `Bearer ${login.jwt}` },

              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: ProjectPageDto = projectSchema.parse(
            await response.json(),
          );
          assert.equal(body.rooms.length, 1);
          assert.equal(body.rooms[0].id, room.documentId);
          assert.equal(body.rooms[0].title, room.title);
          assert.equal(body.rooms[0].visibility, RoomVisibilityDto.private);
          assert.equal(body.rooms[0].projectId, project.documentId);
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
        test('rejects other project owner access', async (testContext: TestContext): Promise<void> => {
          // given
          const actor: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const sourceProject: E2ETestApplicationProject =
            await manager.createProject(
              'Source Project',
              actor,
              [],
              testContext,
            );
          const project: E2ETestApplicationProject =
            await manager.createProject(
              'Target Project',
              owner,
              [],
              testContext,
            );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            actor.username,
            actor.password,
            testContext,
          );
          const authorized: Response = await fetch(
            `${manager.apiUrl}/project/${sourceProject.documentId}`,
            {
              headers: { Authorization: `Bearer ${login.jwt}` },
              signal: testContext.signal,
            },
          );
          assert.equal(authorized.status, 200);
          await authorized.body?.cancel();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'GET',
              headers: { Authorization: `Bearer ${login.jwt}` },

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
          const actor: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const sourceOwner: E2ETestApplicationUser =
            await manager.registerUser(
              `e2e-${randomUUID()}`,
              randomUUID(),
              testContext,
            );
          const sourceProject: E2ETestApplicationProject =
            await manager.createProject(
              'Source Project',
              sourceOwner,
              [actor],
              testContext,
            );
          const project: E2ETestApplicationProject =
            await manager.createProject(
              'Target Project',
              owner,
              [],
              testContext,
            );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            actor.username,
            actor.password,
            testContext,
          );
          const authorized: Response = await fetch(
            `${manager.apiUrl}/project/${sourceProject.documentId}`,
            {
              headers: { Authorization: `Bearer ${login.jwt}` },
              signal: testContext.signal,
            },
          );
          assert.equal(authorized.status, 200);
          await authorized.body?.cancel();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'GET',
              headers: { Authorization: `Bearer ${login.jwt}` },

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
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(
              `e2e-${randomUUID()}`,
              randomUUID(),
              testContext,
            );
          const project: E2ETestApplicationProject =
            await manager.createProject(
              'Test Project',
              owner,
              [collaborator],
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
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${login.jwt}` },
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
          const removal: Response = await fetch(
            `${manager.strapiUrl}/content-manager/collection-types/api::project.project/${project.documentId}/actions/publish`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${manager.context.admin.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ collaborators: [] }),
              signal: testContext.signal,
            },
          );
          assert.equal(removal.status, 200, await removal.text());
          const revoked: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${ownerLogin.jwt}` },
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
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'GET',
              headers: { Authorization: `Bearer ${login.jwt}` },

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
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const project: E2ETestApplicationProject =
            await manager.createProject('Test Project', owner, [], testContext);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'GET',
              headers: {},
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
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const project: E2ETestApplicationProject =
            await manager.createProject('Test Project', owner, [], testContext);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'GET',
              headers: { Authorization: 'Bearer invalid-jwt' },

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
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const outsider: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const project: E2ETestApplicationProject =
            await manager.createProject('Test Project', owner, [], testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'GET',
              headers: { Authorization: `Bearer ${login.jwt}` },

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
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const outsider: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const project: E2ETestApplicationProject =
            await manager.createProject('Test Project', owner, [], testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
            testContext,
          );
          await manager.createRoom(
            'Public Room',
            RoomVisibilityDto.public,
            project,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'GET',
              headers: { Authorization: `Bearer ${login.jwt}` },

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
        test('rejects an unknown project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
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
              headers: { Authorization: `Bearer ${login.jwt}` },

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
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const project: E2ETestApplicationProject =
            await manager.createProject('Test Project', owner, [], testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${login.jwt}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ title: 'Changed Project' }),
              signal: testContext.signal,
            },
          );
          const persisted: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${login.jwt}` },
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: ProjectPageDto = projectSchema.parse(
            await response.json(),
          );
          assert.deepEqual(body, {
            id: project.documentId,
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
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(
              `e2e-${randomUUID()}`,
              randomUUID(),
              testContext,
            );
          const project: E2ETestApplicationProject =
            await manager.createProject(
              'Test Project',
              owner,
              [collaborator],
              testContext,
            );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${login.jwt}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ title: 'Changed Project' }),
              signal: testContext.signal,
            },
          );
          const persisted: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${login.jwt}` },
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: ProjectPageDto = projectSchema.parse(
            await response.json(),
          );
          assert.deepEqual(body, {
            id: project.documentId,
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
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const project: E2ETestApplicationProject =
            await manager.createProject('Test Project', owner, [], testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${login.jwt}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({}),
              signal: testContext.signal,
            },
          );
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${login.jwt}` },
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: ['title should not be empty'],
          });
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), {
            id: project.documentId,
            title: project.title,
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
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const project: E2ETestApplicationProject =
            await manager.createProject('Test Project', owner, [], testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${login.jwt}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ title: '' }),
              signal: testContext.signal,
            },
          );
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${login.jwt}` },
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: ['title should not be empty'],
          });
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), {
            id: project.documentId,
            title: project.title,
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
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const project: E2ETestApplicationProject =
            await manager.createProject('Test Project', owner, [], testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${login.jwt}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ title: 123 }),
              signal: testContext.signal,
            },
          );
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${login.jwt}` },
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: ['title must be a string'],
          });
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), {
            id: project.documentId,
            title: project.title,
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
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const project: E2ETestApplicationProject =
            await manager.createProject('Test Project', owner, [], testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${login.jwt}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ title: null }),
              signal: testContext.signal,
            },
          );
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${login.jwt}` },
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: ['title should not be empty'],
          });
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), {
            id: project.documentId,
            title: project.title,
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
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const project: E2ETestApplicationProject =
            await manager.createProject('Test Project', owner, [], testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${login.jwt}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ title: 'Test Project', unexpected: true }),
              signal: testContext.signal,
            },
          );
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${login.jwt}` },
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: ['property unexpected should not exist'],
          });
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), {
            id: project.documentId,
            title: project.title,
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
          const actor: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const sourceProject: E2ETestApplicationProject =
            await manager.createProject(
              'Source Project',
              actor,
              [],
              testContext,
            );
          const project: E2ETestApplicationProject =
            await manager.createProject(
              'Target Project',
              owner,
              [],
              testContext,
            );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            actor.username,
            actor.password,
            testContext,
          );
          const authorized: Response = await fetch(
            `${manager.apiUrl}/project/${sourceProject.documentId}`,
            {
              headers: { Authorization: `Bearer ${login.jwt}` },
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
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${login.jwt}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ title: 'Unauthorized Change' }),
              signal: testContext.signal,
            },
          );
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${ownerLogin.jwt}` },
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
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), {
            id: project.documentId,
            title: project.title,
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
          const actor: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const sourceOwner: E2ETestApplicationUser =
            await manager.registerUser(
              `e2e-${randomUUID()}`,
              randomUUID(),
              testContext,
            );
          const sourceProject: E2ETestApplicationProject =
            await manager.createProject(
              'Source Project',
              sourceOwner,
              [actor],
              testContext,
            );
          const project: E2ETestApplicationProject =
            await manager.createProject(
              'Target Project',
              owner,
              [],
              testContext,
            );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            actor.username,
            actor.password,
            testContext,
          );
          const authorized: Response = await fetch(
            `${manager.apiUrl}/project/${sourceProject.documentId}`,
            {
              headers: { Authorization: `Bearer ${login.jwt}` },
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
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${login.jwt}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ title: 'Unauthorized Change' }),
              signal: testContext.signal,
            },
          );
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${ownerLogin.jwt}` },
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
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), {
            id: project.documentId,
            title: project.title,
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
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(
              `e2e-${randomUUID()}`,
              randomUUID(),
              testContext,
            );
          const project: E2ETestApplicationProject =
            await manager.createProject(
              'Test Project',
              owner,
              [collaborator],
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
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${login.jwt}` },
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
          const removal: Response = await fetch(
            `${manager.strapiUrl}/content-manager/collection-types/api::project.project/${project.documentId}/actions/publish`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${manager.context.admin.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ collaborators: [] }),
              signal: testContext.signal,
            },
          );
          assert.equal(removal.status, 200, await removal.text());
          const revoked: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${ownerLogin.jwt}` },
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
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${login.jwt}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ title: 'Unauthorized Change' }),
              signal: testContext.signal,
            },
          );
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${ownerLogin.jwt}` },
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
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), {
            id: project.documentId,
            title: project.title,
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
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const project: E2ETestApplicationProject =
            await manager.createProject('Test Project', owner, [], testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: 'Changed Project' }),
              signal: testContext.signal,
            },
          );
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${login.jwt}` },
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
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), {
            id: project.documentId,
            title: project.title,
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
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const project: E2ETestApplicationProject =
            await manager.createProject('Test Project', owner, [], testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'PUT',
              headers: {
                Authorization: 'Bearer invalid-jwt',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ title: 'Changed Project' }),
              signal: testContext.signal,
            },
          );
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${login.jwt}` },
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
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), {
            id: project.documentId,
            title: project.title,
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
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const outsider: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const project: E2ETestApplicationProject =
            await manager.createProject('Test Project', owner, [], testContext);
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
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${login.jwt}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ title: 'Changed Project' }),
              signal: testContext.signal,
            },
          );
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${ownerLogin.jwt}` },
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
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), {
            id: project.documentId,
            title: project.title,
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
        test('rejects an unknown project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
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
              headers: {
                Authorization: `Bearer ${login.jwt}`,
                'Content-Type': 'application/json',
              },
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
        test('owner can delete the project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const project: E2ETestApplicationProject =
            await manager.createProject('Test Project', owner, [], testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${login.jwt}` },

              signal: testContext.signal,
            },
          );
          const deleted: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${login.jwt}` },
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          assert.equal(await response.text(), '');
          assert.equal(deleted.status, 404);
          assert.deepEqual(await deleted.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });

        test('collaborator can delete the project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(
              `e2e-${randomUUID()}`,
              randomUUID(),
              testContext,
            );
          const project: E2ETestApplicationProject =
            await manager.createProject(
              'Test Project',
              owner,
              [collaborator],
              testContext,
            );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${login.jwt}` },

              signal: testContext.signal,
            },
          );
          const deleted: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${login.jwt}` },
              signal: testContext.signal,
            },
          );

          // then
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
          const actor: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const sourceProject: E2ETestApplicationProject =
            await manager.createProject(
              'Source Project',
              actor,
              [],
              testContext,
            );
          const project: E2ETestApplicationProject =
            await manager.createProject(
              'Target Project',
              owner,
              [],
              testContext,
            );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            actor.username,
            actor.password,
            testContext,
          );
          const authorized: Response = await fetch(
            `${manager.apiUrl}/project/${sourceProject.documentId}`,
            {
              headers: { Authorization: `Bearer ${login.jwt}` },
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
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${login.jwt}` },

              signal: testContext.signal,
            },
          );
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${ownerLogin.jwt}` },
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
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), {
            id: project.documentId,
            title: project.title,
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
          const actor: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const sourceOwner: E2ETestApplicationUser =
            await manager.registerUser(
              `e2e-${randomUUID()}`,
              randomUUID(),
              testContext,
            );
          const sourceProject: E2ETestApplicationProject =
            await manager.createProject(
              'Source Project',
              sourceOwner,
              [actor],
              testContext,
            );
          const project: E2ETestApplicationProject =
            await manager.createProject(
              'Target Project',
              owner,
              [],
              testContext,
            );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            actor.username,
            actor.password,
            testContext,
          );
          const authorized: Response = await fetch(
            `${manager.apiUrl}/project/${sourceProject.documentId}`,
            {
              headers: { Authorization: `Bearer ${login.jwt}` },
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
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${login.jwt}` },

              signal: testContext.signal,
            },
          );
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${ownerLogin.jwt}` },
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
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), {
            id: project.documentId,
            title: project.title,
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
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(
              `e2e-${randomUUID()}`,
              randomUUID(),
              testContext,
            );
          const project: E2ETestApplicationProject =
            await manager.createProject(
              'Test Project',
              owner,
              [collaborator],
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
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${login.jwt}` },
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
          const removal: Response = await fetch(
            `${manager.strapiUrl}/content-manager/collection-types/api::project.project/${project.documentId}/actions/publish`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${manager.context.admin.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ collaborators: [] }),
              signal: testContext.signal,
            },
          );
          assert.equal(removal.status, 200, await removal.text());
          const revoked: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${ownerLogin.jwt}` },
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
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${login.jwt}` },

              signal: testContext.signal,
            },
          );
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${ownerLogin.jwt}` },
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
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), {
            id: project.documentId,
            title: project.title,
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
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const project: E2ETestApplicationProject =
            await manager.createProject('Test Project', owner, [], testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'DELETE',
              headers: {},

              signal: testContext.signal,
            },
          );
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${login.jwt}` },
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
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), {
            id: project.documentId,
            title: project.title,
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
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const project: E2ETestApplicationProject =
            await manager.createProject('Test Project', owner, [], testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'DELETE',
              headers: { Authorization: 'Bearer invalid-jwt' },

              signal: testContext.signal,
            },
          );
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${login.jwt}` },
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
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), {
            id: project.documentId,
            title: project.title,
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
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const outsider: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
          const project: E2ETestApplicationProject =
            await manager.createProject('Test Project', owner, [], testContext);
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
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${login.jwt}` },

              signal: testContext.signal,
            },
          );
          const unchanged: Response = await fetch(
            `${manager.apiUrl}/project/${project.documentId}`,
            {
              headers: { Authorization: `Bearer ${ownerLogin.jwt}` },
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
          assert.equal(unchanged.status, 200);
          assert.deepEqual(await unchanged.json(), {
            id: project.documentId,
            title: project.title,
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
        test('rejects an unknown project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
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
              headers: { Authorization: `Bearer ${login.jwt}` },
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
