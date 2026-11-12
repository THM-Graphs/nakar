import type { PostAuthRequestBodyDto } from './dto/PostAuthRequestBodyDto';
import type { PostRegisterRequestBodyDto } from './dto/PostRegisterRequestBodyDto';
import type { E2ETestApplicationUser } from '../../../../e2e/E2ETestApplicationUser';
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import type { SuiteContext, TestContext } from 'node:test';
import { after, before, describe } from 'node:test';
import { test } from 'node:test';
import type { PostAuthResponseBodyDto } from './dto/PostAuthResponseBodyDto';
import { E2ETestManager } from '../../../../e2e/E2ETestManager';
import z from 'zod';
import type { JwtPayload } from 'jsonwebtoken';

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
    describe('200', (): void => {
      test('logs in each registered user', async (testContext: TestContext): Promise<void> => {
        const userIndices: number[] = [0, 1];
        for (const userIndex of userIndices) {
          // given
          const users: E2ETestApplicationUser[] = [
            await manager.registerUser(testContext),
            await manager.registerUser(testContext),
          ];
          const user: E2ETestApplicationUser = users[userIndex];

          // when
          const authUrl: string = `${manager.apiUrl}/auth`;
          const response: Response = await fetch(authUrl, {
            method: 'POST',
            headers: new Headers([['Content-Type', 'application/json']]),
            body: JSON.stringify({
              username: user.username,
              password: user.password,
            } satisfies PostAuthRequestBodyDto),
            signal: testContext.signal,
          });

          // then
          assert.equal(response.status, 200);
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
        const primaryUser: E2ETestApplicationUser =
          await manager.registerUser(testContext);

        // when
        const authUrl: string = `${manager.apiUrl}/auth`;
        const response: Response = await fetch(authUrl, {
          method: 'POST',
          headers: new Headers([['Content-Type', 'application/json']]),
          body: JSON.stringify({
            username: primaryUser.username,
            password: 'wrong password',
          } satisfies PostAuthRequestBodyDto),
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
          headers: new Headers([['Content-Type', 'application/json']]),
          body: JSON.stringify({
            username: `unknown-${randomUUID()}`,
            password: randomUUID(),
          } satisfies PostAuthRequestBodyDto),
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

        const user: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const blocking: Response = await manager.updateDocument(
          'plugin::users-permissions.user',
          user.documentId,
          { blocked: true },
          testContext,
        );
        assert.equal(blocking.status, 200, await blocking.text());

        // when
        const rejected: Response = await fetch(authUrl, {
          method: 'POST',
          headers: new Headers([['Content-Type', 'application/json']]),
          body: JSON.stringify({
            username: user.username,
            password: user.password,
          } satisfies PostAuthRequestBodyDto),
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
      test('rejects malformed login request bodies', async (testContext: TestContext): Promise<void> => {
        const variants: {
          payload: Record<string, unknown>;
          expectedMessages: string[];
        }[] = [
          {
            payload: { username: undefined, password: randomUUID() },
            expectedMessages: ['username should not be empty'],
          },
          {
            payload: { password: undefined, username: `e2e-${randomUUID()}` },
            expectedMessages: ['password should not be empty'],
          },
          {
            payload: { username: 123, password: randomUUID() },
            expectedMessages: ['username must be a string'],
          },
          {
            payload: { password: 123, username: `e2e-${randomUUID()}` },
            expectedMessages: ['password must be a string'],
          },
          {
            payload: {
              unexpected: true,
              password: randomUUID(),
              username: `e2e-${randomUUID()}`,
            },
            expectedMessages: ['property unexpected should not exist'],
          },
          {
            payload: { username: '', password: randomUUID() },
            expectedMessages: ['username should not be empty'],
          },
          {
            payload: { password: '', username: `e2e-${randomUUID()}` },
            expectedMessages: ['password should not be empty'],
          },
        ];
        for (const variant of variants) {
          // when
          const response: Response = await fetch(`${manager.apiUrl}/auth`, {
            method: 'POST',
            headers: new Headers([['Content-Type', 'application/json']]),
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
  });

  describe('/register', (): void => {
    describe('POST', (): void => {
      describe('201', (): void => {
        test('creates a confirmed account with a usable JWT', async (testContext: TestContext): Promise<void> => {
          // given
          const username: string = `e2e-${randomUUID()}`;
          const email: string = `${username}@example.test`;

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/auth/register`,
            {
              method: 'POST',
              headers: new Headers([['Content-Type', 'application/json']]),
              body: JSON.stringify({
                username,
                email,
                password: randomUUID(),
              } satisfies PostRegisterRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          const json: unknown = await response.json();
          assert.equal(
            response.status,
            201,
            response.ok ? undefined : JSON.stringify(json),
          );
          const session: PostAuthResponseBodyDto = z
            .strictObject({
              username: z.literal(username),
              jwt: z.string().min(1),
            })
            .parse(json);
          const identity: Response = await fetch(
            `${manager.strapiUrl}/api/users/me`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${session.jwt}`],
              ]),
              signal: testContext.signal,
            },
          );
          assert.equal(identity.status, 200);
          z.object({
            username: z.literal(username),
            email: z.literal(email),
            confirmed: z.literal(true),
          }).parse(await identity.json());
          const currentUser: Response = await fetch(`${manager.apiUrl}/auth`, {
            headers: new Headers([['Authorization', `Bearer ${session.jwt}`]]),
            signal: testContext.signal,
          });
          assert.equal(currentUser.status, 200);
          z.strictObject({ username: z.literal(username) }).parse(
            await currentUser.json(),
          );
        });
      });

      describe('400', (): void => {
        test('rejects an invalid email address', async (testContext: TestContext): Promise<void> => {
          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/auth/register`,
            {
              method: 'POST',
              headers: new Headers([['Content-Type', 'application/json']]),
              body: JSON.stringify({
                username: `e2e-${randomUUID()}`,
                email: 'invalid',
                password: randomUUID(),
              } satisfies PostRegisterRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          z.object({ message: z.array(z.string()) }).parse(
            await response.json(),
          );
        });

        test('rejects a client-supplied role', async (testContext: TestContext): Promise<void> => {
          // given
          const username: string = `e2e-${randomUUID()}`;

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/auth/register`,
            {
              method: 'POST',
              headers: new Headers([['Content-Type', 'application/json']]),
              body: JSON.stringify({
                username,
                email: `${username}@example.test`,
                password: randomUUID(),
                role: manager.context.authenticatedRoleId,
              } satisfies PostRegisterRequestBodyDto & { role: number }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 400);
          z.object({
            message: z
              .array(z.string())
              .refine((messages: string[]): boolean =>
                messages.includes('property role should not exist'),
              ),
          }).parse(await response.json());
        });
      });

      describe('409', (): void => {
        test('rejects a username already in use', async (testContext: TestContext): Promise<void> => {
          // given
          const existing: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/auth/register`,
            {
              method: 'POST',
              headers: new Headers([['Content-Type', 'application/json']]),
              body: JSON.stringify({
                username: existing.username,
                email: `${randomUUID()}@example.test`,
                password: randomUUID(),
              } satisfies PostRegisterRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          const json: unknown = await response.json();
          assert.equal(
            response.status,
            409,
            response.ok ? undefined : JSON.stringify(json),
          );
          z.object({
            statusCode: z.literal(409),
            message: z.string().min(1),
          }).parse(json);
        });

        test('rejects an email address already in use regardless of case', async (testContext: TestContext): Promise<void> => {
          // given
          const email: string = `${randomUUID()}@example.test`;
          const existing: Response = await manager.createDocument(
            'plugin::users-permissions.user',
            {
              username: `e2e-${randomUUID()}`,
              email,
              password: randomUUID(),
              confirmed: true,
              role: manager.context.authenticatedRoleId,
            },
            testContext,
          );
          assert.equal(existing.status, 201);

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/auth/register`,
            {
              method: 'POST',
              headers: new Headers([['Content-Type', 'application/json']]),
              body: JSON.stringify({
                username: `e2e-${randomUUID()}`,
                email: email.toUpperCase(),
                password: randomUUID(),
              } satisfies PostRegisterRequestBodyDto),
              signal: testContext.signal,
            },
          );

          // then
          const json: unknown = await response.json();
          assert.equal(
            response.status,
            409,
            response.ok ? undefined : JSON.stringify(json),
          );
          z.object({
            statusCode: z.literal(409),
            message: z.string().min(1),
          }).parse(json);
        });
      });
    });
  });

  describe('GET', (): void => {
    describe('200', (): void => {
      test('identifies each registered user', async (testContext: TestContext): Promise<void> => {
        const userIndices: number[] = [0, 1];
        for (const userIndex of userIndices) {
          // given
          const users: E2ETestApplicationUser[] = [
            await manager.registerUser(testContext),
            await manager.registerUser(testContext),
          ];
          const user: E2ETestApplicationUser = users[userIndex];
          const authUrl: string = `${manager.apiUrl}/auth`;

          const body: PostAuthResponseBodyDto = await manager.loginUser(
            user.username,
            user.password,
            testContext,
          );

          // when
          const authenticated: Response = await fetch(authUrl, {
            headers: new Headers([['Authorization', `Bearer ${body.jwt}`]]),
            signal: testContext.signal,
          });

          // then
          assert.equal(authenticated.status, 200);
          assert.deepEqual(await authenticated.json(), {
            username: user.username,
          });
        }
      });

      test('accepts a correctly signed unexpired jwt', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser =
          await manager.registerUser(testContext);
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
        const expiresAt: number = Math.floor(Date.now() / 1000) + 60;
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
          headers: new Headers([
            ['Authorization', `Bearer ${unsignedJwt}.${signature}`],
          ]),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), {
          username: primaryUser.username,
        });
      });
    });

    describe('401', (): void => {
      test('deleted user with valid jwt', async (testContext: TestContext): Promise<void> => {
        // given
        const authUrl: string = `${manager.apiUrl}/auth`;

        const registered: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const body: PostAuthResponseBodyDto = await manager.loginUser(
          registered.username,
          registered.password,
          testContext,
        );
        const authenticated: Response = await fetch(authUrl, {
          headers: new Headers([['Authorization', `Bearer ${body.jwt}`]]),
          signal: testContext.signal,
        });
        assert.equal(authenticated.status, 200);
        assert.deepEqual(await authenticated.json(), {
          username: registered.username,
        });

        const deletion: Response = await manager.deleteDocument(
          'plugin::users-permissions.user',
          registered.documentId,
          testContext,
        );
        assert.equal(deletion.status, 200, await deletion.text());

        // when
        const rejected: Response = await fetch(authUrl, {
          headers: new Headers([['Authorization', `Bearer ${body.jwt}`]]),
          signal: testContext.signal,
        });

        // then
        assert.equal(rejected.status, 401);
        assert.equal(rejected.headers.get('www-authenticate'), 'Bearer');
        assert.deepEqual(await rejected.json(), {
          statusCode: 401,
          message: 'Unauthorized',
        });
      });

      test('blocked user with valid jwt', async (testContext: TestContext): Promise<void> => {
        // given
        const authUrl: string = `${manager.apiUrl}/auth`;

        const registered: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const body: PostAuthResponseBodyDto = await manager.loginUser(
          registered.username,
          registered.password,
          testContext,
        );
        const authenticated: Response = await fetch(authUrl, {
          headers: new Headers([['Authorization', `Bearer ${body.jwt}`]]),
          signal: testContext.signal,
        });
        assert.equal(authenticated.status, 200);
        assert.deepEqual(await authenticated.json(), {
          username: registered.username,
        });

        const blocking: Response = await manager.updateDocument(
          'plugin::users-permissions.user',
          registered.documentId,
          { blocked: true },
          testContext,
        );
        assert.equal(blocking.status, 200, await blocking.text());

        // when
        const rejected: Response = await fetch(authUrl, {
          headers: new Headers([['Authorization', `Bearer ${body.jwt}`]]),
          signal: testContext.signal,
        });

        // then
        assert.equal(rejected.status, 401);
        assert.equal(rejected.headers.get('www-authenticate'), 'Bearer');
        assert.deepEqual(await rejected.json(), {
          statusCode: 401,
          message: 'Unauthorized',
        });
      });

      test('rejects requests without valid authentication', async (testContext: TestContext): Promise<void> => {
        const variants: { headers: [string, string][] }[] = [
          {
            headers: [['Authorization', `Bearer wrong_jwt`]],
          },
          { headers: [] },
        ];
        for (const variant of variants) {
          // when
          const authUrl: string = `${manager.apiUrl}/auth`;
          const authenticated: Response = await fetch(authUrl, {
            signal: testContext.signal,
            headers: new Headers(variant.headers),
          });

          // then
          assert.equal(authenticated.status, 401);
          assert.equal(authenticated.headers.get('www-authenticate'), 'Bearer');
          assert.deepEqual(await authenticated.json(), {
            message: 'Unauthorized',
            statusCode: 401,
          });
        }
      });

      test('expired jwt', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser =
          await manager.registerUser(testContext);
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
        const expiresAt: number = 1;
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
          headers: new Headers([
            ['Authorization', `Bearer ${unsignedJwt}.${signature}`],
          ]),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 401);
        assert.equal(response.headers.get('www-authenticate'), 'Bearer');
        assert.deepEqual(await response.json(), {
          statusCode: 401,
          message: 'Unauthorized',
        });
      });

      test('tampered jwt signature', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser =
          await manager.registerUser(testContext);
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
          headers: new Headers([
            ['Authorization', `Bearer ${parts.join('.')}`],
          ]),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 401);
        assert.equal(response.headers.get('www-authenticate'), 'Bearer');
        assert.deepEqual(await response.json(), {
          statusCode: 401,
          message: 'Unauthorized',
        });
      });

      test('rejects a token without the Bearer scheme', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const authUrl: string = `${manager.apiUrl}/auth`;
        const body: PostAuthResponseBodyDto = await manager.loginUser(
          primaryUser.username,
          primaryUser.password,
          testContext,
        );
        const authorization: string = body.jwt;

        // when
        const response: Response = await fetch(authUrl, {
          headers: new Headers([['Authorization', authorization]]),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 401);
        assert.equal(response.headers.get('www-authenticate'), 'Bearer');
        assert.deepEqual(await response.json(), {
          statusCode: 401,
          message: 'Unauthorized',
        });
      });
      test('rejects the Basic authorization scheme', async (testContext: TestContext): Promise<void> => {
        // given
        const primaryUser: E2ETestApplicationUser =
          await manager.registerUser(testContext);
        const authUrl: string = `${manager.apiUrl}/auth`;
        const body: PostAuthResponseBodyDto = await manager.loginUser(
          primaryUser.username,
          primaryUser.password,
          testContext,
        );
        const authorization: string = `Basic ${body.jwt}`;

        // when
        const response: Response = await fetch(authUrl, {
          headers: new Headers([['Authorization', authorization]]),
          signal: testContext.signal,
        });

        // then
        assert.equal(response.status, 401);
        assert.equal(response.headers.get('www-authenticate'), 'Bearer');
        assert.deepEqual(await response.json(), {
          statusCode: 401,
          message: 'Unauthorized',
        });
      });
    });
  });
});
