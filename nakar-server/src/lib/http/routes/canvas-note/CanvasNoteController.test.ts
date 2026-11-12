import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { SuiteContext, TestContext } from 'node:test';
import { after, before, describe, test } from 'node:test';
import z from 'zod';
import { E2ETestManager } from '../../../../e2e/E2ETestManager';
import type { E2ETestCanvas } from '../../../../e2e/E2ETestManager';
import type { E2ETestApplicationUser } from '../../../../e2e/E2ETestApplicationUser';
import type { PostAuthResponseBodyDto } from '../auth/dto/PostAuthResponseBodyDto';
import { RoomVisibilityDto } from '../../../schema/dtos/RoomVisibilityDto';
import type { PostNoteRequestBody } from './dto/PostNoteRequestBody';
import type { PostNoteResponseBodyDto } from './dto/PostNoteResponseBodyDto';
import type { UpdateNoteRequestBodyDto } from './dto/UpdateNoteRequestBodyDto';

const validationErrorSchema: z.ZodType<{
  statusCode: number;
  error: string;
  message: string[];
}> = z.strictObject({
  statusCode: z.number(),
  error: z.string(),
  message: z.array(z.string()),
});
const createdSchema: z.ZodType<PostNoteResponseBodyDto> = z.strictObject({
  id: z.string().min(1),
});
const noteStateSchema: z.ZodType<{
  data: { documentId: string; content: string };
}> = z.object({
  data: z.object({ documentId: z.string(), content: z.string() }),
});
const noteListSchema: z.ZodType<{
  results: { documentId: string; content: string }[];
}> = z.object({
  results: z.array(z.object({ documentId: z.string(), content: z.string() })),
});
const referenceListSchema: z.ZodType<{ results: { nodeId: string }[] }> =
  z.object({ results: z.array(z.object({ nodeId: z.string() })) });

