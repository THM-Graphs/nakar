import type { E2ETestApplicationUser } from '../../../../e2e/E2ETestApplicationUser';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { SuiteContext, TestContext } from 'node:test';
import { after, before, describe, test } from 'node:test';
import z from 'zod';
import { E2ETestManager } from '../../../../e2e/E2ETestManager';

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

const roomStateSchema: z.ZodType<{
  data: {
    documentId: string;
    title: string | null;
    visibility: RoomVisibilityDto;
  };
}> = z.object({
  data: z.object({
    documentId: z.string().min(1),
    title: z.string().nullable(),
    visibility: z.enum(RoomVisibilityDto),
  }),
});

const projectRoomsSchema: z.ZodType<{ rooms: { id: string }[] }> = z.object({
  rooms: z.array(z.object({ id: z.string().min(1) })),
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
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);

        const project: string = await manager.createPublishedDocument(
          'api::project.project',
          { title: 'Room Project', owner: owner.documentId, collaborators: [] },
          testContext,
        );

        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const url: string = `${manager.apiUrl}/project/${project}/room`;

        // when
        const response: Response = await fetch(url, {
          method: 'POST',
          headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 201);
        const body: RoomDto = roomSchema.parse(await response.json());
        assert.deepEqual(body, {
          id: body.id,
          title: 'Untitled Room',
          visibility: RoomVisibilityDto.private,
          projectId: project,
          canvases: [{ id: body.joinCanvasId, title: 'New Canvas' }],
          joinCanvasId: body.joinCanvasId,
          databases: [],
          activeUsers: [],
        });
      });
      test('collaborator can create a private room', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);

        const collaborator: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const project: string = await manager.createPublishedDocument(
          'api::project.project',
          {
            title: 'Room Project',
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
        const url: string = `${manager.apiUrl}/project/${project}/room`;

        // when
        const response: Response = await fetch(url, {
          method: 'POST',
          headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 201);
        const body: RoomDto = roomSchema.parse(await response.json());
        assert.deepEqual(body, {
          id: body.id,
          title: 'Untitled Room',
          visibility: RoomVisibilityDto.private,
          projectId: project,
          canvases: [{ id: body.joinCanvasId, title: 'New Canvas' }],
          joinCanvasId: body.joinCanvasId,
          databases: [],
          activeUsers: [],
        });
      });
    });
    describe('403', (): void => {
      test('rejects a removed collaborator with the same login', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);

        const collaborator: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const project: string = await manager.createPublishedDocument(
          'api::project.project',
          {
            title: 'Room Project',
            owner: owner.documentId,
            collaborators: [collaborator.documentId],
          },
          testContext,
        );
        const room: string = await manager.createPublishedDocument(
          'api::room.room',
          {
            title: 'Original Room',
            visibility: RoomVisibilityDto.private,
            project: project,
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
        const roomUrl: string = `${manager.apiUrl}/project/${project}/room/${room}`;
        const authorized: Response = await fetch(roomUrl, {
          headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
          signal: testContext.signal,
        });
        assert.equal(authorized.status, 200);
        assert.equal(roomSchema.parse(await authorized.json()).id, room);
        const removal: Response = await manager.publishDocument(
          'api::project.project',
          project,
          { collaborators: [] },
          testContext,
        );
        assert.equal(removal.status, 200, await removal.text());
        const projectUrl: string = `${manager.apiUrl}/project/${project}`;
        const revoked: Response = await fetch(projectUrl, {
          headers: new Headers([['Authorization', `Bearer ${ownerLogin.jwt}`]]),
          signal: testContext.signal,
        });
        assert.equal(revoked.status, 200);
        assert.deepEqual(
          z
            .object({ collaborators: z.array(z.unknown()) })
            .parse(await revoked.json()).collaborators,
          [],
        );
        const originalResponse: Response = await fetch(projectUrl, {
          headers: new Headers([['Authorization', `Bearer ${ownerLogin.jwt}`]]),
          signal: testContext.signal,
        });
        assert.equal(originalResponse.status, 200);
        const original: z.infer<typeof projectRoomsSchema> =
          projectRoomsSchema.parse(await originalResponse.json());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/room`,
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
        const persisted: Response = await fetch(projectUrl, {
          headers: new Headers([['Authorization', `Bearer ${ownerLogin.jwt}`]]),
          signal: testContext.signal,
        });
        assert.equal(persisted.status, 200);
        assert.deepEqual(
          projectRoomsSchema.parse(await persisted.json()),
          original,
        );
      });

      test('rejects anonymous creation', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);

        const project: string = await manager.createPublishedDocument(
          'api::project.project',
          { title: 'Room Project', owner: owner.documentId, collaborators: [] },
          testContext,
        );

        const url: string = `${manager.apiUrl}/project/${project}/room`;

        const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const projectUrl: string = `${manager.apiUrl}/project/${project}`;
        const originalResponse: Response = await fetch(projectUrl, {
          headers: new Headers([['Authorization', `Bearer ${ownerLogin.jwt}`]]),
          signal: testContext.signal,
        });
        assert.equal(originalResponse.status, 200);
        const original: z.infer<typeof projectRoomsSchema> =
          projectRoomsSchema.parse(await originalResponse.json());

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
        const persisted: Response = await fetch(projectUrl, {
          headers: new Headers([['Authorization', `Bearer ${ownerLogin.jwt}`]]),
          signal: testContext.signal,
        });
        assert.equal(persisted.status, 200);
        assert.deepEqual(
          projectRoomsSchema.parse(await persisted.json()),
          original,
        );
      });
      test('rejects outsider creation', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);

        const outsider: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const project: string = await manager.createPublishedDocument(
          'api::project.project',
          { title: 'Room Project', owner: owner.documentId, collaborators: [] },
          testContext,
        );

        const login: PostAuthResponseBodyDto = await manager.loginUser(
          outsider.username,
          outsider.password,
          testContext,
        );
        const url: string = `${manager.apiUrl}/project/${project}/room`;

        const ownerLogin: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const projectUrl: string = `${manager.apiUrl}/project/${project}`;
        const originalResponse: Response = await fetch(projectUrl, {
          headers: new Headers([['Authorization', `Bearer ${ownerLogin.jwt}`]]),
          signal: testContext.signal,
        });
        assert.equal(originalResponse.status, 200);
        const original: z.infer<typeof projectRoomsSchema> =
          projectRoomsSchema.parse(await originalResponse.json());

        // when
        const response: Response = await fetch(url, {
          method: 'POST',
          headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 403);
        assert.deepEqual(await response.json(), {
          statusCode: 403,
          message: 'Forbidden resource',
          error: 'Forbidden',
        });
        const persisted: Response = await fetch(projectUrl, {
          headers: new Headers([['Authorization', `Bearer ${ownerLogin.jwt}`]]),
          signal: testContext.signal,
        });
        assert.equal(persisted.status, 200);
        assert.deepEqual(
          projectRoomsSchema.parse(await persisted.json()),
          original,
        );
      });
    });
    describe('404', (): void => {
      test('rejects room creation in a draft project', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const project: string = await manager.createPublishedDocument(
          'api::project.project',
          { title: 'Room Project', owner: owner.documentId, collaborators: [] },
          testContext,
        );
        const unpublish: Response = await manager.unpublishDocument(
          'api::project.project',
          project,
          {},
          testContext,
        );
        assert.equal(unpublish.status, 200);
        const storedProject: Response = await manager.readDocument(
          'api::project.project',
          project,
          testContext,
        );
        assert.equal(storedProject.status, 200);
        z.object({ data: z.object({ publishedAt: z.null() }) }).parse(
          await storedProject.json(),
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/project/${project}/room`,
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

      test('rejects an unknown project', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);

        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const url: string = `${manager.apiUrl}/project/${randomUUID()}/room`;

        // when
        const response: Response = await fetch(url, {
          method: 'POST',
          headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
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
        test('uses the published room title and project despite draft reassignment', async (testContext: TestContext): Promise<void> => {
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
          const otherProject: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Other Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const update: Response = await manager.updateDocument(
            'api::room.room',
            room,
            {
              title: 'Draft Room Title',
              project: otherProject,
              visibility: RoomVisibilityDto.private,
            },
            testContext,
          );
          assert.equal(update.status, 200, await update.text());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/room/${room}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const body: RoomDto = roomSchema.parse(await response.json());
          assert.equal(body.title, 'Published Room');
          assert.equal(body.projectId, project);
          assert.equal(body.visibility, RoomVisibilityDto.public);
          const originalProject: Response = await fetch(
            `${manager.apiUrl}/project/${project}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );
          assert.equal(originalProject.status, 200);
          const originalBody: { rooms: { id: string }[] } = z
            .object({ rooms: z.array(z.object({ id: z.string() })) })
            .parse(await originalProject.json());
          assert.equal(
            originalBody.rooms.some(
              (item: { id: string }): boolean => item.id === room,
            ),
            true,
          );
          const reassignedProject: Response = await fetch(
            `${manager.apiUrl}/project/${otherProject}`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );
          assert.equal(reassignedProject.status, 200);
          z.object({ rooms: z.tuple([]) }).parse(
            await reassignedProject.json(),
          );
        });

        test('owner can read the room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: project,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          // when
          const response: Response = await fetch(url, {
            method: 'GET',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 200);
          const body: RoomDto = roomSchema.parse(await response.json());
          assert.deepEqual(body, {
            id: room,
            title: 'Original Room',
            visibility: RoomVisibilityDto.private,
            projectId: project,
            canvases: [{ id: body.joinCanvasId, title: 'New Canvas' }],
            joinCanvasId: body.joinCanvasId,
            databases: [],
            activeUsers: [],
          });
        });
        test('collaborator can read the room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [collaborator.documentId],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: project,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          // when
          const response: Response = await fetch(url, {
            method: 'GET',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 200);
          const body: RoomDto = roomSchema.parse(await response.json());
          assert.deepEqual(body, {
            id: room,
            title: 'Original Room',
            visibility: RoomVisibilityDto.private,
            projectId: project,
            canvases: [{ id: body.joinCanvasId, title: 'New Canvas' }],
            joinCanvasId: body.joinCanvasId,
            databases: [],
            activeUsers: [],
          });
        });
      });
      describe('403', (): void => {
        test('rejects a removed collaborator with the same login', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [collaborator.documentId],
            },
            testContext,
          );
          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: project,
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
          const roomUrl: string = `${manager.apiUrl}/project/${project}/room/${room}`;
          const authorized: Response = await fetch(roomUrl, {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          });
          assert.equal(authorized.status, 200);
          assert.equal(roomSchema.parse(await authorized.json()).id, room);
          const removal: Response = await manager.publishDocument(
            'api::project.project',
            project,
            { collaborators: [] },
            testContext,
          );
          assert.equal(removal.status, 200, await removal.text());
          const projectUrl: string = `${manager.apiUrl}/project/${project}`;
          const revoked: Response = await fetch(projectUrl, {
            headers: new Headers([
              ['Authorization', `Bearer ${ownerLogin.jwt}`],
            ]),
            signal: testContext.signal,
          });
          assert.equal(revoked.status, 200);
          assert.deepEqual(
            z
              .object({ collaborators: z.array(z.unknown()) })
              .parse(await revoked.json()).collaborators,
            [],
          );

          // when
          const response: Response = await fetch(roomUrl, {
            method: 'GET',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
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

        test('rejects anonymous access even for a public room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.public,
              project: project,
            },
            testContext,
          );

          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

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
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const outsider: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.public,
              project: project,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          // when
          const response: Response = await fetch(url, {
            method: 'GET',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
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
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
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
          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: otherProject,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          // when
          const response: Response = await fetch(url, {
            method: 'GET',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
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
        test('rejects an unknown room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
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
          const url: string = `${manager.apiUrl}/project/${project}/room/${randomUUID()}`;

          // when
          const response: Response = await fetch(url, {
            method: 'GET',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });

        test('rejects a draft room even for its owner', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const creation: Response = await manager.createDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.public,
              project: project,
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
            `${manager.apiUrl}/project/${project}/room/${draft.data.documentId}`,
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

        test('rejects a published room whose project is a draft', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.public,
              project: project,
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
          const storedProject: Response = await manager.readDocument(
            'api::project.project',
            project,
            testContext,
          );
          assert.equal(storedProject.status, 200);
          z.object({ data: z.object({ publishedAt: z.null() }) }).parse(
            await storedProject.json(),
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/room/${room}`,
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

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: project,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${randomUUID()}/room/${room}`;

          // when
          const response: Response = await fetch(url, {
            method: 'GET',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
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
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: project,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: new Headers([
              ['Authorization', `Bearer ${login.jwt}`],
              ['Content-Type', 'application/json'],
            ]),
            body: JSON.stringify({
              title: 'Updated Room',
              visibility: RoomVisibilityDto.public,
            }),
            signal: testContext.signal,
          });

          // then
          const persisted: Response = await fetch(url, {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          });

          assert.equal(response.status, 200);
          const body: RoomDto = roomSchema.parse(await response.json());
          assert.deepEqual(body, {
            id: room,
            title: 'Updated Room',
            visibility: RoomVisibilityDto.public,
            projectId: project,
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
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [collaborator.documentId],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: project,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: new Headers([
              ['Authorization', `Bearer ${login.jwt}`],
              ['Content-Type', 'application/json'],
            ]),
            body: JSON.stringify({
              title: 'Updated Room',
              visibility: RoomVisibilityDto.public,
            }),
            signal: testContext.signal,
          });

          // then
          const persisted: Response = await fetch(url, {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          });

          assert.equal(response.status, 200);
          const body: RoomDto = roomSchema.parse(await response.json());
          assert.deepEqual(body, {
            id: room,
            title: 'Updated Room',
            visibility: RoomVisibilityDto.public,
            projectId: project,
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
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
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
          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: new Headers([
              ['Authorization', `Bearer ${login.jwt}`],
              ['Content-Type', 'application/json'],
            ]),
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
            id: room,
            title: 'Original Room',
            visibility: RoomVisibilityDto.private,
            projectId: project,
            canvases: [{ id: body.joinCanvasId, title: 'New Canvas' }],
            joinCanvasId: body.joinCanvasId,
            databases: [],
            activeUsers: [],
          });
        });
        test('can change visibility to unlisted', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
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
          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: new Headers([
              ['Authorization', `Bearer ${login.jwt}`],
              ['Content-Type', 'application/json'],
            ]),
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
            id: room,
            title: 'Original Room',
            visibility: RoomVisibilityDto.unlisted,
            projectId: project,
            canvases: [{ id: body.joinCanvasId, title: 'New Canvas' }],
            joinCanvasId: body.joinCanvasId,
            databases: [],
            activeUsers: [],
          });
        });
        test('accepts an empty title', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: project,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: new Headers([
              ['Authorization', `Bearer ${login.jwt}`],
              ['Content-Type', 'application/json'],
            ]),
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
            id: room,
            title: '',
            visibility: RoomVisibilityDto.private,
            projectId: project,
            canvases: [{ id: body.joinCanvasId, title: 'New Canvas' }],
            joinCanvasId: body.joinCanvasId,
            databases: [],
            activeUsers: [],
          });
        });
      });
      describe('403', (): void => {
        test('rejects a removed collaborator with the same login', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [collaborator.documentId],
            },
            testContext,
          );
          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: project,
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
          const roomUrl: string = `${manager.apiUrl}/project/${project}/room/${room}`;
          const authorized: Response = await fetch(roomUrl, {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          });
          assert.equal(authorized.status, 200);
          assert.equal(roomSchema.parse(await authorized.json()).id, room);
          const removal: Response = await manager.publishDocument(
            'api::project.project',
            project,
            { collaborators: [] },
            testContext,
          );
          assert.equal(removal.status, 200, await removal.text());
          const projectUrl: string = `${manager.apiUrl}/project/${project}`;
          const revoked: Response = await fetch(projectUrl, {
            headers: new Headers([
              ['Authorization', `Bearer ${ownerLogin.jwt}`],
            ]),
            signal: testContext.signal,
          });
          assert.equal(revoked.status, 200);
          assert.deepEqual(
            z
              .object({ collaborators: z.array(z.unknown()) })
              .parse(await revoked.json()).collaborators,
            [],
          );

          const originalResponse: Response = await manager.readDocument(
            'api::room.room',
            room,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: z.infer<typeof roomStateSchema> =
            roomStateSchema.parse(await originalResponse.json());

          // when
          const response: Response = await fetch(roomUrl, {
            method: 'PUT',
            headers: new Headers([
              ['Authorization', `Bearer ${login.jwt}`],
              ['Content-Type', 'application/json'],
            ]),
            body: JSON.stringify({
              title: 'Denied',
              visibility: RoomVisibilityDto.public,
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
          const persisted: Response = await manager.readDocument(
            'api::room.room',
            room,
            testContext,
          );
          assert.equal(persisted.status, 200);
          assert.deepEqual(
            roomStateSchema.parse(await persisted.json()),
            original,
          );
        });

        test('rejects anonymous access even for a public room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.public,
              project: project,
            },
            testContext,
          );

          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          const originalResponse: Response = await manager.readDocument(
            'api::room.room',
            room,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: z.infer<typeof roomStateSchema> =
            roomStateSchema.parse(await originalResponse.json());

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: new Headers([['Content-Type', 'application/json']]),
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
          const persisted: Response = await manager.readDocument(
            'api::room.room',
            room,
            testContext,
          );
          assert.equal(persisted.status, 200);
          assert.deepEqual(
            roomStateSchema.parse(await persisted.json()),
            original,
          );
        });
        test('rejects outsider access even for a public room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const outsider: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.public,
              project: project,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          const originalResponse: Response = await manager.readDocument(
            'api::room.room',
            room,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: z.infer<typeof roomStateSchema> =
            roomStateSchema.parse(await originalResponse.json());

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: new Headers([
              ['Authorization', `Bearer ${login.jwt}`],
              ['Content-Type', 'application/json'],
            ]),
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
          const persisted: Response = await manager.readDocument(
            'api::room.room',
            room,
            testContext,
          );
          assert.equal(persisted.status, 200);
          assert.deepEqual(
            roomStateSchema.parse(await persisted.json()),
            original,
          );
        });
        test('rejects a room belonging to another project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
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
          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: otherProject,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          const originalResponse: Response = await manager.readDocument(
            'api::room.room',
            room,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: z.infer<typeof roomStateSchema> =
            roomStateSchema.parse(await originalResponse.json());

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: new Headers([
              ['Authorization', `Bearer ${login.jwt}`],
              ['Content-Type', 'application/json'],
            ]),
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
          const persisted: Response = await manager.readDocument(
            'api::room.room',
            room,
            testContext,
          );
          assert.equal(persisted.status, 200);
          assert.deepEqual(
            roomStateSchema.parse(await persisted.json()),
            original,
          );
        });
      });
      describe('404', (): void => {
        test('rejects an unknown room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
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
          const url: string = `${manager.apiUrl}/project/${project}/room/${randomUUID()}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: new Headers([
              ['Authorization', `Bearer ${login.jwt}`],
              ['Content-Type', 'application/json'],
            ]),
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

        test('rejects a draft room even for its owner', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const creation: Response = await manager.createDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.public,
              project: project,
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
            `${manager.apiUrl}/project/${project}/room/${draft.data.documentId}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Changed Room',
                visibility: RoomVisibilityDto.private,
              }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
          const storedRoom: Response = await manager.readDocument(
            'api::room.room',
            draft.data.documentId,
            testContext,
          );
          assert.equal(storedRoom.status, 200);
          z.object({
            data: z.object({
              documentId: z.literal(draft.data.documentId),
              title: z.literal('Original Room'),
              visibility: z.literal(RoomVisibilityDto.public),
              publishedAt: z.null(),
            }),
          }).parse(await storedRoom.json());
        });

        test('rejects a published room whose project is a draft', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.public,
              project: project,
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
          const storedProject: Response = await manager.readDocument(
            'api::project.project',
            project,
            testContext,
          );
          assert.equal(storedProject.status, 200);
          z.object({ data: z.object({ publishedAt: z.null() }) }).parse(
            await storedProject.json(),
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/room/${room}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                title: 'Changed Room',
                visibility: RoomVisibilityDto.private,
              }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
          const storedRoom: Response = await manager.readDocument(
            'api::room.room',
            room,
            testContext,
          );
          assert.equal(storedRoom.status, 200);
          z.object({
            data: z.object({
              documentId: z.literal(room),
              title: z.literal('Original Room'),
              visibility: z.literal(RoomVisibilityDto.public),
            }),
          }).parse(await storedRoom.json());
        });

        test('rejects an unknown project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: project,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${randomUUID()}/room/${room}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: new Headers([
              ['Authorization', `Bearer ${login.jwt}`],
              ['Content-Type', 'application/json'],
            ]),
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
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: project,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: new Headers([
              ['Authorization', `Bearer ${login.jwt}`],
              ['Content-Type', 'application/json'],
            ]),
            body: JSON.stringify({ visibility: RoomVisibilityDto.private }),
            signal: testContext.signal,
          });

          // then
          const persisted: Response = await fetch(url, {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          });

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
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: project,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: new Headers([
              ['Authorization', `Bearer ${login.jwt}`],
              ['Content-Type', 'application/json'],
            ]),
            body: JSON.stringify({
              title: null,
              visibility: RoomVisibilityDto.private,
            }),
            signal: testContext.signal,
          });

          // then
          const persisted: Response = await fetch(url, {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          });

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
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: project,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: new Headers([
              ['Authorization', `Bearer ${login.jwt}`],
              ['Content-Type', 'application/json'],
            ]),
            body: JSON.stringify({
              title: 42,
              visibility: RoomVisibilityDto.private,
            }),
            signal: testContext.signal,
          });

          // then
          const persisted: Response = await fetch(url, {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          });

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
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: project,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: new Headers([
              ['Authorization', `Bearer ${login.jwt}`],
              ['Content-Type', 'application/json'],
            ]),
            body: JSON.stringify({ title: 'Changed' }),
            signal: testContext.signal,
          });

          // then
          const persisted: Response = await fetch(url, {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          });

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
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: project,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: new Headers([
              ['Authorization', `Bearer ${login.jwt}`],
              ['Content-Type', 'application/json'],
            ]),
            body: JSON.stringify({ title: 'Changed', visibility: null }),
            signal: testContext.signal,
          });

          // then
          const persisted: Response = await fetch(url, {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          });

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
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: project,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: new Headers([
              ['Authorization', `Bearer ${login.jwt}`],
              ['Content-Type', 'application/json'],
            ]),
            body: JSON.stringify({ title: 'Changed', visibility: 'unknown' }),
            signal: testContext.signal,
          });

          // then
          const persisted: Response = await fetch(url, {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          });

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
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: project,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: new Headers([
              ['Authorization', `Bearer ${login.jwt}`],
              ['Content-Type', 'application/json'],
            ]),
            body: JSON.stringify({ title: 'Changed', visibility: 42 }),
            signal: testContext.signal,
          });

          // then
          const persisted: Response = await fetch(url, {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          });

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
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: project,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          // when
          const response: Response = await fetch(url, {
            method: 'PUT',
            headers: new Headers([
              ['Authorization', `Bearer ${login.jwt}`],
              ['Content-Type', 'application/json'],
            ]),
            body: JSON.stringify({
              title: 'Changed',
              visibility: RoomVisibilityDto.private,
              unexpected: true,
            }),
            signal: testContext.signal,
          });

          // then
          const persisted: Response = await fetch(url, {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          });

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
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: project,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          // when
          const response: Response = await fetch(url, {
            method: 'DELETE',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          });

          // then
          const persisted: Response = await manager.readDocument(
            'api::room.room',
            room,
            testContext,
          );
          assert.equal(response.status, 200);
          assert.equal(await response.text(), '');
          assert.equal(persisted.status, 404);
        });
        test('collaborator can delete the room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [collaborator.documentId],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: project,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          // when
          const response: Response = await fetch(url, {
            method: 'DELETE',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          });

          // then
          const persisted: Response = await manager.readDocument(
            'api::room.room',
            room,
            testContext,
          );
          assert.equal(response.status, 200);
          assert.equal(await response.text(), '');
          assert.equal(persisted.status, 404);
        });
      });
      describe('403', (): void => {
        test('rejects a removed collaborator with the same login', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [collaborator.documentId],
            },
            testContext,
          );
          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: project,
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
          const roomUrl: string = `${manager.apiUrl}/project/${project}/room/${room}`;
          const authorized: Response = await fetch(roomUrl, {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          });
          assert.equal(authorized.status, 200);
          assert.equal(roomSchema.parse(await authorized.json()).id, room);
          const removal: Response = await manager.publishDocument(
            'api::project.project',
            project,
            { collaborators: [] },
            testContext,
          );
          assert.equal(removal.status, 200, await removal.text());
          const projectUrl: string = `${manager.apiUrl}/project/${project}`;
          const revoked: Response = await fetch(projectUrl, {
            headers: new Headers([
              ['Authorization', `Bearer ${ownerLogin.jwt}`],
            ]),
            signal: testContext.signal,
          });
          assert.equal(revoked.status, 200);
          assert.deepEqual(
            z
              .object({ collaborators: z.array(z.unknown()) })
              .parse(await revoked.json()).collaborators,
            [],
          );

          const originalResponse: Response = await manager.readDocument(
            'api::room.room',
            room,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: z.infer<typeof roomStateSchema> =
            roomStateSchema.parse(await originalResponse.json());

          // when
          const response: Response = await fetch(roomUrl, {
            method: 'DELETE',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            message: 'Forbidden resource',
            error: 'Forbidden',
          });
          const persisted: Response = await manager.readDocument(
            'api::room.room',
            room,
            testContext,
          );
          assert.equal(persisted.status, 200);
          assert.deepEqual(
            roomStateSchema.parse(await persisted.json()),
            original,
          );
        });

        test('rejects anonymous access even for a public room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.public,
              project: project,
            },
            testContext,
          );

          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          const originalResponse: Response = await manager.readDocument(
            'api::room.room',
            room,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: z.infer<typeof roomStateSchema> =
            roomStateSchema.parse(await originalResponse.json());

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
          const persisted: Response = await manager.readDocument(
            'api::room.room',
            room,
            testContext,
          );
          assert.equal(persisted.status, 200);
          assert.deepEqual(
            roomStateSchema.parse(await persisted.json()),
            original,
          );
        });
        test('rejects outsider access even for a public room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const outsider: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.public,
              project: project,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          const originalResponse: Response = await manager.readDocument(
            'api::room.room',
            room,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: z.infer<typeof roomStateSchema> =
            roomStateSchema.parse(await originalResponse.json());

          // when
          const response: Response = await fetch(url, {
            method: 'DELETE',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            message: 'Forbidden resource',
            error: 'Forbidden',
          });
          const persisted: Response = await manager.readDocument(
            'api::room.room',
            room,
            testContext,
          );
          assert.equal(persisted.status, 200);
          assert.deepEqual(
            roomStateSchema.parse(await persisted.json()),
            original,
          );
        });
        test('rejects a room belonging to another project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
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
          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: otherProject,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${project}/room/${room}`;

          const originalResponse: Response = await manager.readDocument(
            'api::room.room',
            room,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: z.infer<typeof roomStateSchema> =
            roomStateSchema.parse(await originalResponse.json());

          // when
          const response: Response = await fetch(url, {
            method: 'DELETE',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            statusCode: 403,
            message: 'Forbidden resource',
            error: 'Forbidden',
          });
          const persisted: Response = await manager.readDocument(
            'api::room.room',
            room,
            testContext,
          );
          assert.equal(persisted.status, 200);
          assert.deepEqual(
            roomStateSchema.parse(await persisted.json()),
            original,
          );
        });
      });
      describe('404', (): void => {
        test('rejects an unknown room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
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
          const url: string = `${manager.apiUrl}/project/${project}/room/${randomUUID()}`;

          // when
          const response: Response = await fetch(url, {
            method: 'DELETE',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
        });

        test('rejects a draft room even for its owner', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const creation: Response = await manager.createDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.public,
              project: project,
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
            `${manager.apiUrl}/project/${project}/room/${draft.data.documentId}`,
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
          const storedRoom: Response = await manager.readDocument(
            'api::room.room',
            draft.data.documentId,
            testContext,
          );
          assert.equal(storedRoom.status, 200);
          z.object({
            data: z.object({
              documentId: z.literal(draft.data.documentId),
              title: z.literal('Original Room'),
              visibility: z.literal(RoomVisibilityDto.public),
              publishedAt: z.null(),
            }),
          }).parse(await storedRoom.json());
        });

        test('rejects a published room whose project is a draft', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );
          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.public,
              project: project,
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
          const storedProject: Response = await manager.readDocument(
            'api::project.project',
            project,
            testContext,
          );
          assert.equal(storedProject.status, 200);
          z.object({ data: z.object({ publishedAt: z.null() }) }).parse(
            await storedProject.json(),
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/project/${project}/room/${room}`,
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
          const storedRoom: Response = await manager.readDocument(
            'api::room.room',
            room,
            testContext,
          );
          assert.equal(storedRoom.status, 200);
          z.object({
            data: z.object({
              documentId: z.literal(room),
              title: z.literal('Original Room'),
              visibility: z.literal(RoomVisibilityDto.public),
            }),
          }).parse(await storedRoom.json());
        });

        test('rejects an unknown project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          const project: string = await manager.createPublishedDocument(
            'api::project.project',
            {
              title: 'Room Project',
              owner: owner.documentId,
              collaborators: [],
            },
            testContext,
          );

          const room: string = await manager.createPublishedDocument(
            'api::room.room',
            {
              title: 'Original Room',
              visibility: RoomVisibilityDto.private,
              project: project,
            },
            testContext,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const url: string = `${manager.apiUrl}/project/${randomUUID()}/room/${room}`;

          // when
          const response: Response = await fetch(url, {
            method: 'DELETE',
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
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
