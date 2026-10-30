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
import type { RoomDto } from '../../../schema/dtos/RoomDto';
import { RoomVisibilityDto } from '../../../schema/dtos/RoomVisibilityDto';

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
  activeUsers: z.array(
    z.strictObject({
      id: z.string().min(1),
      displayName: z.string().nullable(),
    }),
  ),
});

describe('/project/:projectId/room', (suiteContext: SuiteContext): void => {
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
      test('owner can create a private room', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );

        const project: E2ETestApplicationProject = await manager.createProject(
          'Room Project',
          owner,
          [],
          testContext,
        );

        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const url: string = `${manager.apiUrl}/project/${project.documentId}/room`;

        // when
        const response: Response = await fetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${login.jwt}` },

          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 201);
        const body: RoomDto = roomSchema.parse(await response.json());
        assert.deepEqual(body, {
          id: body.id,
          title: 'Untitled Room',
          visibility: RoomVisibilityDto.private,
          projectId: project.documentId,
          canvases: [{ id: body.joinCanvasId, title: 'New Canvas' }],
          joinCanvasId: body.joinCanvasId,
          databases: [],
          activeUsers: [],
        });
      });
      test('collaborator can create a private room', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const collaborator: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const project: E2ETestApplicationProject = await manager.createProject(
          'Room Project',
          owner,
          [collaborator],
          testContext,
        );

        const login: PostAuthResponseBodyDto = await manager.loginUser(
          collaborator.username,
          collaborator.password,
          testContext,
        );
        const url: string = `${manager.apiUrl}/project/${project.documentId}/room`;

        // when
        const response: Response = await fetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${login.jwt}` },

          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 201);
        const body: RoomDto = roomSchema.parse(await response.json());
        assert.deepEqual(body, {
          id: body.id,
          title: 'Untitled Room',
          visibility: RoomVisibilityDto.private,
          projectId: project.documentId,
          canvases: [{ id: body.joinCanvasId, title: 'New Canvas' }],
          joinCanvasId: body.joinCanvasId,
          databases: [],
          activeUsers: [],
        });
      });
    });
    describe('403', (): void => {
      test('rejects anonymous creation', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );

        const project: E2ETestApplicationProject = await manager.createProject(
          'Room Project',
          owner,
          [],
          testContext,
        );

        const url: string = `${manager.apiUrl}/project/${project.documentId}/room`;

        // when
        const response: Response = await fetch(url, {
          method: 'POST',

          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 403);
        assert.deepEqual(await response.json(), {
          statusCode: 403,
          message: 'Forbidden resource',
          error: 'Forbidden',
        });
      });
      test('rejects outsider creation', async (testContext: TestContext): Promise<void> => {
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
        const project: E2ETestApplicationProject = await manager.createProject(
          'Room Project',
          owner,
          [],
          testContext,
        );

        const login: PostAuthResponseBodyDto = await manager.loginUser(
          outsider.username,
          outsider.password,
          testContext,
        );
        const url: string = `${manager.apiUrl}/project/${project.documentId}/room`;

        // when
        const response: Response = await fetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${login.jwt}` },

          signal: testContext.signal,
        });

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
        const url: string = `${manager.apiUrl}/project/${randomUUID()}/room`;

        // when
        const response: Response = await fetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${login.jwt}` },

          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 404);
        assert.deepEqual(await response.json(), {
          statusCode: 404,
          message: 'Not Found',
        });
      });
    });
  });
  describe('/:roomId', (): void => {
    describe('GET', (): void => {
      describe('200', (): void => {
        test('owner can read the room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.private,
            project,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${login.jwt}` },

            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 200);
          const body: RoomDto = roomSchema.parse(await response.json());
          assert.deepEqual(body, {
            id: room.documentId,
            title: 'Original Room',
            visibility: RoomVisibilityDto.private,
            projectId: project.documentId,
            canvases: [{ id: body.joinCanvasId, title: 'New Canvas' }],
            joinCanvasId: body.joinCanvasId,
            databases: [],
            activeUsers: [],
          });
        });
        test('collaborator can read the room', async (testContext: TestContext): Promise<void> => {
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
              'Room Project',
              owner,
              [collaborator],
              testContext,
            );

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.private,
            project,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${login.jwt}` },

            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 200);
          const body: RoomDto = roomSchema.parse(await response.json());
          assert.deepEqual(body, {
            id: room.documentId,
            title: 'Original Room',
            visibility: RoomVisibilityDto.private,
            projectId: project.documentId,
            canvases: [{ id: body.joinCanvasId, title: 'New Canvas' }],
            joinCanvasId: body.joinCanvasId,
            databases: [],
            activeUsers: [],
          });
        });
      });
      describe('403', (): void => {
        test('rejects anonymous access even for a public room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.public,
            project,
            testContext,
          );

          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'GET',

            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            message: 'Forbidden resource',
            error: 'Forbidden',
          });
        });
        test('rejects outsider access even for a public room', async (testContext: TestContext): Promise<void> => {
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
            await manager.createProject('Room Project', owner, [], testContext);

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.public,
            project,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${login.jwt}` },

            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            message: 'Forbidden resource',
            error: 'Forbidden',
          });
        });
        test('rejects a room belonging to another project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);
          const otherProject: E2ETestApplicationProject =
            await manager.createProject(
              'Other Project',
              owner,
              [],
              testContext,
            );
          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.private,
            otherProject,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${login.jwt}` },

            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            message: 'Forbidden resource',
            error: 'Forbidden',
          });
        });
        test('rejects an unknown room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${randomUUID()}`;

          // when
          const response: Response = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${login.jwt}` },

            signal: testContext.signal,
          });

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
        test('rejects an unknown project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.private,
            project,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${randomUUID()}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${login.jwt}` },

            signal: testContext.signal,
          });

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
        test('owner can update the room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.private,
            project,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${login.jwt}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: 'Updated Room',
              visibility: RoomVisibilityDto.public,
            }),
            signal: testContext.signal,
          });
          const persisted: Response = await fetch(url, {
            headers: { Authorization: `Bearer ${login.jwt}` },
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 200);
          const body: RoomDto = roomSchema.parse(await response.json());
          assert.deepEqual(body, {
            id: room.documentId,
            title: 'Updated Room',
            visibility: RoomVisibilityDto.public,
            projectId: project.documentId,
            canvases: [{ id: body.joinCanvasId, title: 'New Canvas' }],
            joinCanvasId: body.joinCanvasId,
            databases: [],
            activeUsers: [],
          });
          assert.equal(persisted.status, 200);
          assert.deepEqual(await persisted.json(), body);
        });
        test('collaborator can update the room', async (testContext: TestContext): Promise<void> => {
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
              'Room Project',
              owner,
              [collaborator],
              testContext,
            );

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.private,
            project,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${login.jwt}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: 'Updated Room',
              visibility: RoomVisibilityDto.public,
            }),
            signal: testContext.signal,
          });
          const persisted: Response = await fetch(url, {
            headers: { Authorization: `Bearer ${login.jwt}` },
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 200);
          const body: RoomDto = roomSchema.parse(await response.json());
          assert.deepEqual(body, {
            id: room.documentId,
            title: 'Updated Room',
            visibility: RoomVisibilityDto.public,
            projectId: project.documentId,
            canvases: [{ id: body.joinCanvasId, title: 'New Canvas' }],
            joinCanvasId: body.joinCanvasId,
            databases: [],
            activeUsers: [],
          });
          assert.equal(persisted.status, 200);
          assert.deepEqual(await persisted.json(), body);
        });
        test('can change visibility to private', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.public,
            project,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${login.jwt}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
            }),
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 200);
          const body: RoomDto = roomSchema.parse(await response.json());
          assert.deepEqual(body, {
            id: room.documentId,
            title: 'Original Room',
            visibility: RoomVisibilityDto.private,
            projectId: project.documentId,
            canvases: [{ id: body.joinCanvasId, title: 'New Canvas' }],
            joinCanvasId: body.joinCanvasId,
            databases: [],
            activeUsers: [],
          });
        });
        test('can change visibility to unlisted', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.public,
            project,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${login.jwt}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: 'Original Room',
              visibility: RoomVisibilityDto.unlisted,
            }),
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 200);
          const body: RoomDto = roomSchema.parse(await response.json());
          assert.deepEqual(body, {
            id: room.documentId,
            title: 'Original Room',
            visibility: RoomVisibilityDto.unlisted,
            projectId: project.documentId,
            canvases: [{ id: body.joinCanvasId, title: 'New Canvas' }],
            joinCanvasId: body.joinCanvasId,
            databases: [],
            activeUsers: [],
          });
        });
        test('accepts an empty title', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.private,
            project,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${login.jwt}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: '',
              visibility: RoomVisibilityDto.private,
            }),
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 200);
          const body: RoomDto = roomSchema.parse(await response.json());
          assert.deepEqual(body, {
            id: room.documentId,
            title: '',
            visibility: RoomVisibilityDto.private,
            projectId: project.documentId,
            canvases: [{ id: body.joinCanvasId, title: 'New Canvas' }],
            joinCanvasId: body.joinCanvasId,
            databases: [],
            activeUsers: [],
          });
        });
      });
      describe('403', (): void => {
        test('rejects anonymous access even for a public room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.public,
            project,
            testContext,
          );

          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Denied',
              visibility: RoomVisibilityDto.private,
            }),
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            message: 'Forbidden resource',
            error: 'Forbidden',
          });
        });
        test('rejects outsider access even for a public room', async (testContext: TestContext): Promise<void> => {
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
            await manager.createProject('Room Project', owner, [], testContext);

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.public,
            project,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${login.jwt}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: 'Denied',
              visibility: RoomVisibilityDto.private,
            }),
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            message: 'Forbidden resource',
            error: 'Forbidden',
          });
        });
        test('rejects a room belonging to another project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);
          const otherProject: E2ETestApplicationProject =
            await manager.createProject(
              'Other Project',
              owner,
              [],
              testContext,
            );
          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.private,
            otherProject,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${login.jwt}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: 'Denied',
              visibility: RoomVisibilityDto.private,
            }),
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            message: 'Forbidden resource',
            error: 'Forbidden',
          });
        });
        test('rejects an unknown room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${randomUUID()}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${login.jwt}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: 'Denied',
              visibility: RoomVisibilityDto.private,
            }),
            signal: testContext.signal,
          });

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
        test('rejects an unknown project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.private,
            project,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${randomUUID()}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${login.jwt}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: 'Denied',
              visibility: RoomVisibilityDto.private,
            }),
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
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

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.private,
            project,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${login.jwt}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ visibility: RoomVisibilityDto.private }),
            signal: testContext.signal,
          });
          const persisted: Response = await fetch(url, {
            headers: { Authorization: `Bearer ${login.jwt}` },
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: ['title must be a string'],
          });
          assert.equal(persisted.status, 200);
          const unchanged: RoomDto = roomSchema.parse(await persisted.json());
          assert.equal(unchanged.title, 'Original Room');
          assert.equal(unchanged.visibility, RoomVisibilityDto.private);
        });
        test('rejects a null title', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.private,
            project,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${login.jwt}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: null,
              visibility: RoomVisibilityDto.private,
            }),
            signal: testContext.signal,
          });
          const persisted: Response = await fetch(url, {
            headers: { Authorization: `Bearer ${login.jwt}` },
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: ['title must be a string'],
          });
          assert.equal(persisted.status, 200);
          const unchanged: RoomDto = roomSchema.parse(await persisted.json());
          assert.equal(unchanged.title, 'Original Room');
          assert.equal(unchanged.visibility, RoomVisibilityDto.private);
        });
        test('rejects a non-string title', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.private,
            project,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${login.jwt}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: 42,
              visibility: RoomVisibilityDto.private,
            }),
            signal: testContext.signal,
          });
          const persisted: Response = await fetch(url, {
            headers: { Authorization: `Bearer ${login.jwt}` },
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: ['title must be a string'],
          });
          assert.equal(persisted.status, 200);
          const unchanged: RoomDto = roomSchema.parse(await persisted.json());
          assert.equal(unchanged.title, 'Original Room');
          assert.equal(unchanged.visibility, RoomVisibilityDto.private);
        });
        test('rejects a missing visibility', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.private,
            project,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${login.jwt}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: 'Changed' }),
            signal: testContext.signal,
          });
          const persisted: Response = await fetch(url, {
            headers: { Authorization: `Bearer ${login.jwt}` },
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: [
              'visibility must be one of the following values: private, public, unlisted',
            ],
          });
          assert.equal(persisted.status, 200);
          const unchanged: RoomDto = roomSchema.parse(await persisted.json());
          assert.equal(unchanged.title, 'Original Room');
          assert.equal(unchanged.visibility, RoomVisibilityDto.private);
        });
        test('rejects a null visibility', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.private,
            project,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${login.jwt}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: 'Changed', visibility: null }),
            signal: testContext.signal,
          });
          const persisted: Response = await fetch(url, {
            headers: { Authorization: `Bearer ${login.jwt}` },
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: [
              'visibility must be one of the following values: private, public, unlisted',
            ],
          });
          assert.equal(persisted.status, 200);
          const unchanged: RoomDto = roomSchema.parse(await persisted.json());
          assert.equal(unchanged.title, 'Original Room');
          assert.equal(unchanged.visibility, RoomVisibilityDto.private);
        });
        test('rejects an unknown visibility', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.private,
            project,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${login.jwt}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: 'Changed', visibility: 'unknown' }),
            signal: testContext.signal,
          });
          const persisted: Response = await fetch(url, {
            headers: { Authorization: `Bearer ${login.jwt}` },
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: [
              'visibility must be one of the following values: private, public, unlisted',
            ],
          });
          assert.equal(persisted.status, 200);
          const unchanged: RoomDto = roomSchema.parse(await persisted.json());
          assert.equal(unchanged.title, 'Original Room');
          assert.equal(unchanged.visibility, RoomVisibilityDto.private);
        });
        test('rejects a non-string visibility', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.private,
            project,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${login.jwt}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: 'Changed', visibility: 42 }),
            signal: testContext.signal,
          });
          const persisted: Response = await fetch(url, {
            headers: { Authorization: `Bearer ${login.jwt}` },
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: [
              'visibility must be one of the following values: private, public, unlisted',
            ],
          });
          assert.equal(persisted.status, 200);
          const unchanged: RoomDto = roomSchema.parse(await persisted.json());
          assert.equal(unchanged.title, 'Original Room');
          assert.equal(unchanged.visibility, RoomVisibilityDto.private);
        });
        test('rejects unexpected properties', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.private,
            project,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${login.jwt}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: 'Changed',
              visibility: RoomVisibilityDto.private,
              unexpected: true,
            }),
            signal: testContext.signal,
          });
          const persisted: Response = await fetch(url, {
            headers: { Authorization: `Bearer ${login.jwt}` },
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: ['property unexpected should not exist'],
          });
          assert.equal(persisted.status, 200);
          const unchanged: RoomDto = roomSchema.parse(await persisted.json());
          assert.equal(unchanged.title, 'Original Room');
          assert.equal(unchanged.visibility, RoomVisibilityDto.private);
        });
      });
    });
    describe('DELETE', (): void => {
      describe('200', (): void => {
        test('owner can delete the room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.private,
            project,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${login.jwt}` },

            signal: testContext.signal,
          });
          const persisted: Response = await fetch(
            `${manager.strapiUrl}/content-manager/collection-types/api::room.room/${room.documentId}`,
            {
              headers: {
                Authorization: `Bearer ${manager.context.admin.token}`,
              },
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          assert.equal(await response.text(), '');
          assert.equal(persisted.status, 404);
        });
        test('collaborator can delete the room', async (testContext: TestContext): Promise<void> => {
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
              'Room Project',
              owner,
              [collaborator],
              testContext,
            );

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.private,
            project,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${login.jwt}` },

            signal: testContext.signal,
          });
          const persisted: Response = await fetch(
            `${manager.strapiUrl}/content-manager/collection-types/api::room.room/${room.documentId}`,
            {
              headers: {
                Authorization: `Bearer ${manager.context.admin.token}`,
              },
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          assert.equal(await response.text(), '');
          assert.equal(persisted.status, 404);
        });
      });
      describe('403', (): void => {
        test('rejects anonymous access even for a public room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.public,
            project,
            testContext,
          );

          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'DELETE',

            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            message: 'Forbidden resource',
            error: 'Forbidden',
          });
        });
        test('rejects outsider access even for a public room', async (testContext: TestContext): Promise<void> => {
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
            await manager.createProject('Room Project', owner, [], testContext);

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.public,
            project,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${login.jwt}` },

            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            message: 'Forbidden resource',
            error: 'Forbidden',
          });
        });
        test('rejects a room belonging to another project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);
          const otherProject: E2ETestApplicationProject =
            await manager.createProject(
              'Other Project',
              owner,
              [],
              testContext,
            );
          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.private,
            otherProject,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${login.jwt}` },

            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            message: 'Forbidden resource',
            error: 'Forbidden',
          });
        });
        test('rejects an unknown room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project.documentId}/room/${randomUUID()}`;

          // when
          const response: Response = await fetch(url, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${login.jwt}` },

            signal: testContext.signal,
          });

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
        test('rejects an unknown project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser = await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );

          const project: E2ETestApplicationProject =
            await manager.createProject('Room Project', owner, [], testContext);

          const room: E2ETestApplicationRoom = await manager.createRoom(
            'Original Room',
            RoomVisibilityDto.private,
            project,
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${randomUUID()}/room/${room.documentId}`;

          // when
          const response: Response = await fetch(url, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${login.jwt}` },

            signal: testContext.signal,
          });

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
