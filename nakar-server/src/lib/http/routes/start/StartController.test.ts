import type { FixtureContext } from '../../../../e2e/FixtureContext';
import type { E2ETestApplicationUser } from '../../../../e2e/E2ETestApplicationUser';
import type { PostAuthResponseBodyDto } from '../auth/dto/PostAuthResponseBodyDto';
import type { StartPageDto } from './dto/StartPageDto';
import type { StartPageProjectDto } from './dto/StartPageProjectDto';
import type { StartPageRoomDto } from './dto/StartPageRoomDto';
import type { UserPreviewDto } from '../../../schema/dtos/UserPreviewDto';
import type { DatabaseConnectionDto } from '../../../schema/dtos/DatabaseConnectionDto';
import { NodeConfigurationTypeDto } from '../../../schema/dtos/NodeConfigurationTypeDto';
import { DatabaseConnectionDatabaseType } from '../database-connection/dto/DatabaseConnectionDatabaseType';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { SuiteContext, TestContext } from 'node:test';
import { after, before, describe, test } from 'node:test';
import z from 'zod';
import { E2ETestManager } from '../../../../e2e/E2ETestManager';
import { RoomVisibilityDto } from '../../../schema/dtos/RoomVisibilityDto';

const userSchema: z.ZodType<UserPreviewDto> = z.strictObject({
  id: z.string().min(1),
  displayName: z.string().nullable(),
});
// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-assignment -- Zod validates the nested enum values at runtime.
const databaseSchema: z.ZodType<DatabaseConnectionDto> = z.strictObject({
  id: z.string().min(1),
  title: z.string(),
  connectionUrl: z.string(),
  browserUrl: z.string(),
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
const projectSchema: z.ZodType<StartPageProjectDto> = z.strictObject({
  id: z.string().min(1),
  title: z.string(),
  owner: userSchema.nullable(),
  collaborators: z.array(userSchema),
  databases: z.array(databaseSchema),
  activeUsers: z.array(userSchema),
});
const roomSchema: z.ZodType<StartPageRoomDto> = z.strictObject({
  id: z.string().min(1),
  title: z.string(),
  visibility: z.enum(RoomVisibilityDto),
  joinCanvasId: z.string().min(1),
  activeUsers: z.array(userSchema),
});
const startSchema: z.ZodType<StartPageDto> = z.strictObject({
  myProjects: z.array(projectSchema),
  collaborationProjects: z.array(projectSchema),
  publicRooms: z.array(roomSchema),
  recentRooms: z.array(roomSchema),
});

describe('/', (suiteContext: SuiteContext): void => {
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

  describe('GET', (): void => {
    describe('200', (): void => {
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
        const room: string = await manager.createPublishedDocument(
          'api::room.room',
          {
            title: 'Published Room',
            project,
            visibility: RoomVisibilityDto.public,
          },
          testContext,
        );
        const draftCreation: Response = await manager.createDocument(
          'api::project.project',
          {
            title: 'Draft Project',
            owner: owner.documentId,
            collaborators: [],
          },
          testContext,
        );
        assert.equal(draftCreation.status, 201);
        const draftProject: {
          data: { documentId: string; publishedAt: null };
        } = z
          .object({
            data: z.object({
              documentId: z.string().min(1),
              publishedAt: z.null(),
            }),
          })
          .parse(await draftCreation.json());
        const reassignment: Response = await manager.updateDocument(
          'api::room.room',
          room,
          {
            project: draftProject.data.documentId,
            title: 'Draft Room',
            visibility: RoomVisibilityDto.private,
          },
          testContext,
        );
        assert.equal(reassignment.status, 200);

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${room}`,
          { signal: testContext.signal },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        const publicRoom: StartPageRoomDto | undefined = body.publicRooms.find(
          (item: StartPageRoomDto): boolean => item.id === room,
        );
        assert.ok(publicRoom);
        assert.equal(publicRoom.title, 'Published Room');
        assert.equal(publicRoom.visibility, RoomVisibilityDto.public);
        const recentRoom: StartPageRoomDto | undefined = body.recentRooms.find(
          (item: StartPageRoomDto): boolean => item.id === room,
        );
        assert.ok(recentRoom);
        assert.deepEqual(recentRoom, publicRoom);
      });

      test('recentRooms excludes draft rooms', async (testContext: TestContext): Promise<void> => {
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
        const publishedRoom: string = await manager.createPublishedDocument(
          'api::room.room',
          {
            title: 'Published Room',
            visibility: RoomVisibilityDto.public,
            project: project,
          },
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
          `${manager.apiUrl}?recentRoomIds=${draft.data.documentId},${publishedRoom}`,
          {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(
          body.recentRooms.map((room: StartPageRoomDto): string => room.id),
          [publishedRoom],
        );
      });

      test('publicRooms excludes draft rooms', async (testContext: TestContext): Promise<void> => {
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
        const publishedRoom: string = await manager.createPublishedDocument(
          'api::room.room',
          {
            title: 'Published Room',
            visibility: RoomVisibilityDto.public,
            project: project,
          },
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
        const response: Response = await fetch(manager.apiUrl, {
          headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        const relevantRoomIds: string[] = body.publicRooms
          .map((room: StartPageRoomDto): string => room.id)
          .filter((id: string): boolean =>
            [draft.data.documentId, publishedRoom].includes(id),
          );
        assert.deepEqual(relevantRoomIds, [publishedRoom]);
      });

      test('myProjects excludes draft projects', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const publishedProject: string = await manager.createPublishedDocument(
          'api::project.project',
          {
            title: 'Published Project',
            owner: owner.documentId,
            collaborators: [],
          },
          testContext,
        );
        const creation: Response = await manager.createDocument(
          'api::project.project',
          {
            title: 'Draft Project',
            owner: owner.documentId,
            collaborators: [],
          },
          testContext,
        );
        assert.equal(creation.status, 201);
        z.object({ data: z.object({ publishedAt: z.null() }) }).parse(
          await creation.json(),
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(
          body.myProjects.map(
            (project: StartPageProjectDto): string => project.id,
          ),
          [publishedProject],
        );
      });

      test('collaborationProjects excludes draft projects', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);

        const collaborator: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const publishedProject: string = await manager.createPublishedDocument(
          'api::project.project',
          {
            title: 'Published Project',
            owner: owner.documentId,
            collaborators: [collaborator.documentId],
          },
          testContext,
        );
        const creation: Response = await manager.createDocument(
          'api::project.project',
          {
            title: 'Draft Project',
            owner: owner.documentId,
            collaborators: [collaborator.documentId],
          },
          testContext,
        );
        assert.equal(creation.status, 201);
        z.object({ data: z.object({ publishedAt: z.null() }) }).parse(
          await creation.json(),
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          collaborator.username,
          collaborator.password,
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(
          body.collaborationProjects.map(
            (project: StartPageProjectDto): string => project.id,
          ),
          [publishedProject],
        );
      });

      test('recentRooms excludes published rooms of a draft project', async (testContext: TestContext): Promise<void> => {
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
        const unpublish: Response = await manager.unpublishDocument(
          'api::project.project',
          project,
          {},
          testContext,
        );
        assert.equal(unpublish.status, 200, await unpublish.text());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${room}`,
          {
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(
          body.recentRooms.some(
            (item: StartPageRoomDto): boolean => item.id === room,
          ),
          false,
        );
      });

      test('publicRooms excludes published rooms of a draft project', async (testContext: TestContext): Promise<void> => {
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
        const unpublish: Response = await manager.unpublishDocument(
          'api::project.project',
          project,
          {},
          testContext,
        );
        assert.equal(unpublish.status, 200, await unpublish.text());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${room}`,
          {
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(
          body.publicRooms.some(
            (item: StartPageRoomDto): boolean => item.id === room,
          ),
          false,
        );
      });

      test('lists published project and room titles despite draft changes', async (testContext: TestContext): Promise<void> => {
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
        const projectUpdate: Response = await manager.updateDocument(
          'api::project.project',
          project,
          { title: 'Draft Project Title' },
          testContext,
        );
        assert.equal(projectUpdate.status, 200, await projectUpdate.text());
        const roomUpdate: Response = await manager.updateDocument(
          'api::room.room',
          room,
          {
            title: 'Draft Room Title',
            visibility: RoomVisibilityDto.private,
          },
          testContext,
        );
        assert.equal(roomUpdate.status, 200, await roomUpdate.text());

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${room}`,
          {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(
          body.myProjects.find(
            (item: StartPageProjectDto): boolean => item.id === project,
          )?.title,
          'Published Project',
        );
        assert.equal(body.recentRooms[0].title, 'Published Room');
        assert.equal(body.recentRooms[0].visibility, RoomVisibilityDto.public);
        assert.equal(
          body.publicRooms.find(
            (item: StartPageRoomDto): boolean => item.id === room,
          )?.title,
          'Published Room',
        );
      });

      test('anonymous has no owned projects', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        await manager.createPublishedDocument(
          'api::project.project',
          {
            title: 'E2E Project',
            owner: primaryUser.documentId,
            collaborators: [],
          },
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(body.myProjects, []);
      });

      test('owner sees owned project', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.owner.username,
          fixture.owner.password,
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.myProjects.length, 1);
        const databases: DatabaseConnectionDto[] = body.myProjects[0].databases;
        assert.deepEqual(
          databases
            .map((database: DatabaseConnectionDto): string => database.id)
            .toSorted(),
          [fixture.databaseConnectionId, fixture.sparqlConnectionId].toSorted(),
        );
        assert.deepEqual(body.myProjects, [
          {
            id: fixture.projectId,
            title: 'Test Project',
            owner: {
              id: fixture.owner.documentId,
              displayName: fixture.owner.username,
            },
            collaborators: [
              {
                id: fixture.collaborator.documentId,
                displayName: fixture.collaborator.username,
              },
            ],
            databases,
            activeUsers: [],
          },
        ]);
      });

      test('collaborator has no owned projects', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.collaborator.username,
          fixture.collaborator.password,
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(body.myProjects, []);
      });

      test('outsider has no owned projects', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.outsider.username,
          fixture.outsider.password,
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(body.myProjects, []);
      });

      test('anonymous has no collaboration projects', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        await manager.createPublishedDocument(
          'api::project.project',
          {
            title: 'E2E Project',
            owner: primaryUser.documentId,
            collaborators: [],
          },
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(body.collaborationProjects, []);
      });

      test('owner has no collaboration projects', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.owner.username,
          fixture.owner.password,
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(body.collaborationProjects, []);
      });

      test('collaborator sees collaboration project', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.collaborator.username,
          fixture.collaborator.password,
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.collaborationProjects.length, 1);
        const databases: DatabaseConnectionDto[] =
          body.collaborationProjects[0].databases;
        assert.deepEqual(
          databases
            .map((database: DatabaseConnectionDto): string => database.id)
            .toSorted(),
          [fixture.databaseConnectionId, fixture.sparqlConnectionId].toSorted(),
        );
        assert.deepEqual(body.collaborationProjects, [
          {
            id: fixture.projectId,
            title: 'Test Project',
            owner: {
              id: fixture.owner.documentId,
              displayName: fixture.owner.username,
            },
            collaborators: [
              {
                id: fixture.collaborator.documentId,
                displayName: fixture.collaborator.username,
              },
            ],
            databases,
            activeUsers: [],
          },
        ]);
      });

      test('outsider has no collaboration projects', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.outsider.username,
          fixture.outsider.password,
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(body.collaborationProjects, []);
      });

      test('public room listing excludes rooms without a project', async (testContext: TestContext): Promise<void> => {
        // given
        const danglingRoom: string = await manager.createPublishedDocument(
          'api::room.room',
          {
            title: 'Dangling Public Room',
            visibility: RoomVisibilityDto.public,
            project: null,
          },
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.ok(
          body.publicRooms.every(
            (room: StartPageRoomDto): boolean => room.id !== danglingRoom,
          ),
        );
      });

      test('public room listing for anonymous', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const publicRoom: string =
          fixture.canvases[RoomVisibilityDto.public].roomId;

        // when
        const response: Response = await fetch(manager.apiUrl, {
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        const rooms: StartPageRoomDto[] = body.publicRooms.filter(
          (room: StartPageRoomDto): boolean => room.id === publicRoom,
        );
        assert.equal(rooms.length, 1);
        assert.equal(rooms[0].id, publicRoom);
        assert.equal(rooms[0].title, 'Public Room');
        assert.equal(rooms[0].visibility, RoomVisibilityDto.public);
        assert.deepEqual(rooms[0].activeUsers, []);
        assert.ok(
          body.publicRooms.every(
            (room: StartPageRoomDto): boolean =>
              room.visibility === RoomVisibilityDto.public,
          ),
        );
      });

      test('public room listing for owner', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const publicRoom: string =
          fixture.canvases[RoomVisibilityDto.public].roomId;
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.owner.username,
          fixture.owner.password,
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        const rooms: StartPageRoomDto[] = body.publicRooms.filter(
          (room: StartPageRoomDto): boolean => room.id === publicRoom,
        );
        assert.equal(rooms.length, 1);
        assert.equal(rooms[0].id, publicRoom);
        assert.equal(rooms[0].title, 'Public Room');
        assert.equal(rooms[0].visibility, RoomVisibilityDto.public);
        assert.deepEqual(rooms[0].activeUsers, []);
        assert.ok(
          body.publicRooms.every(
            (room: StartPageRoomDto): boolean =>
              room.visibility === RoomVisibilityDto.public,
          ),
        );
      });

      test('public room listing for collaborator', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const publicRoom: string =
          fixture.canvases[RoomVisibilityDto.public].roomId;
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.collaborator.username,
          fixture.collaborator.password,
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        const rooms: StartPageRoomDto[] = body.publicRooms.filter(
          (room: StartPageRoomDto): boolean => room.id === publicRoom,
        );
        assert.equal(rooms.length, 1);
        assert.equal(rooms[0].id, publicRoom);
        assert.equal(rooms[0].title, 'Public Room');
        assert.equal(rooms[0].visibility, RoomVisibilityDto.public);
        assert.deepEqual(rooms[0].activeUsers, []);
        assert.ok(
          body.publicRooms.every(
            (room: StartPageRoomDto): boolean =>
              room.visibility === RoomVisibilityDto.public,
          ),
        );
      });

      test('public room listing for outsider', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const publicRoom: string =
          fixture.canvases[RoomVisibilityDto.public].roomId;
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.outsider.username,
          fixture.outsider.password,
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        const rooms: StartPageRoomDto[] = body.publicRooms.filter(
          (room: StartPageRoomDto): boolean => room.id === publicRoom,
        );
        assert.equal(rooms.length, 1);
        assert.equal(rooms[0].id, publicRoom);
        assert.equal(rooms[0].title, 'Public Room');
        assert.equal(rooms[0].visibility, RoomVisibilityDto.public);
        assert.deepEqual(rooms[0].activeUsers, []);
        assert.ok(
          body.publicRooms.every(
            (room: StartPageRoomDto): boolean =>
              room.visibility === RoomVisibilityDto.public,
          ),
        );
      });

      test('anonymous cannot see recent private room', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const privateRoom: string =
          fixture.canvases[RoomVisibilityDto.private].roomId;

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${privateRoom}`,
          {
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(body.recentRooms, []);
      });

      test('owner sees recent private room', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const privateRoom: string =
          fixture.canvases[RoomVisibilityDto.private].roomId;
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.owner.username,
          fixture.owner.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${privateRoom}`,
          {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.recentRooms.length, 1);
        assert.equal(body.recentRooms[0].id, privateRoom);
        assert.equal(body.recentRooms[0].title, 'Private Room');
        assert.equal(body.recentRooms[0].visibility, RoomVisibilityDto.private);
        assert.deepEqual(body.recentRooms[0].activeUsers, []);
      });

      test('collaborator sees recent private room', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const privateRoom: string =
          fixture.canvases[RoomVisibilityDto.private].roomId;
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.collaborator.username,
          fixture.collaborator.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${privateRoom}`,
          {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.recentRooms.length, 1);
        assert.equal(body.recentRooms[0].id, privateRoom);
        assert.equal(body.recentRooms[0].title, 'Private Room');
        assert.equal(body.recentRooms[0].visibility, RoomVisibilityDto.private);
        assert.deepEqual(body.recentRooms[0].activeUsers, []);
      });

      test('outsider cannot see recent private room', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const privateRoom: string =
          fixture.canvases[RoomVisibilityDto.private].roomId;
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.outsider.username,
          fixture.outsider.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${privateRoom}`,
          {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(body.recentRooms, []);
      });

      test('anonymous sees recent unlisted room', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const unlistedRoom: string =
          fixture.canvases[RoomVisibilityDto.unlisted].roomId;

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${unlistedRoom}`,
          {
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.recentRooms.length, 1);
        assert.equal(body.recentRooms[0].id, unlistedRoom);
        assert.equal(body.recentRooms[0].title, 'Unlisted Room');
        assert.equal(
          body.recentRooms[0].visibility,
          RoomVisibilityDto.unlisted,
        );
        assert.deepEqual(body.recentRooms[0].activeUsers, []);
      });

      test('owner sees recent unlisted room', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const unlistedRoom: string =
          fixture.canvases[RoomVisibilityDto.unlisted].roomId;
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.owner.username,
          fixture.owner.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${unlistedRoom}`,
          {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.recentRooms.length, 1);
        assert.equal(body.recentRooms[0].id, unlistedRoom);
        assert.equal(body.recentRooms[0].title, 'Unlisted Room');
        assert.equal(
          body.recentRooms[0].visibility,
          RoomVisibilityDto.unlisted,
        );
        assert.deepEqual(body.recentRooms[0].activeUsers, []);
      });

      test('collaborator sees recent unlisted room', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const unlistedRoom: string =
          fixture.canvases[RoomVisibilityDto.unlisted].roomId;
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.collaborator.username,
          fixture.collaborator.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${unlistedRoom}`,
          {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.recentRooms.length, 1);
        assert.equal(body.recentRooms[0].id, unlistedRoom);
        assert.equal(body.recentRooms[0].title, 'Unlisted Room');
        assert.equal(
          body.recentRooms[0].visibility,
          RoomVisibilityDto.unlisted,
        );
        assert.deepEqual(body.recentRooms[0].activeUsers, []);
      });

      test('outsider sees recent unlisted room', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const unlistedRoom: string =
          fixture.canvases[RoomVisibilityDto.unlisted].roomId;
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.outsider.username,
          fixture.outsider.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${unlistedRoom}`,
          {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.recentRooms.length, 1);
        assert.equal(body.recentRooms[0].id, unlistedRoom);
        assert.equal(body.recentRooms[0].title, 'Unlisted Room');
        assert.equal(
          body.recentRooms[0].visibility,
          RoomVisibilityDto.unlisted,
        );
        assert.deepEqual(body.recentRooms[0].activeUsers, []);
      });

      test('anonymous sees recent public room', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const publicRoom: string =
          fixture.canvases[RoomVisibilityDto.public].roomId;

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${publicRoom}`,
          {
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.recentRooms.length, 1);
        assert.equal(body.recentRooms[0].id, publicRoom);
        assert.equal(body.recentRooms[0].title, 'Public Room');
        assert.equal(body.recentRooms[0].visibility, RoomVisibilityDto.public);
        assert.deepEqual(body.recentRooms[0].activeUsers, []);
      });

      test('owner sees recent public room', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const publicRoom: string =
          fixture.canvases[RoomVisibilityDto.public].roomId;
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.owner.username,
          fixture.owner.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${publicRoom}`,
          {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.recentRooms.length, 1);
        assert.equal(body.recentRooms[0].id, publicRoom);
        assert.equal(body.recentRooms[0].title, 'Public Room');
        assert.equal(body.recentRooms[0].visibility, RoomVisibilityDto.public);
        assert.deepEqual(body.recentRooms[0].activeUsers, []);
      });

      test('collaborator sees recent public room', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const publicRoom: string =
          fixture.canvases[RoomVisibilityDto.public].roomId;
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.collaborator.username,
          fixture.collaborator.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${publicRoom}`,
          {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.recentRooms.length, 1);
        assert.equal(body.recentRooms[0].id, publicRoom);
        assert.equal(body.recentRooms[0].title, 'Public Room');
        assert.equal(body.recentRooms[0].visibility, RoomVisibilityDto.public);
        assert.deepEqual(body.recentRooms[0].activeUsers, []);
      });

      test('outsider sees recent public room', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const publicRoom: string =
          fixture.canvases[RoomVisibilityDto.public].roomId;
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          fixture.outsider.username,
          fixture.outsider.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${publicRoom}`,
          {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.recentRooms.length, 1);
        assert.equal(body.recentRooms[0].id, publicRoom);
        assert.equal(body.recentRooms[0].title, 'Public Room');
        assert.equal(body.recentRooms[0].visibility, RoomVisibilityDto.public);
        assert.deepEqual(body.recentRooms[0].activeUsers, []);
      });

      test('recent room order is preserved', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const project: string = await manager.createPublishedDocument(
          'api::project.project',
          {
            title: 'E2E Project',
            owner: primaryUser.documentId,
            collaborators: [],
          },
          testContext,
        );
        const privateRoom: string = await manager.createPublishedDocument(
          'api::room.room',
          {
            title: 'Private Room',
            visibility: RoomVisibilityDto.private,
            project: project,
          },
          testContext,
        );
        const unlistedRoom: string = await manager.createPublishedDocument(
          'api::room.room',
          {
            title: 'Unlisted Room',
            visibility: RoomVisibilityDto.unlisted,
            project: project,
          },
          testContext,
        );
        const publicRoom: string = await manager.createPublishedDocument(
          'api::room.room',
          {
            title: 'Public Room',
            visibility: RoomVisibilityDto.public,
            project: project,
          },
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          primaryUser.username,
          primaryUser.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${[
            unlistedRoom,
            privateRoom,
            publicRoom,
          ].join(',')}`,
          {
            headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(
          body.recentRooms.map((room: StartPageRoomDto): string => room.id),
          [unlistedRoom, privateRoom, publicRoom],
        );
      });

      test('recent room listing excludes rooms without a project', async (testContext: TestContext): Promise<void> => {
        // given
        const danglingRoom: string = await manager.createPublishedDocument(
          'api::room.room',
          {
            title: 'Dangling Recent Room',
            visibility: RoomVisibilityDto.unlisted,
            project: null,
          },
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${danglingRoom}`,
          { signal: testContext.signal },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(body.recentRooms, []);
      });

      test('unknown recent room is skipped', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const publicRoom: string =
          fixture.canvases[RoomVisibilityDto.public].roomId;

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${[randomUUID(), publicRoom].join(
            ',',
          )}`,
          {
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(
          body.recentRooms.map((room: StartPageRoomDto): string => room.id),
          [publicRoom],
        );
      });

      test('returns no recent rooms for an omitted or empty list', async (testContext: TestContext): Promise<void> => {
        const queries: string[] = ['', '?recentRoomIds='];
        for (const query of queries) {
          // when
          const response: Response = await fetch(`${manager.apiUrl}${query}`, {
            signal: testContext.signal,
          });

          // then
          const variant: string = query || 'omitted recentRoomIds';
          assert.equal(response.status, 200, variant);
          const body: StartPageDto = startSchema.parse(await response.json());
          assert.deepEqual(body.recentRooms, [], variant);
        }
      });

      test('invalid jwt does not reveal owned projects', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const privateRoom: string =
          fixture.canvases[RoomVisibilityDto.private].roomId;

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${privateRoom}`,
          {
            headers: new Headers([['Authorization', 'Bearer invalid-jwt']]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(body.myProjects, []);
      });

      test('invalid jwt does not reveal collaboration projects', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const privateRoom: string =
          fixture.canvases[RoomVisibilityDto.private].roomId;

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${privateRoom}`,
          {
            headers: new Headers([['Authorization', 'Bearer invalid-jwt']]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(body.collaborationProjects, []);
      });

      test('invalid jwt does not reveal private recent rooms', async (testContext: TestContext): Promise<void> => {
        // given
        const fixture: FixtureContext = await manager.setupFixture(testContext);
        const privateRoom: string =
          fixture.canvases[RoomVisibilityDto.private].roomId;

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${privateRoom}`,
          {
            headers: new Headers([['Authorization', 'Bearer invalid-jwt']]),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(body.recentRooms, []);
      });

      test('myProjects are sorted by title', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);

        const collaborator: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const last: string = await manager.createPublishedDocument(
          'api::project.project',
          {
            title: 'Z Project',
            owner: owner.documentId,
            collaborators: [collaborator.documentId],
          },
          testContext,
        );
        const first: string = await manager.createPublishedDocument(
          'api::project.project',
          {
            title: 'A Project',
            owner: owner.documentId,
            collaborators: [collaborator.documentId],
          },
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.myProjects.length, 2);
        assert.equal(body.myProjects[0].id, first);
        assert.equal(body.myProjects[0].title, 'A Project');
        assert.equal(body.myProjects[1].id, last);
        assert.equal(body.myProjects[1].title, 'Z Project');
      });

      test('collaborationProjects are sorted by title', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);

        const collaborator: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const last: string = await manager.createPublishedDocument(
          'api::project.project',
          {
            title: 'Z Project',
            owner: owner.documentId,
            collaborators: [collaborator.documentId],
          },
          testContext,
        );
        const first: string = await manager.createPublishedDocument(
          'api::project.project',
          {
            title: 'A Project',
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
        const response: Response = await fetch(manager.apiUrl, {
          headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.collaborationProjects.length, 2);
        assert.equal(body.collaborationProjects[0].id, first);
        assert.equal(body.collaborationProjects[0].title, 'A Project');
        assert.equal(body.collaborationProjects[1].id, last);
        assert.equal(body.collaborationProjects[1].title, 'Z Project');
      });
    });

    describe('400', (): void => {
      test('rejects invalid start page query parameters', async (testContext: TestContext): Promise<void> => {
        const variants: { query: string; expectedMessage: string }[] = [
          {
            query: '?unexpected=true',
            expectedMessage: 'property unexpected should not exist',
          },
          {
            query: '?recentRoomIds=a&recentRoomIds=b',
            expectedMessage: 'recentRoomIds must be a string',
          },
        ];
        for (const variant of variants) {
          // when
          const response: Response = await fetch(
            `${manager.apiUrl}${variant.query}`,
            { signal: testContext.signal },
          );

          // then
          assert.equal(response.status, 400, variant.query);
          assert.deepEqual(
            await response.json(),
            {
              statusCode: 400,
              error: 'Bad Request',
              message: [variant.expectedMessage],
            },
            variant.query,
          );
        }
      });
    });
  });
});
