import type { E2ETestApplicationRoom } from '../../../../e2e/E2ETestApplicationRoom';
import type { PostAuthResponseBodyDto } from '../auth/dto/PostAuthResponseBodyDto';
import type { StartPageDto } from './dto/StartPageDto';
import type { StartPageProjectDto } from './dto/StartPageProjectDto';
import type { StartPageRoomDto } from './dto/StartPageRoomDto';
import type { UserPreviewDto } from '../../../schema/dtos/UserPreviewDto';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { SuiteContext, TestContext } from 'node:test';
import { after, before, describe, test } from 'node:test';
import z from 'zod';
import { E2ETestManager } from '../../../../e2e/E2ETestManager';
import type { E2ETestApplicationUser } from '../../../../e2e/E2ETestApplicationUser';
import type { E2ETestApplicationProject } from '../../../../e2e/E2ETestApplicationProject';
import { RoomVisibilityDto } from '../../../schema/dtos/RoomVisibilityDto';

const userSchema: z.ZodType<UserPreviewDto> = z.strictObject({
  id: z.string().min(1),
  displayName: z.string().nullable(),
});
const projectSchema: z.ZodType<StartPageProjectDto> = z.strictObject({
  id: z.string().min(1),
  title: z.string(),
  owner: userSchema.nullable(),
  collaborators: z.array(userSchema),
  databases: z.array(z.never()),
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
      test('anonymous has no owned projects', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        await manager.createProject(
          'E2E Project',
          primaryUser,
          [],
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
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const secondaryUser: E2ETestApplicationUser =
          await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
        const project: E2ETestApplicationProject = await manager.createProject(
          'E2E Project',
          primaryUser,
          [secondaryUser],
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          primaryUser.username,
          primaryUser.password,
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          headers: { Authorization: `Bearer ${login.jwt}` },
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(body.myProjects, [
          {
            id: project.documentId,
            title: project.title,
            owner: {
              id: primaryUser.documentId,
              displayName: primaryUser.username,
            },
            collaborators: [
              {
                id: secondaryUser.documentId,
                displayName: secondaryUser.username,
              },
            ],
            databases: [],
            activeUsers: [],
          },
        ]);
      });

      test('collaborator has no owned projects', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const secondaryUser: E2ETestApplicationUser =
          await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
        await manager.createProject(
          'E2E Project',
          primaryUser,
          [secondaryUser],
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          secondaryUser.username,
          secondaryUser.password,
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          headers: { Authorization: `Bearer ${login.jwt}` },
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(body.myProjects, []);
      });

      test('outsider has no owned projects', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const tertiaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        await manager.createProject(
          'E2E Project',
          primaryUser,
          [],
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          tertiaryUser.username,
          tertiaryUser.password,
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          headers: { Authorization: `Bearer ${login.jwt}` },
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(body.myProjects, []);
      });

      test('anonymous has no collaboration projects', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        await manager.createProject(
          'E2E Project',
          primaryUser,
          [],
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
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        await manager.createProject(
          'E2E Project',
          primaryUser,
          [],
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          primaryUser.username,
          primaryUser.password,
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          headers: { Authorization: `Bearer ${login.jwt}` },
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(body.collaborationProjects, []);
      });

      test('collaborator sees collaboration project', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const secondaryUser: E2ETestApplicationUser =
          await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
        const project: E2ETestApplicationProject = await manager.createProject(
          'E2E Project',
          primaryUser,
          [secondaryUser],
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          secondaryUser.username,
          secondaryUser.password,
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          headers: { Authorization: `Bearer ${login.jwt}` },
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(body.collaborationProjects, [
          {
            id: project.documentId,
            title: project.title,
            owner: {
              id: primaryUser.documentId,
              displayName: primaryUser.username,
            },
            collaborators: [
              {
                id: secondaryUser.documentId,
                displayName: secondaryUser.username,
              },
            ],
            databases: [],
            activeUsers: [],
          },
        ]);
      });

      test('outsider has no collaboration projects', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const tertiaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        await manager.createProject(
          'E2E Project',
          primaryUser,
          [],
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          tertiaryUser.username,
          tertiaryUser.password,
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          headers: { Authorization: `Bearer ${login.jwt}` },
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(body.collaborationProjects, []);
      });

      test('public room listing for anonymous', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const project: E2ETestApplicationProject = await manager.createProject(
          'E2E Project',
          primaryUser,
          [],
          testContext,
        );
        await manager.createRoom(
          'Private Room',
          RoomVisibilityDto.private,
          project,
          testContext,
        );
        await manager.createRoom(
          'Unlisted Room',
          RoomVisibilityDto.unlisted,
          project,
          testContext,
        );
        const publicRoom: E2ETestApplicationRoom = await manager.createRoom(
          'Public Room',
          RoomVisibilityDto.public,
          project,
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.publicRooms.length, 1);
        assert.equal(body.publicRooms[0].id, publicRoom.documentId);
        assert.equal(body.publicRooms[0].title, publicRoom.title);
        assert.equal(body.publicRooms[0].visibility, RoomVisibilityDto.public);
        assert.deepEqual(body.publicRooms[0].activeUsers, []);
      });

      test('public room listing for owner', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const project: E2ETestApplicationProject = await manager.createProject(
          'E2E Project',
          primaryUser,
          [],
          testContext,
        );
        await manager.createRoom(
          'Private Room',
          RoomVisibilityDto.private,
          project,
          testContext,
        );
        await manager.createRoom(
          'Unlisted Room',
          RoomVisibilityDto.unlisted,
          project,
          testContext,
        );
        const publicRoom: E2ETestApplicationRoom = await manager.createRoom(
          'Public Room',
          RoomVisibilityDto.public,
          project,
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          primaryUser.username,
          primaryUser.password,
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          headers: { Authorization: `Bearer ${login.jwt}` },
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.publicRooms.length, 1);
        assert.equal(body.publicRooms[0].id, publicRoom.documentId);
        assert.equal(body.publicRooms[0].title, publicRoom.title);
        assert.equal(body.publicRooms[0].visibility, RoomVisibilityDto.public);
        assert.deepEqual(body.publicRooms[0].activeUsers, []);
      });

      test('public room listing for collaborator', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const secondaryUser: E2ETestApplicationUser =
          await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
        const project: E2ETestApplicationProject = await manager.createProject(
          'E2E Project',
          primaryUser,
          [secondaryUser],
          testContext,
        );
        await manager.createRoom(
          'Private Room',
          RoomVisibilityDto.private,
          project,
          testContext,
        );
        await manager.createRoom(
          'Unlisted Room',
          RoomVisibilityDto.unlisted,
          project,
          testContext,
        );
        const publicRoom: E2ETestApplicationRoom = await manager.createRoom(
          'Public Room',
          RoomVisibilityDto.public,
          project,
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          secondaryUser.username,
          secondaryUser.password,
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          headers: { Authorization: `Bearer ${login.jwt}` },
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.publicRooms.length, 1);
        assert.equal(body.publicRooms[0].id, publicRoom.documentId);
        assert.equal(body.publicRooms[0].title, publicRoom.title);
        assert.equal(body.publicRooms[0].visibility, RoomVisibilityDto.public);
        assert.deepEqual(body.publicRooms[0].activeUsers, []);
      });

      test('public room listing for outsider', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const tertiaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const project: E2ETestApplicationProject = await manager.createProject(
          'E2E Project',
          primaryUser,
          [],
          testContext,
        );
        await manager.createRoom(
          'Private Room',
          RoomVisibilityDto.private,
          project,
          testContext,
        );
        await manager.createRoom(
          'Unlisted Room',
          RoomVisibilityDto.unlisted,
          project,
          testContext,
        );
        const publicRoom: E2ETestApplicationRoom = await manager.createRoom(
          'Public Room',
          RoomVisibilityDto.public,
          project,
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          tertiaryUser.username,
          tertiaryUser.password,
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          headers: { Authorization: `Bearer ${login.jwt}` },
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.publicRooms.length, 1);
        assert.equal(body.publicRooms[0].id, publicRoom.documentId);
        assert.equal(body.publicRooms[0].title, publicRoom.title);
        assert.equal(body.publicRooms[0].visibility, RoomVisibilityDto.public);
        assert.deepEqual(body.publicRooms[0].activeUsers, []);
      });

      test('anonymous cannot see recent private room', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const project: E2ETestApplicationProject = await manager.createProject(
          'E2E Project',
          primaryUser,
          [],
          testContext,
        );
        const privateRoom: E2ETestApplicationRoom = await manager.createRoom(
          'Private Room',
          RoomVisibilityDto.private,
          project,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${privateRoom.documentId}`,
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
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const project: E2ETestApplicationProject = await manager.createProject(
          'E2E Project',
          primaryUser,
          [],
          testContext,
        );
        const privateRoom: E2ETestApplicationRoom = await manager.createRoom(
          'Private Room',
          RoomVisibilityDto.private,
          project,
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          primaryUser.username,
          primaryUser.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${privateRoom.documentId}`,
          {
            headers: { Authorization: `Bearer ${login.jwt}` },
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.recentRooms.length, 1);
        assert.equal(body.recentRooms[0].id, privateRoom.documentId);
        assert.equal(body.recentRooms[0].title, privateRoom.title);
        assert.equal(body.recentRooms[0].visibility, RoomVisibilityDto.private);
        assert.deepEqual(body.recentRooms[0].activeUsers, []);
      });

      test('collaborator sees recent private room', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const secondaryUser: E2ETestApplicationUser =
          await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
        const project: E2ETestApplicationProject = await manager.createProject(
          'E2E Project',
          primaryUser,
          [secondaryUser],
          testContext,
        );
        const privateRoom: E2ETestApplicationRoom = await manager.createRoom(
          'Private Room',
          RoomVisibilityDto.private,
          project,
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          secondaryUser.username,
          secondaryUser.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${privateRoom.documentId}`,
          {
            headers: { Authorization: `Bearer ${login.jwt}` },
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.recentRooms.length, 1);
        assert.equal(body.recentRooms[0].id, privateRoom.documentId);
        assert.equal(body.recentRooms[0].title, privateRoom.title);
        assert.equal(body.recentRooms[0].visibility, RoomVisibilityDto.private);
        assert.deepEqual(body.recentRooms[0].activeUsers, []);
      });

      test('outsider cannot see recent private room', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const tertiaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const project: E2ETestApplicationProject = await manager.createProject(
          'E2E Project',
          primaryUser,
          [],
          testContext,
        );
        const privateRoom: E2ETestApplicationRoom = await manager.createRoom(
          'Private Room',
          RoomVisibilityDto.private,
          project,
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          tertiaryUser.username,
          tertiaryUser.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${privateRoom.documentId}`,
          {
            headers: { Authorization: `Bearer ${login.jwt}` },
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
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const project: E2ETestApplicationProject = await manager.createProject(
          'E2E Project',
          primaryUser,
          [],
          testContext,
        );
        const unlistedRoom: E2ETestApplicationRoom = await manager.createRoom(
          'Unlisted Room',
          RoomVisibilityDto.unlisted,
          project,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${unlistedRoom.documentId}`,
          {
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.recentRooms.length, 1);
        assert.equal(body.recentRooms[0].id, unlistedRoom.documentId);
        assert.equal(body.recentRooms[0].title, unlistedRoom.title);
        assert.equal(
          body.recentRooms[0].visibility,
          RoomVisibilityDto.unlisted,
        );
        assert.deepEqual(body.recentRooms[0].activeUsers, []);
      });

      test('owner sees recent unlisted room', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const project: E2ETestApplicationProject = await manager.createProject(
          'E2E Project',
          primaryUser,
          [],
          testContext,
        );
        const unlistedRoom: E2ETestApplicationRoom = await manager.createRoom(
          'Unlisted Room',
          RoomVisibilityDto.unlisted,
          project,
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          primaryUser.username,
          primaryUser.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${unlistedRoom.documentId}`,
          {
            headers: { Authorization: `Bearer ${login.jwt}` },
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.recentRooms.length, 1);
        assert.equal(body.recentRooms[0].id, unlistedRoom.documentId);
        assert.equal(body.recentRooms[0].title, unlistedRoom.title);
        assert.equal(
          body.recentRooms[0].visibility,
          RoomVisibilityDto.unlisted,
        );
        assert.deepEqual(body.recentRooms[0].activeUsers, []);
      });

      test('collaborator sees recent unlisted room', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const secondaryUser: E2ETestApplicationUser =
          await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
        const project: E2ETestApplicationProject = await manager.createProject(
          'E2E Project',
          primaryUser,
          [secondaryUser],
          testContext,
        );
        const unlistedRoom: E2ETestApplicationRoom = await manager.createRoom(
          'Unlisted Room',
          RoomVisibilityDto.unlisted,
          project,
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          secondaryUser.username,
          secondaryUser.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${unlistedRoom.documentId}`,
          {
            headers: { Authorization: `Bearer ${login.jwt}` },
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.recentRooms.length, 1);
        assert.equal(body.recentRooms[0].id, unlistedRoom.documentId);
        assert.equal(body.recentRooms[0].title, unlistedRoom.title);
        assert.equal(
          body.recentRooms[0].visibility,
          RoomVisibilityDto.unlisted,
        );
        assert.deepEqual(body.recentRooms[0].activeUsers, []);
      });

      test('outsider sees recent unlisted room', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const tertiaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const project: E2ETestApplicationProject = await manager.createProject(
          'E2E Project',
          primaryUser,
          [],
          testContext,
        );
        const unlistedRoom: E2ETestApplicationRoom = await manager.createRoom(
          'Unlisted Room',
          RoomVisibilityDto.unlisted,
          project,
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          tertiaryUser.username,
          tertiaryUser.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${unlistedRoom.documentId}`,
          {
            headers: { Authorization: `Bearer ${login.jwt}` },
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.recentRooms.length, 1);
        assert.equal(body.recentRooms[0].id, unlistedRoom.documentId);
        assert.equal(body.recentRooms[0].title, unlistedRoom.title);
        assert.equal(
          body.recentRooms[0].visibility,
          RoomVisibilityDto.unlisted,
        );
        assert.deepEqual(body.recentRooms[0].activeUsers, []);
      });

      test('anonymous sees recent public room', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const project: E2ETestApplicationProject = await manager.createProject(
          'E2E Project',
          primaryUser,
          [],
          testContext,
        );
        const publicRoom: E2ETestApplicationRoom = await manager.createRoom(
          'Public Room',
          RoomVisibilityDto.public,
          project,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${publicRoom.documentId}`,
          {
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.recentRooms.length, 1);
        assert.equal(body.recentRooms[0].id, publicRoom.documentId);
        assert.equal(body.recentRooms[0].title, publicRoom.title);
        assert.equal(body.recentRooms[0].visibility, RoomVisibilityDto.public);
        assert.deepEqual(body.recentRooms[0].activeUsers, []);
      });

      test('owner sees recent public room', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const project: E2ETestApplicationProject = await manager.createProject(
          'E2E Project',
          primaryUser,
          [],
          testContext,
        );
        const publicRoom: E2ETestApplicationRoom = await manager.createRoom(
          'Public Room',
          RoomVisibilityDto.public,
          project,
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          primaryUser.username,
          primaryUser.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${publicRoom.documentId}`,
          {
            headers: { Authorization: `Bearer ${login.jwt}` },
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.recentRooms.length, 1);
        assert.equal(body.recentRooms[0].id, publicRoom.documentId);
        assert.equal(body.recentRooms[0].title, publicRoom.title);
        assert.equal(body.recentRooms[0].visibility, RoomVisibilityDto.public);
        assert.deepEqual(body.recentRooms[0].activeUsers, []);
      });

      test('collaborator sees recent public room', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const secondaryUser: E2ETestApplicationUser =
          await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
        const project: E2ETestApplicationProject = await manager.createProject(
          'E2E Project',
          primaryUser,
          [secondaryUser],
          testContext,
        );
        const publicRoom: E2ETestApplicationRoom = await manager.createRoom(
          'Public Room',
          RoomVisibilityDto.public,
          project,
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          secondaryUser.username,
          secondaryUser.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${publicRoom.documentId}`,
          {
            headers: { Authorization: `Bearer ${login.jwt}` },
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.recentRooms.length, 1);
        assert.equal(body.recentRooms[0].id, publicRoom.documentId);
        assert.equal(body.recentRooms[0].title, publicRoom.title);
        assert.equal(body.recentRooms[0].visibility, RoomVisibilityDto.public);
        assert.deepEqual(body.recentRooms[0].activeUsers, []);
      });

      test('outsider sees recent public room', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const tertiaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const project: E2ETestApplicationProject = await manager.createProject(
          'E2E Project',
          primaryUser,
          [],
          testContext,
        );
        const publicRoom: E2ETestApplicationRoom = await manager.createRoom(
          'Public Room',
          RoomVisibilityDto.public,
          project,
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          tertiaryUser.username,
          tertiaryUser.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${publicRoom.documentId}`,
          {
            headers: { Authorization: `Bearer ${login.jwt}` },
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.recentRooms.length, 1);
        assert.equal(body.recentRooms[0].id, publicRoom.documentId);
        assert.equal(body.recentRooms[0].title, publicRoom.title);
        assert.equal(body.recentRooms[0].visibility, RoomVisibilityDto.public);
        assert.deepEqual(body.recentRooms[0].activeUsers, []);
      });

      test('recent room order is preserved', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const project: E2ETestApplicationProject = await manager.createProject(
          'E2E Project',
          primaryUser,
          [],
          testContext,
        );
        const privateRoom: E2ETestApplicationRoom = await manager.createRoom(
          'Private Room',
          RoomVisibilityDto.private,
          project,
          testContext,
        );
        const unlistedRoom: E2ETestApplicationRoom = await manager.createRoom(
          'Unlisted Room',
          RoomVisibilityDto.unlisted,
          project,
          testContext,
        );
        const publicRoom: E2ETestApplicationRoom = await manager.createRoom(
          'Public Room',
          RoomVisibilityDto.public,
          project,
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
            unlistedRoom.documentId,
            privateRoom.documentId,
            publicRoom.documentId,
          ].join(',')}`,
          {
            headers: { Authorization: `Bearer ${login.jwt}` },
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(
          body.recentRooms.map((room: StartPageRoomDto): string => room.id),
          [
            unlistedRoom.documentId,
            privateRoom.documentId,
            publicRoom.documentId,
          ],
        );
      });

      test('unknown recent room is skipped', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const project: E2ETestApplicationProject = await manager.createProject(
          'E2E Project',
          primaryUser,
          [],
          testContext,
        );
        const publicRoom: E2ETestApplicationRoom = await manager.createRoom(
          'Public Room',
          RoomVisibilityDto.public,
          project,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${[
            randomUUID(),
            publicRoom.documentId,
          ].join(',')}`,
          {
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(
          body.recentRooms.map((room: StartPageRoomDto): string => room.id),
          [publicRoom.documentId],
        );
      });

      test('omitted recent room list returns no recent rooms', async (testContext: TestContext): Promise<void> => {
        // when
        const response: Response = await fetch(manager.apiUrl, {
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(body.recentRooms, []);
      });

      test('empty recent room list returns no recent rooms', async (testContext: TestContext): Promise<void> => {
        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=`,
          {
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.deepEqual(body.recentRooms, []);
      });

      test('invalid jwt does not reveal owned projects', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const project: E2ETestApplicationProject = await manager.createProject(
          'E2E Project',
          primaryUser,
          [],
          testContext,
        );
        const privateRoom: E2ETestApplicationRoom = await manager.createRoom(
          'Private Room',
          RoomVisibilityDto.private,
          project,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${privateRoom.documentId}`,
          {
            headers: { Authorization: 'Bearer invalid-jwt' },
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
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const secondaryUser: E2ETestApplicationUser =
          await manager.registerUser(
            `e2e-${randomUUID()}`,
            randomUUID(),
            testContext,
          );
        const project: E2ETestApplicationProject = await manager.createProject(
          'E2E Project',
          primaryUser,
          [secondaryUser],
          testContext,
        );
        const privateRoom: E2ETestApplicationRoom = await manager.createRoom(
          'Private Room',
          RoomVisibilityDto.private,
          project,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${privateRoom.documentId}`,
          {
            headers: { Authorization: 'Bearer invalid-jwt' },
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
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const project: E2ETestApplicationProject = await manager.createProject(
          'E2E Project',
          primaryUser,
          [],
          testContext,
        );
        const privateRoom: E2ETestApplicationRoom = await manager.createRoom(
          'Private Room',
          RoomVisibilityDto.private,
          project,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=${privateRoom.documentId}`,
          {
            headers: { Authorization: 'Bearer invalid-jwt' },
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
        const owner: E2ETestApplicationUser = await manager.registerUser(
          `owner-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const collaborator: E2ETestApplicationUser = await manager.registerUser(
          `collaborator-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const last: E2ETestApplicationProject = await manager.createProject(
          'Z Project',
          owner,
          [collaborator],
          testContext,
        );
        const first: E2ETestApplicationProject = await manager.createProject(
          'A Project',
          owner,
          [collaborator],
          testContext,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );

        // when
        const response: Response = await fetch(manager.apiUrl, {
          headers: { Authorization: `Bearer ${login.jwt}` },
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.myProjects.length, 2);
        assert.equal(body.myProjects[0].id, first.documentId);
        assert.equal(body.myProjects[0].title, first.title);
        assert.equal(body.myProjects[1].id, last.documentId);
        assert.equal(body.myProjects[1].title, last.title);
      });

      test('collaborationProjects are sorted by title', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser = await manager.registerUser(
          `owner-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const collaborator: E2ETestApplicationUser = await manager.registerUser(
          `collaborator-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const last: E2ETestApplicationProject = await manager.createProject(
          'Z Project',
          owner,
          [collaborator],
          testContext,
        );
        const first: E2ETestApplicationProject = await manager.createProject(
          'A Project',
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
        const response: Response = await fetch(manager.apiUrl, {
          headers: { Authorization: `Bearer ${login.jwt}` },
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        const body: StartPageDto = startSchema.parse(await response.json());
        assert.equal(body.collaborationProjects.length, 2);
        assert.equal(body.collaborationProjects[0].id, first.documentId);
        assert.equal(body.collaborationProjects[0].title, first.title);
        assert.equal(body.collaborationProjects[1].id, last.documentId);
        assert.equal(body.collaborationProjects[1].title, last.title);
      });
    });

    describe('400', (): void => {
      test('unknown query parameter', async (testContext: TestContext): Promise<void> => {
        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?unexpected=true`,
          { signal: testContext.signal },
        );

        // then
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), {
          statusCode: 400,
          error: 'Bad Request',
          message: ['property unexpected should not exist'],
        });
      });

      test('non-string recent room ids', async (testContext: TestContext): Promise<void> => {
        // when
        const response: Response = await fetch(
          `${manager.apiUrl}?recentRoomIds=a&recentRoomIds=b`,
          { signal: testContext.signal },
        );

        // then
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), {
          statusCode: 400,
          error: 'Bad Request',
          message: ['recentRoomIds must be a string'],
        });
      });
    });
  });
});