describe('/room/:roomId/canvas/:canvasId/note', (suiteContext: SuiteContext): void => {
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
      test('owner can create a note with node references', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const canvas: E2ETestCanvas = await manager.createCanvas(
          owner,
          testContext,
          RoomVisibilityDto.private,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const loginAuthor: string = owner.documentId;
        const nodeIds: string[] = [randomUUID(), randomUUID()];

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note`,
          {
            method: 'POST',
            headers: new Headers([
              ['Content-Type', 'application/json'],
              ['Authorization', `Bearer ${login.jwt}`],
            ]),
            body: JSON.stringify({
              content: 'A note',
              nodeIds,
            } satisfies PostNoteRequestBody),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 201);
        const result: PostNoteResponseBodyDto = createdSchema.parse(
          await response.json(),
        );
        const stored: Response = await manager.readDocuments(
          'api::note.note',
          {
            [`filters[project][documentId][$eq]`]: canvas.projectId,
            [`filters[documentId][$eq]`]: result.id,
            [`filters[author][documentId][$eq]`]: loginAuthor,
            status: 'published',
          },
          testContext,
        );
        assert.equal(stored.status, 200);
        assert.deepEqual(noteListSchema.parse(await stored.json()).results, [
          { documentId: result.id, content: 'A note' },
        ]);
        const references: Response = await manager.readDocuments(
          'api::node-reference.node-reference',
          {
            [`filters[note][documentId][$eq]`]: result.id,
            status: 'published',
          },
          testContext,
        );
        assert.equal(references.status, 200);
        assert.deepEqual(
          referenceListSchema
            .parse(await references.json())
            .results.map((item: { nodeId: string }): string => item.nodeId)
            .sort(),
          nodeIds.toSorted(),
        );
      });
      test('collaborator can create a note', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const collaborator: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const canvas: E2ETestCanvas = await manager.createCanvas(
          owner,
          testContext,
          RoomVisibilityDto.private,
          [collaborator.documentId],
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          collaborator.username,
          collaborator.password,
          testContext,
        );
        const loginAuthor: string = collaborator.documentId;
        const nodeIds: string[] = [randomUUID(), randomUUID()];

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note`,
          {
            method: 'POST',
            headers: new Headers([
              ['Content-Type', 'application/json'],
              ['Authorization', `Bearer ${login.jwt}`],
            ]),
            body: JSON.stringify({
              content: 'A note',
              nodeIds,
            } satisfies PostNoteRequestBody),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 201);
        const result: PostNoteResponseBodyDto = createdSchema.parse(
          await response.json(),
        );
        const stored: Response = await manager.readDocuments(
          'api::note.note',
          {
            [`filters[project][documentId][$eq]`]: canvas.projectId,
            [`filters[documentId][$eq]`]: result.id,
            [`filters[author][documentId][$eq]`]: loginAuthor,
            status: 'published',
          },
          testContext,
        );
        assert.equal(stored.status, 200);
        assert.deepEqual(noteListSchema.parse(await stored.json()).results, [
          { documentId: result.id, content: 'A note' },
        ]);
        const references: Response = await manager.readDocuments(
          'api::node-reference.node-reference',
          {
            [`filters[note][documentId][$eq]`]: result.id,
            status: 'published',
          },
          testContext,
        );
        assert.equal(references.status, 200);
        assert.deepEqual(
          referenceListSchema
            .parse(await references.json())
            .results.map((item: { nodeId: string }): string => item.nodeId)
            .sort(),
          nodeIds.toSorted(),
        );
      });
      test('authenticated visitor can create a note in a public room', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const outsider: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const canvas: E2ETestCanvas = await manager.createCanvas(
          owner,
          testContext,
          RoomVisibilityDto.public,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          outsider.username,
          outsider.password,
          testContext,
        );
        const loginAuthor: string = outsider.documentId;
        const nodeIds: string[] = [randomUUID(), randomUUID()];

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note`,
          {
            method: 'POST',
            headers: new Headers([
              ['Content-Type', 'application/json'],
              ['Authorization', `Bearer ${login.jwt}`],
            ]),
            body: JSON.stringify({
              content: 'A note',
              nodeIds,
            } satisfies PostNoteRequestBody),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 201);
        const result: PostNoteResponseBodyDto = createdSchema.parse(
          await response.json(),
        );
        const stored: Response = await manager.readDocuments(
          'api::note.note',
          {
            [`filters[project][documentId][$eq]`]: canvas.projectId,
            [`filters[documentId][$eq]`]: result.id,
            [`filters[author][documentId][$eq]`]: loginAuthor,
            status: 'published',
          },
          testContext,
        );
        assert.equal(stored.status, 200);
        assert.deepEqual(noteListSchema.parse(await stored.json()).results, [
          { documentId: result.id, content: 'A note' },
        ]);
        const references: Response = await manager.readDocuments(
          'api::node-reference.node-reference',
          {
            [`filters[note][documentId][$eq]`]: result.id,
            status: 'published',
          },
          testContext,
        );
        assert.equal(references.status, 200);
        assert.deepEqual(
          referenceListSchema
            .parse(await references.json())
            .results.map((item: { nodeId: string }): string => item.nodeId)
            .sort(),
          nodeIds.toSorted(),
        );
      });
      test('authenticated visitor can create a note in an unlisted room', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const outsider: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const canvas: E2ETestCanvas = await manager.createCanvas(
          owner,
          testContext,
          RoomVisibilityDto.unlisted,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          outsider.username,
          outsider.password,
          testContext,
        );
        const loginAuthor: string = outsider.documentId;
        const nodeIds: string[] = [randomUUID(), randomUUID()];

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note`,
          {
            method: 'POST',
            headers: new Headers([
              ['Content-Type', 'application/json'],
              ['Authorization', `Bearer ${login.jwt}`],
            ]),
            body: JSON.stringify({
              content: 'A note',
              nodeIds,
            } satisfies PostNoteRequestBody),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 201);
        const result: PostNoteResponseBodyDto = createdSchema.parse(
          await response.json(),
        );
        const stored: Response = await manager.readDocuments(
          'api::note.note',
          {
            [`filters[project][documentId][$eq]`]: canvas.projectId,
            [`filters[documentId][$eq]`]: result.id,
            [`filters[author][documentId][$eq]`]: loginAuthor,
            status: 'published',
          },
          testContext,
        );
        assert.equal(stored.status, 200);
        assert.deepEqual(noteListSchema.parse(await stored.json()).results, [
          { documentId: result.id, content: 'A note' },
        ]);
        const references: Response = await manager.readDocuments(
          'api::node-reference.node-reference',
          {
            [`filters[note][documentId][$eq]`]: result.id,
            status: 'published',
          },
          testContext,
        );
        assert.equal(references.status, 200);
        assert.deepEqual(
          referenceListSchema
            .parse(await references.json())
            .results.map((item: { nodeId: string }): string => item.nodeId)
            .sort(),
          nodeIds.toSorted(),
        );
      });
      test('accepts an empty note without node references', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const canvas: E2ETestCanvas = await manager.createCanvas(
          owner,
          testContext,
          RoomVisibilityDto.private,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note`,
          {
            method: 'POST',
            headers: new Headers([
              ['Content-Type', 'application/json'],
              ['Authorization', `Bearer ${login.jwt}`],
            ]),
            body: JSON.stringify({
              content: '',
              nodeIds: [],
            } satisfies PostNoteRequestBody),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 201);
        const result: PostNoteResponseBodyDto = createdSchema.parse(
          await response.json(),
        );
        const stored: Response = await manager.readDocument(
          'api::note.note',
          result.id,
          testContext,
        );
        assert.equal(stored.status, 200);
        assert.deepEqual(noteStateSchema.parse(await stored.json()).data, {
          documentId: result.id,
          content: '',
        });
      });
    });
    describe('400', (): void => {
      test('rejects missing content', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const canvas: E2ETestCanvas = await manager.createCanvas(
          owner,
          testContext,
          RoomVisibilityDto.private,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const existing: Response = await manager.readDocuments(
          'api::note.note',
          { [`filters[project][documentId][$eq]`]: canvas.projectId },
          testContext,
        );
        assert.equal(existing.status, 200);
        const original: unknown = await existing.json();

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note`,
          {
            method: 'POST',
            headers: new Headers([
              ['Content-Type', 'application/json'],
              ['Authorization', `Bearer ${login.jwt}`],
            ]),
            body: JSON.stringify({ nodeIds: [] } satisfies Omit<
              PostNoteRequestBody,
              'content'
            >),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 400);
        const body: { statusCode: number; error: string; message: string[] } =
          validationErrorSchema.parse(await response.json());
        assert.equal(body.statusCode, 400);
        assert.equal(body.error, 'Bad Request');
        assert.deepEqual(
          body.message.toSorted(),
          ['content must be a string'].toSorted(),
        );
        const stored: Response = await manager.readDocuments(
          'api::note.note',
          { [`filters[project][documentId][$eq]`]: canvas.projectId },
          testContext,
        );
        assert.equal(stored.status, 200);
        assert.deepEqual(await stored.json(), original);
      });
      test('rejects null content', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const canvas: E2ETestCanvas = await manager.createCanvas(
          owner,
          testContext,
          RoomVisibilityDto.private,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const existing: Response = await manager.readDocuments(
          'api::note.note',
          { [`filters[project][documentId][$eq]`]: canvas.projectId },
          testContext,
        );
        assert.equal(existing.status, 200);
        const original: unknown = await existing.json();

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note`,
          {
            method: 'POST',
            headers: new Headers([
              ['Content-Type', 'application/json'],
              ['Authorization', `Bearer ${login.jwt}`],
            ]),
            body: JSON.stringify({ content: null, nodeIds: [] } satisfies Omit<
              PostNoteRequestBody,
              'content'
            > & { content: null }),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 400);
        const body: { statusCode: number; error: string; message: string[] } =
          validationErrorSchema.parse(await response.json());
        assert.equal(body.statusCode, 400);
        assert.equal(body.error, 'Bad Request');
        assert.deepEqual(
          body.message.toSorted(),
          ['content must be a string'].toSorted(),
        );
        const stored: Response = await manager.readDocuments(
          'api::note.note',
          { [`filters[project][documentId][$eq]`]: canvas.projectId },
          testContext,
        );
        assert.equal(stored.status, 200);
        assert.deepEqual(await stored.json(), original);
      });
      test('rejects non-string content', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const canvas: E2ETestCanvas = await manager.createCanvas(
          owner,
          testContext,
          RoomVisibilityDto.private,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const existing: Response = await manager.readDocuments(
          'api::note.note',
          { [`filters[project][documentId][$eq]`]: canvas.projectId },
          testContext,
        );
        assert.equal(existing.status, 200);
        const original: unknown = await existing.json();

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note`,
          {
            method: 'POST',
            headers: new Headers([
              ['Content-Type', 'application/json'],
              ['Authorization', `Bearer ${login.jwt}`],
            ]),
            body: JSON.stringify({ content: 42, nodeIds: [] } satisfies Omit<
              PostNoteRequestBody,
              'content'
            > & { content: number }),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 400);
        const body: { statusCode: number; error: string; message: string[] } =
          validationErrorSchema.parse(await response.json());
        assert.equal(body.statusCode, 400);
        assert.equal(body.error, 'Bad Request');
        assert.deepEqual(
          body.message.toSorted(),
          ['content must be a string'].toSorted(),
        );
        const stored: Response = await manager.readDocuments(
          'api::note.note',
          { [`filters[project][documentId][$eq]`]: canvas.projectId },
          testContext,
        );
        assert.equal(stored.status, 200);
        assert.deepEqual(await stored.json(), original);
      });
      test('rejects missing node identifiers', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const canvas: E2ETestCanvas = await manager.createCanvas(
          owner,
          testContext,
          RoomVisibilityDto.private,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const existing: Response = await manager.readDocuments(
          'api::note.note',
          { [`filters[project][documentId][$eq]`]: canvas.projectId },
          testContext,
        );
        assert.equal(existing.status, 200);
        const original: unknown = await existing.json();

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note`,
          {
            method: 'POST',
            headers: new Headers([
              ['Content-Type', 'application/json'],
              ['Authorization', `Bearer ${login.jwt}`],
            ]),
            body: JSON.stringify({ content: 'A note' } satisfies Omit<
              PostNoteRequestBody,
              'nodeIds'
            >),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 400);
        const body: { statusCode: number; error: string; message: string[] } =
          validationErrorSchema.parse(await response.json());
        assert.equal(body.statusCode, 400);
        assert.equal(body.error, 'Bad Request');
        assert.deepEqual(body.message.toSorted(), ['nodeIds must be an array']);
        const stored: Response = await manager.readDocuments(
          'api::note.note',
          { [`filters[project][documentId][$eq]`]: canvas.projectId },
          testContext,
        );
        assert.equal(stored.status, 200);
        assert.deepEqual(await stored.json(), original);
      });
      test('rejects null node identifiers', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const canvas: E2ETestCanvas = await manager.createCanvas(
          owner,
          testContext,
          RoomVisibilityDto.private,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const existing: Response = await manager.readDocuments(
          'api::note.note',
          { [`filters[project][documentId][$eq]`]: canvas.projectId },
          testContext,
        );
        assert.equal(existing.status, 200);
        const original: unknown = await existing.json();

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note`,
          {
            method: 'POST',
            headers: new Headers([
              ['Content-Type', 'application/json'],
              ['Authorization', `Bearer ${login.jwt}`],
            ]),
            body: JSON.stringify({
              content: 'A note',
              nodeIds: null,
            } satisfies Omit<PostNoteRequestBody, 'nodeIds'> & {
              nodeIds: null;
            }),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 400);
        const body: { statusCode: number; error: string; message: string[] } =
          validationErrorSchema.parse(await response.json());
        assert.equal(body.statusCode, 400);
        assert.equal(body.error, 'Bad Request');
        assert.deepEqual(body.message.toSorted(), ['nodeIds must be an array']);
        const stored: Response = await manager.readDocuments(
          'api::note.note',
          { [`filters[project][documentId][$eq]`]: canvas.projectId },
          testContext,
        );
        assert.equal(stored.status, 200);
        assert.deepEqual(await stored.json(), original);
      });
      test('rejects non-array node identifiers', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const canvas: E2ETestCanvas = await manager.createCanvas(
          owner,
          testContext,
          RoomVisibilityDto.private,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const existing: Response = await manager.readDocuments(
          'api::note.note',
          { [`filters[project][documentId][$eq]`]: canvas.projectId },
          testContext,
        );
        assert.equal(existing.status, 200);
        const original: unknown = await existing.json();

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note`,
          {
            method: 'POST',
            headers: new Headers([
              ['Content-Type', 'application/json'],
              ['Authorization', `Bearer ${login.jwt}`],
            ]),
            body: JSON.stringify({
              content: 'A note',
              nodeIds: 'node',
            } satisfies Omit<PostNoteRequestBody, 'nodeIds'> & {
              nodeIds: string;
            }),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 400);
        const body: { statusCode: number; error: string; message: string[] } =
          validationErrorSchema.parse(await response.json());
        assert.equal(body.statusCode, 400);
        assert.equal(body.error, 'Bad Request');
        assert.deepEqual(
          body.message.toSorted(),
          ['nodeIds must be an array'].toSorted(),
        );
        const stored: Response = await manager.readDocuments(
          'api::note.note',
          { [`filters[project][documentId][$eq]`]: canvas.projectId },
          testContext,
        );
        assert.equal(stored.status, 200);
        assert.deepEqual(await stored.json(), original);
      });
      test('rejects non-string node identifiers', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const canvas: E2ETestCanvas = await manager.createCanvas(
          owner,
          testContext,
          RoomVisibilityDto.private,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const existing: Response = await manager.readDocuments(
          'api::note.note',
          { [`filters[project][documentId][$eq]`]: canvas.projectId },
          testContext,
        );
        assert.equal(existing.status, 200);
        const original: unknown = await existing.json();

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note`,
          {
            method: 'POST',
            headers: new Headers([
              ['Content-Type', 'application/json'],
              ['Authorization', `Bearer ${login.jwt}`],
            ]),
            body: JSON.stringify({
              content: 'A note',
              nodeIds: [42],
            } satisfies Omit<PostNoteRequestBody, 'nodeIds'> & {
              nodeIds: number[];
            }),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 400);
        const body: { statusCode: number; error: string; message: string[] } =
          validationErrorSchema.parse(await response.json());
        assert.equal(body.statusCode, 400);
        assert.equal(body.error, 'Bad Request');
        assert.deepEqual(
          body.message.toSorted(),
          ['each value in nodeIds must be a string'].toSorted(),
        );
        const stored: Response = await manager.readDocuments(
          'api::note.note',
          { [`filters[project][documentId][$eq]`]: canvas.projectId },
          testContext,
        );
        assert.equal(stored.status, 200);
        assert.deepEqual(await stored.json(), original);
      });
      test('rejects unexpected properties', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const canvas: E2ETestCanvas = await manager.createCanvas(
          owner,
          testContext,
          RoomVisibilityDto.private,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const existing: Response = await manager.readDocuments(
          'api::note.note',
          { [`filters[project][documentId][$eq]`]: canvas.projectId },
          testContext,
        );
        assert.equal(existing.status, 200);
        const original: unknown = await existing.json();

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note`,
          {
            method: 'POST',
            headers: new Headers([
              ['Content-Type', 'application/json'],
              ['Authorization', `Bearer ${login.jwt}`],
            ]),
            body: JSON.stringify({
              content: 'A note',
              nodeIds: [],
              unexpected: true,
            } satisfies PostNoteRequestBody & { unexpected: boolean }),
            signal: testContext.signal,
          },
        );

        // then
        assert.equal(response.status, 400);
        const body: { statusCode: number; error: string; message: string[] } =
          validationErrorSchema.parse(await response.json());
        assert.equal(body.statusCode, 400);
        assert.equal(body.error, 'Bad Request');
        assert.deepEqual(
          body.message.toSorted(),
          ['property unexpected should not exist'].toSorted(),
        );
        const stored: Response = await manager.readDocuments(
          'api::note.note',
          { [`filters[project][documentId][$eq]`]: canvas.projectId },
          testContext,
        );
        assert.equal(stored.status, 200);
        assert.deepEqual(await stored.json(), original);
      });
    });
    describe('401', (): void => {
      test('rejects anonymous access to a private room', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const canvas: E2ETestCanvas = await manager.createCanvas(
          owner,
          testContext,
          RoomVisibilityDto.private,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note`,
          {
            method: 'POST',
            headers: new Headers([['Content-Type', 'application/json']]),
            body: JSON.stringify({
              content: 'A note',
              nodeIds: [],
            } satisfies PostNoteRequestBody),
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
      });
      test('requires authentication in a public room', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const canvas: E2ETestCanvas = await manager.createCanvas(
          owner,
          testContext,
          RoomVisibilityDto.public,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note`,
          {
            method: 'POST',
            headers: new Headers([['Content-Type', 'application/json']]),
            body: JSON.stringify({
              content: 'A note',
              nodeIds: [],
            } satisfies PostNoteRequestBody),
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
      });
      test('rejects an invalid jwt in an unlisted room', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const canvas: E2ETestCanvas = await manager.createCanvas(
          owner,
          testContext,
          RoomVisibilityDto.unlisted,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note`,
          {
            method: 'POST',
            headers: new Headers([
              ['Content-Type', 'application/json'],
              ['Authorization', `Bearer invalid-jwt`],
            ]),
            body: JSON.stringify({
              content: 'A note',
              nodeIds: [],
            } satisfies PostNoteRequestBody),
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
      });
    });
    describe('403', (): void => {
      test('rejects an outsider in a private room', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const outsider: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const canvas: E2ETestCanvas = await manager.createCanvas(
          owner,
          testContext,
          RoomVisibilityDto.private,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          outsider.username,
          outsider.password,
          testContext,
        );

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note`,
          {
            method: 'POST',
            headers: new Headers([
              ['Content-Type', 'application/json'],
              ['Authorization', `Bearer ${login.jwt}`],
            ]),
            body: JSON.stringify({
              content: 'A note',
              nodeIds: [],
            } satisfies PostNoteRequestBody),
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
      });
    });
    describe('404', (): void => {
      test('rejects an unknown canvas', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const canvas: E2ETestCanvas = await manager.createCanvas(
          owner,
          testContext,
          RoomVisibilityDto.private,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        canvas.canvasId = randomUUID();

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note`,
          {
            method: 'POST',
            headers: new Headers([
              ['Content-Type', 'application/json'],
              ['Authorization', `Bearer ${login.jwt}`],
            ]),
            body: JSON.stringify({
              content: 'A note',
              nodeIds: [],
            } satisfies PostNoteRequestBody),
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
      test('rejects an unpublished project', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const canvas: E2ETestCanvas = await manager.createCanvas(
          owner,
          testContext,
          RoomVisibilityDto.private,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const unpublished: Response = await manager.unpublishDocument(
          'api::project.project',
          canvas.projectId,
          {},
          testContext,
        );
        assert.equal(unpublished.status, 200);

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note`,
          {
            method: 'POST',
            headers: new Headers([
              ['Content-Type', 'application/json'],
              ['Authorization', `Bearer ${login.jwt}`],
            ]),
            body: JSON.stringify({
              content: 'A note',
              nodeIds: [],
            } satisfies PostNoteRequestBody),
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
      test('rejects a canvas in another room', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const canvas: E2ETestCanvas = await manager.createCanvas(
          owner,
          testContext,
          RoomVisibilityDto.private,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const other: E2ETestCanvas = await manager.createCanvas(
          owner,
          testContext,
        );
        canvas.roomId = other.roomId;

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note`,
          {
            method: 'POST',
            headers: new Headers([
              ['Content-Type', 'application/json'],
              ['Authorization', `Bearer ${login.jwt}`],
            ]),
            body: JSON.stringify({
              content: 'A note',
              nodeIds: [],
            } satisfies PostNoteRequestBody),
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
      test('rejects an unpublished canvas', async (testContext: TestContext): Promise<void> => {
        // given
        const owner: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const canvas: E2ETestCanvas = await manager.createCanvas(
          owner,
          testContext,
          RoomVisibilityDto.private,
        );
        const login: PostAuthResponseBodyDto = await manager.loginUser(
          owner.username,
          owner.password,
          testContext,
        );
        const unpublished: Response = await manager.unpublishDocument(
          'api::canvas.canvas',
          canvas.canvasId,
          {},
          testContext,
        );
        assert.equal(unpublished.status, 200);

        // when
        const response: Response = await fetch(
          `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note`,
          {
            method: 'POST',
            headers: new Headers([
              ['Content-Type', 'application/json'],
              ['Authorization', `Bearer ${login.jwt}`],
            ]),
            body: JSON.stringify({
              content: 'A note',
              nodeIds: [],
            } satisfies PostNoteRequestBody),
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
  describe('/:noteId', (): void => {
    describe('PUT', (): void => {
      describe('204', (): void => {
        test('owner can update a note', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const reference: string = await manager.createPublishedDocument(
            'api::node-reference.node-reference',
            { note, nodeId: randomUUID() },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                content: 'Updated note',
              } satisfies UpdateNoteRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(noteStateSchema.parse(await stored.json()).data, {
            documentId: note,
            content: 'Updated note',
          });
          const storedReference: Response = await manager.readDocument(
            'api::node-reference.node-reference',
            reference,
            testContext,
          );
          assert.equal(storedReference.status, 200);
        });
        test('retains the published project and author despite draft reassignment', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const reference: string = await manager.createPublishedDocument(
            'api::node-reference.node-reference',
            { note, nodeId: randomUUID() },
            testContext,
          );

          const otherAuthor: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const other: E2ETestCanvas = await manager.createCanvas(
            otherAuthor,
            testContext,
          );
          const draft: Response = await manager.updateDocument(
            'api::note.note',
            note,
            {
              project: other.projectId,
              author: otherAuthor.documentId,
              content: 'Draft note',
            },
            testContext,
          );
          assert.equal(draft.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                content: 'Updated note',
              } satisfies UpdateNoteRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(noteStateSchema.parse(await stored.json()).data, {
            documentId: note,
            content: 'Updated note',
          });
          const storedReference: Response = await manager.readDocument(
            'api::node-reference.node-reference',
            reference,
            testContext,
          );
          assert.equal(storedReference.status, 200);
          const published: Response = await manager.readDocuments(
            'api::note.note',
            {
              [`filters[documentId][$eq]`]: note,
              [`filters[project][documentId][$eq]`]: canvas.projectId,
              [`filters[author][documentId][$eq]`]: owner.documentId,
              status: 'published',
            },
            testContext,
          );
          assert.equal(published.status, 200);
          assert.deepEqual(
            noteListSchema.parse(await published.json()).results,
            [{ documentId: note, content: 'Updated note' }],
          );
        });
        test('collaborator can update another author�s note', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
            [collaborator.documentId],
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const reference: string = await manager.createPublishedDocument(
            'api::node-reference.node-reference',
            { note, nodeId: randomUUID() },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                content: 'Updated note',
              } satisfies UpdateNoteRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(noteStateSchema.parse(await stored.json()).data, {
            documentId: note,
            content: 'Updated note',
          });
          const storedReference: Response = await manager.readDocument(
            'api::node-reference.node-reference',
            reference,
            testContext,
          );
          assert.equal(storedReference.status, 200);
        });
        test('authenticated public-room visitor can update a note', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const outsider: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.public,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
            testContext,
          );
          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const reference: string = await manager.createPublishedDocument(
            'api::node-reference.node-reference',
            { note, nodeId: randomUUID() },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                content: 'Updated note',
              } satisfies UpdateNoteRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(noteStateSchema.parse(await stored.json()).data, {
            documentId: note,
            content: 'Updated note',
          });
          const storedReference: Response = await manager.readDocument(
            'api::node-reference.node-reference',
            reference,
            testContext,
          );
          assert.equal(storedReference.status, 200);
        });
      });
      describe('400', (): void => {
        test('rejects missing content', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const originalResponse: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: unknown = await originalResponse.json();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify(
                // eslint-disable-next-line @typescript-eslint/no-generated-empty-object-type -- The missing required field is intentional.
                {} satisfies Omit<UpdateNoteRequestBodyDto, 'content'>,
              ),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: ['content must be a string'],
          });
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(await stored.json(), original);
        });
        test('rejects null content', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const originalResponse: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: unknown = await originalResponse.json();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({ content: null } satisfies Omit<
                UpdateNoteRequestBodyDto,
                'content'
              > & { content: null }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: ['content must be a string'],
          });
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(await stored.json(), original);
        });
        test('rejects non-string content', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const originalResponse: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: unknown = await originalResponse.json();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({ content: false } satisfies Omit<
                UpdateNoteRequestBodyDto,
                'content'
              > & { content: boolean }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: ['content must be a string'],
          });
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(await stored.json(), original);
        });
        test('rejects unexpected properties', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const originalResponse: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: unknown = await originalResponse.json();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                content: 'Updated',
                unexpected: true,
              } satisfies UpdateNoteRequestBodyDto & { unexpected: boolean }),
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
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(await stored.json(), original);
        });
      });
      describe('401', (): void => {
        test('rejects anonymous access to a private room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );

          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const originalResponse: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: unknown = await originalResponse.json();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'PUT',
              headers: new Headers([['Content-Type', 'application/json']]),
              body: JSON.stringify({
                content: 'Updated note',
              } satisfies UpdateNoteRequestBodyDto),
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
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(await stored.json(), original);
        });
        test('requires authentication in a public room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.public,
          );

          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const originalResponse: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: unknown = await originalResponse.json();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'PUT',
              headers: new Headers([['Content-Type', 'application/json']]),
              body: JSON.stringify({
                content: 'Updated note',
              } satisfies UpdateNoteRequestBodyDto),
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
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(await stored.json(), original);
        });
        test('rejects an invalid jwt in an unlisted room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.unlisted,
          );

          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const originalResponse: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: unknown = await originalResponse.json();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer invalid-jwt`],
              ]),
              body: JSON.stringify({
                content: 'Updated note',
              } satisfies UpdateNoteRequestBodyDto),
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
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(await stored.json(), original);
        });
      });
      describe('403', (): void => {
        test('rejects outsider access to a private room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const outsider: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
            testContext,
          );
          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const originalResponse: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: unknown = await originalResponse.json();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                content: 'Updated note',
              } satisfies UpdateNoteRequestBodyDto),
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
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(await stored.json(), original);
        });
      });
      describe('404', (): void => {
        test('rejects an unknown note', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const note: string = randomUUID();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                content: 'Updated note',
              } satisfies UpdateNoteRequestBodyDto),
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
        test('rejects an unpublished note', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const unpublished: Response = await manager.unpublishDocument(
            'api::note.note',
            note,
            {},
            testContext,
          );
          assert.equal(unpublished.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                content: 'Updated note',
              } satisfies UpdateNoteRequestBodyDto),
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
        test('rejects a note from another project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const other: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
          );
          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            { project: other.projectId, content: 'Foreign note' },
            testContext,
          );
          const originalResponse: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: unknown = await originalResponse.json();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                content: 'Updated note',
              } satisfies UpdateNoteRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(await stored.json(), original);
        });
        test('rejects an unknown canvas', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          canvas.canvasId = randomUUID();
          const originalResponse: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: unknown = await originalResponse.json();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                content: 'Updated note',
              } satisfies UpdateNoteRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(await stored.json(), original);
        });
        test('rejects an unpublished project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const unpublished: Response = await manager.unpublishDocument(
            'api::project.project',
            canvas.projectId,
            {},
            testContext,
          );
          assert.equal(unpublished.status, 200);
          const originalResponse: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: unknown = await originalResponse.json();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                content: 'Updated note',
              } satisfies UpdateNoteRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(await stored.json(), original);
        });
        test('rejects a canvas from another room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const other: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
          );
          canvas.roomId = other.roomId;
          const originalResponse: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: unknown = await originalResponse.json();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'PUT',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              body: JSON.stringify({
                content: 'Updated note',
              } satisfies UpdateNoteRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            statusCode: 404,
            message: 'Not Found',
          });
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(await stored.json(), original);
        });
      });
    });
    describe('DELETE', (): void => {
      describe('204', (): void => {
        test('owner can delete a note', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const reference: string = await manager.createPublishedDocument(
            'api::node-reference.node-reference',
            { note, nodeId: randomUUID() },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'DELETE',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 404);
          const storedReference: Response = await manager.readDocument(
            'api::node-reference.node-reference',
            reference,
            testContext,
          );
          assert.equal(storedReference.status, 404);
        });
        test('collaborator can delete another author�s note', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const collaborator: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
            [collaborator.documentId],
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            collaborator.username,
            collaborator.password,
            testContext,
          );
          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const reference: string = await manager.createPublishedDocument(
            'api::node-reference.node-reference',
            { note, nodeId: randomUUID() },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'DELETE',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 404);
          const storedReference: Response = await manager.readDocument(
            'api::node-reference.node-reference',
            reference,
            testContext,
          );
          assert.equal(storedReference.status, 404);
        });
        test('authenticated public-room visitor can delete a note', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const outsider: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.public,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
            testContext,
          );
          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const reference: string = await manager.createPublishedDocument(
            'api::node-reference.node-reference',
            { note, nodeId: randomUUID() },
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'DELETE',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 204);
          assert.equal(await response.text(), '');
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 404);
          const storedReference: Response = await manager.readDocument(
            'api::node-reference.node-reference',
            reference,
            testContext,
          );
          assert.equal(storedReference.status, 404);
        });
      });
      describe('401', (): void => {
        test('rejects anonymous access to a private room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );

          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const originalResponse: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: unknown = await originalResponse.json();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'DELETE',
              headers: new Headers([['Content-Type', 'application/json']]),
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
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(await stored.json(), original);
        });
        test('requires authentication in a public room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.public,
          );

          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const originalResponse: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: unknown = await originalResponse.json();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'DELETE',
              headers: new Headers([['Content-Type', 'application/json']]),
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
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(await stored.json(), original);
        });
        test('rejects an invalid jwt in an unlisted room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.unlisted,
          );

          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const originalResponse: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: unknown = await originalResponse.json();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'DELETE',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer invalid-jwt`],
              ]),
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
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(await stored.json(), original);
        });
      });
      describe('403', (): void => {
        test('rejects outsider access to a private room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const outsider: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            outsider.username,
            outsider.password,
            testContext,
          );
          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const originalResponse: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: unknown = await originalResponse.json();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'DELETE',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
              ]),
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
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(await stored.json(), original);
        });
      });
      describe('404', (): void => {
        test('rejects an unknown note', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const note: string = randomUUID();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'DELETE',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
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
        });
        test('rejects an unpublished note', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const unpublished: Response = await manager.unpublishDocument(
            'api::note.note',
            note,
            {},
            testContext,
          );
          assert.equal(unpublished.status, 200);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'DELETE',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
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
        });
        test('rejects a note from another project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const other: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
          );
          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            { project: other.projectId, content: 'Foreign note' },
            testContext,
          );
          const originalResponse: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: unknown = await originalResponse.json();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'DELETE',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
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
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(await stored.json(), original);
        });
        test('rejects an unknown canvas', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          canvas.canvasId = randomUUID();
          const originalResponse: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: unknown = await originalResponse.json();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'DELETE',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
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
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(await stored.json(), original);
        });
        test('rejects an unpublished project', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const unpublished: Response = await manager.unpublishDocument(
            'api::project.project',
            canvas.projectId,
            {},
            testContext,
          );
          assert.equal(unpublished.status, 200);
          const originalResponse: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: unknown = await originalResponse.json();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'DELETE',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
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
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(await stored.json(), original);
        });
        test('rejects a canvas from another room', async (testContext: TestContext): Promise<void> => {
          // given
          const owner: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const canvas: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
            RoomVisibilityDto.private,
          );
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            owner.username,
            owner.password,
            testContext,
          );
          const note: string = await manager.createPublishedDocument(
            'api::note.note',
            {
              project: canvas.projectId,
              content: 'Original note',
              author: owner.documentId,
            },
            testContext,
          );
          const other: E2ETestCanvas = await manager.createCanvas(
            owner,
            testContext,
          );
          canvas.roomId = other.roomId;
          const originalResponse: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(originalResponse.status, 200);
          const original: unknown = await originalResponse.json();

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/room/${canvas.roomId}/canvas/${canvas.canvasId}/note/${note}`,
            {
              method: 'DELETE',
              headers: new Headers([
                ['Content-Type', 'application/json'],
                ['Authorization', `Bearer ${login.jwt}`],
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
          const stored: Response = await manager.readDocument(
            'api::note.note',
            note,
            testContext,
          );
          assert.equal(stored.status, 200);
          assert.deepEqual(await stored.json(), original);
        });
      });
    });
  });
});
