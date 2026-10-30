import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import type { SuiteContext, TestContext } from 'node:test';
import { after, before, describe } from 'node:test';
import { test } from 'node:test';
import type { PostAuthResponseBodyDto } from './dto/PostAuthResponseBodyDto';
import { E2ETestManager } from '../../../../e2e/E2ETestManager';
import z from 'zod';
import type { JwtPayload } from 'jsonwebtoken';
import type { E2ETestApplicationUser } from '../../../../e2e/E2ETestApplicationUser';

describe('/auth', (suiteContext: SuiteContext): void => {
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
      test('login user', async (testContext: TestContext): Promise<void> => {
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

        for (const user of [primaryUser, secondaryUser]) {
          // when
          const authUrl: string = `${manager.apiUrl}/auth`;
          const response: Response = await fetch(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: user.username,
              password: user.password,
            }),
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 201);
          z.strictObject({
            username: z.literal(user.username),
            jwt: z.string().min(1),
          }).parse(await response.json());
        }
      });
    });

    describe('401', (): void => {
      test('wrong password', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );

        // when
        const authUrl: string = `${manager.apiUrl}/auth`;
        const response: Response = await fetch(authUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: primaryUser.username,
            password: 'wrong password',
          }),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 401);
        const body: unknown = await response.json();
        assert.deepEqual(body, {
          statusCode: 401,
          message: 'Unauthorized',
        });
      });

      test('unknown username', async (testContext: TestContext): Promise<void> => {
        // when
        const response: Response = await fetch(`${manager.apiUrl}/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: `unknown-${randomUUID()}`,
            password: randomUUID(),
          }),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 401);
        assert.deepEqual(await response.json(), {
          statusCode: 401,
          message: 'Unauthorized',
        });
      });

      test('blocked user', async (testContext: TestContext): Promise<void> => {
        // given
        const authUrl: string = `${manager.apiUrl}/auth`;
        const username: string = `e2e-${randomUUID()}`;
        const password: string = randomUUID();
        const user: E2ETestApplicationUser = await manager.registerUser(
          username,
          password,
          testContext,
        );
        const blocking: Response = await fetch(
          `${manager.strapiUrl}/content-manager/collection-types/plugin::users-permissions.user/${user.documentId}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${manager.context.admin.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ blocked: true }),
            signal: testContext.signal,
          },
        );
        assert.equal(blocking.status, 200, await blocking.text());

        // when
        const rejected: Response = await fetch(authUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
          signal: testContext.signal,
        });

        // then
        assert.equal(rejected.status, 401);
        assert.deepEqual(await rejected.json(), {
          statusCode: 401,
          message: 'Unauthorized',
        });
      });
    });

    describe('400', (): void => {
      test('username should not be empty', async (testContext: TestContext): Promise<void> => {
        // when
        const response: Response = await fetch(`${manager.apiUrl}/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: randomUUID(),
          }),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), {
          statusCode: 400,
          error: 'Bad Request',
          message: ['username should not be empty'],
        });
      });

      test('password should not be empty', async (testContext: TestContext): Promise<void> => {
        // when
        const response: Response = await fetch(`${manager.apiUrl}/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: `e2e-${randomUUID()}`,
          }),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), {
          statusCode: 400,
          error: 'Bad Request',
          message: ['password should not be empty'],
        });
      });

      test('username must be a string', async (testContext: TestContext): Promise<void> => {
        // when
        const response: Response = await fetch(`${manager.apiUrl}/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 123,
            password: randomUUID(),
          }),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), {
          statusCode: 400,
          error: 'Bad Request',
          message: ['username must be a string'],
        });
      });

      test('password must be a string', async (testContext: TestContext): Promise<void> => {
        // when
        const response: Response = await fetch(`${manager.apiUrl}/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: `e2e-${randomUUID()}`,
            password: 123,
          }),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), {
          statusCode: 400,
          error: 'Bad Request',
          message: ['password must be a string'],
        });
      });

      test('property unexpected should not exist', async (testContext: TestContext): Promise<void> => {
        // when
        const response: Response = await fetch(`${manager.apiUrl}/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: `e2e-${randomUUID()}`,
            password: randomUUID(),
            unexpected: true,
          }),
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

      test('username should not be empty', async (testContext: TestContext): Promise<void> => {
        // when
        const response: Response = await fetch(`${manager.apiUrl}/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: '',
            password: randomUUID(),
          }),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), {
          statusCode: 400,
          error: 'Bad Request',
          message: ['username should not be empty'],
        });
      });

      test('password should not be empty', async (testContext: TestContext): Promise<void> => {
        // when
        const response: Response = await fetch(`${manager.apiUrl}/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: `e2e-${randomUUID()}`,
            password: '',
          }),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), {
          statusCode: 400,
          error: 'Bad Request',
          message: ['password should not be empty'],
        });
      });
    });
  });

  describe('GET', (): void => {
    describe('200', (): void => {
      test('correct jwt', async (testContext: TestContext): Promise<void> => {
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

        const authUrl: string = `${manager.apiUrl}/auth`;
        for (const user of [primaryUser, secondaryUser]) {
          // given
          const body: PostAuthResponseBodyDto = await manager.loginUser(
            user.username,
            user.password,
            testContext,
          );

          // when
          const authenticated: Response = await fetch(authUrl, {
            headers: { Authorization: `Bearer ${body.jwt}` },
            signal: testContext.signal,
          });

          // then
          assert.equal(authenticated.status, 200);
          assert.deepEqual(await authenticated.json(), {
            username: user.username,
          });
        }
      });
    });

    describe('401', (): void => {
      test('deleted user with valid jwt', async (testContext: TestContext): Promise<void> => {
        // given
        const authUrl: string = `${manager.apiUrl}/auth`;
        const username: string = `e2e-${randomUUID()}`;
        const password: string = randomUUID();
        const registered: E2ETestApplicationUser = await manager.registerUser(
          username,
          password,
          testContext,
        );
        const body: PostAuthResponseBodyDto = await manager.loginUser(
          username,
          password,
          testContext,
        );
        const authenticated: Response = await fetch(authUrl, {
          headers: { Authorization: `Bearer ${body.jwt}` },
          signal: testContext.signal,
        });
        assert.equal(authenticated.status, 200);
        assert.deepEqual(await authenticated.json(), { username });

        const deletion: Response = await fetch(
          `${manager.strapiUrl}/content-manager/collection-types/plugin::users-permissions.user/${registered.documentId}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${manager.context.admin.token}` },
            signal: testContext.signal,
          },
        );
        assert.equal(deletion.status, 200, await deletion.text());

        // when
        const rejected: Response = await fetch(authUrl, {
          headers: { Authorization: `Bearer ${body.jwt}` },
          signal: testContext.signal,
        });

        // then
        assert.equal(rejected.status, 401);
        assert.deepEqual(await rejected.json(), {
          statusCode: 401,
          message: 'Unauthorized',
        });
      });

      test('blocked user with valid jwt', async (testContext: TestContext): Promise<void> => {
        // given
        const authUrl: string = `${manager.apiUrl}/auth`;
        const username: string = `e2e-${randomUUID()}`;
        const password: string = randomUUID();
        const registered: E2ETestApplicationUser = await manager.registerUser(
          username,
          password,
          testContext,
        );
        const body: PostAuthResponseBodyDto = await manager.loginUser(
          username,
          password,
          testContext,
        );
        const authenticated: Response = await fetch(authUrl, {
          headers: { Authorization: `Bearer ${body.jwt}` },
          signal: testContext.signal,
        });
        assert.equal(authenticated.status, 200);
        assert.deepEqual(await authenticated.json(), { username });

        const blocking: Response = await fetch(
          `${manager.strapiUrl}/content-manager/collection-types/plugin::users-permissions.user/${registered.documentId}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${manager.context.admin.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ blocked: true }),
            signal: testContext.signal,
          },
        );
        assert.equal(blocking.status, 200, await blocking.text());

        // when
        const rejected: Response = await fetch(authUrl, {
          headers: { Authorization: `Bearer ${body.jwt}` },
          signal: testContext.signal,
        });

        // then
        assert.equal(rejected.status, 401);
        assert.deepEqual(await rejected.json(), {
          statusCode: 401,
          message: 'Unauthorized',
        });
      });

      test('incorrect jwt', async (testContext: TestContext): Promise<void> => {
        // when
        const authUrl: string = `${manager.apiUrl}/auth`;
        const authenticated: Response = await fetch(authUrl, {
          headers: { Authorization: `Bearer wrong_jwt` },
          signal: testContext.signal,
        });

        // then
        assert.equal(authenticated.status, 401);
        assert.deepEqual(await authenticated.json(), {
          message: 'Unauthorized',
          statusCode: 401,
        });
      });

      test('missing jwt', async (testContext: TestContext): Promise<void> => {
        // when
        const authUrl: string = `${manager.apiUrl}/auth`;
        const authenticated: Response = await fetch(authUrl, {
          signal: testContext.signal,
        });

        // then
        assert.equal(authenticated.status, 401);
        assert.deepEqual(await authenticated.json(), {
          message: 'Unauthorized',
          statusCode: 401,
        });
      });

      test('expired jwt', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const authUrl: string = `${manager.apiUrl}/auth`;
        const body: PostAuthResponseBodyDto = await manager.loginUser(
          primaryUser.username,
          primaryUser.password,
          testContext,
        );
        const parts: string[] = body.jwt.split('.');
        const payload: { id: number } & JwtPayload = z
          .object({ id: z.number(), iat: z.number(), exp: z.number() })
          .parse(JSON.parse(Buffer.from(parts[1], 'base64url').toString()));

        // Verify the same signing process with an unexpired token first.
        for (const expiresAt of [Math.floor(Date.now() / 1000) + 60, 1]) {
          const encodedPayload: string = Buffer.from(
            JSON.stringify({ ...payload, exp: expiresAt }),
          ).toString('base64url');
          const unsignedJwt: string = `${parts[0]}.${encodedPayload}`;
          const signature: string = createHmac(
            'sha256',
            manager.context.jwtSecret,
          )
            .update(unsignedJwt)
            .digest('base64url');

          // when
          const response: Response = await fetch(authUrl, {
            headers: { Authorization: `Bearer ${unsignedJwt}.${signature}` },
            signal: testContext.signal,
          });

          // then
          if (expiresAt === 1) {
            assert.equal(response.status, 401);
            assert.deepEqual(await response.json(), {
              statusCode: 401,
              message: 'Unauthorized',
            });
          } else {
            assert.equal(response.status, 200);
            assert.deepEqual(await response.json(), {
              username: primaryUser.username,
            });
          }
        }
      });

      test('tampered jwt signature', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const authUrl: string = `${manager.apiUrl}/auth`;
        const body: PostAuthResponseBodyDto = await manager.loginUser(
          primaryUser.username,
          primaryUser.password,
          testContext,
        );
        const parts: string[] = body.jwt.split('.');
        const signature: string = parts[2];
        parts[2] = `${signature.startsWith('A') ? 'B' : 'A'}${signature.slice(1)}`;

        // when
        const response: Response = await fetch(authUrl, {
          headers: { Authorization: `Bearer ${parts.join('.')}` },
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 401);
        assert.deepEqual(await response.json(), {
          statusCode: 401,
          message: 'Unauthorized',
        });
      });

      test('incorrect authorization format', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser = await manager.registerUser(
          `e2e-${randomUUID()}`,
          randomUUID(),
          testContext,
        );
        const authUrl: string = `${manager.apiUrl}/auth`;
        const body: PostAuthResponseBodyDto = await manager.loginUser(
          primaryUser.username,
          primaryUser.password,
          testContext,
        );
        for (const authorization of [body.jwt, `Basic ${body.jwt}`]) {
          // when
          const response: Response = await fetch(authUrl, {
            headers: { Authorization: authorization },
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 401);
          assert.deepEqual(await response.json(), {
            statusCode: 401,
            message: 'Unauthorized',
          });
        }
      });
    });
  });
});
