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

  describe('post', (): void => {
    test('201: login user', async (testContext: TestContext): Promise<void> => {
      const authUrl: string = `${manager.context.apiUrl}/auth`;
      for (const user of [
        manager.context.primaryUser,
        manager.context.secondaryUser,
      ]) {
        const response: Response = await fetch(authUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: user.username,
            password: user.password,
          }),
          signal: testContext.signal,
        });
        assert.equal(response.status, 201);
        z.strictObject({
          username: z.literal(user.username),
          jwt: z.string().min(1),
        }).parse(await response.json());
      }
    });

    test('401: wrong password', async (testContext: TestContext): Promise<void> => {
      const authUrl: string = `${manager.context.apiUrl}/auth`;
      const response: Response = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: manager.context.primaryUser.username,
          password: 'wrong password',
        }),
        signal: testContext.signal,
      });
      assert.equal(response.status, 401);
      const body: unknown = await response.json();
      assert.deepEqual(body, {
        statusCode: 401,
        message: 'Unauthorized',
      });
    });

    test('401: unknown username', async (testContext: TestContext): Promise<void> => {
      const response: Response = await fetch(`${manager.context.apiUrl}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `${manager.context.primaryUser.username}-unknown`,
          password: manager.context.primaryUser.password,
        }),
        signal: testContext.signal,
      });
      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), {
        statusCode: 401,
        message: 'Unauthorized',
      });
    });

    test('400: invalid request body', async (testContext: TestContext): Promise<void> => {
      const cases: {
        name: string;
        body: Record<string, unknown>;
        message: string;
      }[] = [
        {
          name: 'missing username',
          body: { password: manager.context.primaryUser.password },
          message: 'username should not be empty',
        },
        {
          name: 'missing password',
          body: { username: manager.context.primaryUser.username },
          message: 'password should not be empty',
        },
        {
          name: 'non-string username',
          body: {
            username: 123,
            password: manager.context.primaryUser.password,
          },
          message: 'username must be a string',
        },
        {
          name: 'non-string password',
          body: {
            username: manager.context.primaryUser.username,
            password: 123,
          },
          message: 'password must be a string',
        },
        {
          name: 'unexpected property',
          body: {
            username: manager.context.primaryUser.username,
            password: manager.context.primaryUser.password,
            unexpected: true,
          },
          message: 'property unexpected should not exist',
        },
        {
          name: 'empty username',
          body: {
            username: '',
            password: manager.context.primaryUser.password,
          },
          message: 'username should not be empty',
        },
        {
          name: 'empty password',
          body: {
            username: manager.context.primaryUser.username,
            password: '',
          },
          message: 'password should not be empty',
        },
      ];
      for (const entry of cases) {
        await testContext.test(entry.name, async (): Promise<void> => {
          const response: Response = await fetch(
            `${manager.context.apiUrl}/auth`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(entry.body),
              signal: testContext.signal,
            },
          );
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: [entry.message],
          });
        });
      }
    });
  });

  describe('get', (): void => {
    test('200: correct jwt', async (testContext: TestContext): Promise<void> => {
      const authUrl: string = `${manager.context.apiUrl}/auth`;
      for (const user of [
        manager.context.primaryUser,
        manager.context.secondaryUser,
      ]) {
        const response: Response = await fetch(authUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: user.username,
            password: user.password,
          }),
          signal: testContext.signal,
        });
        assert.equal(response.status, 201);
        const body: PostAuthResponseBodyDto = z
          .strictObject({
            username: z.literal(user.username),
            jwt: z.string().min(1),
          })
          .parse(await response.json());

        // Verify that the returned token authenticates against the real application.
        const authenticated: Response = await fetch(authUrl, {
          headers: { Authorization: `Bearer ${body.jwt}` },
          signal: testContext.signal,
        });
        assert.equal(authenticated.status, 200);
        assert.deepEqual(await authenticated.json(), {
          username: user.username,
        });
      }
    });

    test('401: deleted user with valid jwt', async (testContext: TestContext): Promise<void> => {
      const strapiUrl: string = `http://127.0.0.1:${manager.context.strapiPort.toString()}`;
      const authUrl: string = `${manager.context.apiUrl}/auth`;
      const username: string = `e2e-${randomUUID()}`;
      const password: string = randomUUID();
      const registration: Response = await fetch(
        `${strapiUrl}/api/auth/local/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            password,
            email: `${username}@example.test`,
          }),
          signal: testContext.signal,
        },
      );
      assert.equal(registration.status, 200);
      const registered: { user: { documentId: string } } = z
        .object({ user: z.object({ documentId: z.string() }) })
        .parse(await registration.json());
      const login: Response = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        signal: testContext.signal,
      });
      assert.equal(login.status, 201);
      const body: PostAuthResponseBodyDto = z
        .strictObject({ username: z.literal(username), jwt: z.string().min(1) })
        .parse(await login.json());
      const authenticated: Response = await fetch(authUrl, {
        headers: { Authorization: `Bearer ${body.jwt}` },
        signal: testContext.signal,
      });
      assert.equal(authenticated.status, 200);
      assert.deepEqual(await authenticated.json(), { username });

      const deletion: Response = await fetch(
        `${strapiUrl}/content-manager/collection-types/plugin::users-permissions.user/${registered.user.documentId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${manager.context.admin.token}` },
          signal: testContext.signal,
        },
      );
      assert.equal(deletion.status, 200, await deletion.text());

      const rejected: Response = await fetch(authUrl, {
        headers: { Authorization: `Bearer ${body.jwt}` },
        signal: testContext.signal,
      });
      assert.equal(rejected.status, 401);
      assert.deepEqual(await rejected.json(), {
        statusCode: 401,
        message: 'Unauthorized',
      });
    });

    test('401: incorrect jwt', async (testContext: TestContext): Promise<void> => {
      const authUrl: string = `${manager.context.apiUrl}/auth`;
      const authenticated: Response = await fetch(authUrl, {
        headers: { Authorization: `Bearer wrong_jwt` },
        signal: testContext.signal,
      });
      assert.equal(authenticated.status, 401);
      assert.deepEqual(await authenticated.json(), {
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    test('401: missing jwt', async (testContext: TestContext): Promise<void> => {
      const authUrl: string = `${manager.context.apiUrl}/auth`;
      const authenticated: Response = await fetch(authUrl, {
        signal: testContext.signal,
      });
      assert.equal(authenticated.status, 401);
      assert.deepEqual(await authenticated.json(), {
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    test('401: expired jwt', async (testContext: TestContext): Promise<void> => {
      const authUrl: string = `${manager.context.apiUrl}/auth`;
      const login: Response = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: manager.context.primaryUser.username,
          password: manager.context.primaryUser.password,
        }),
        signal: testContext.signal,
      });
      assert.equal(login.status, 201);
      const body: PostAuthResponseBodyDto = z
        .strictObject({
          username: z.literal(manager.context.primaryUser.username),
          jwt: z.string().min(1),
        })
        .parse(await login.json());
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
        const response: Response = await fetch(authUrl, {
          headers: { Authorization: `Bearer ${unsignedJwt}.${signature}` },
          signal: testContext.signal,
        });
        if (expiresAt === 1) {
          assert.equal(response.status, 401);
          assert.deepEqual(await response.json(), {
            statusCode: 401,
            message: 'Unauthorized',
          });
        } else {
          assert.equal(response.status, 200);
          assert.deepEqual(await response.json(), {
            username: manager.context.primaryUser.username,
          });
        }
      }
    });

    test('401: tampered jwt signature', async (testContext: TestContext): Promise<void> => {
      const authUrl: string = `${manager.context.apiUrl}/auth`;
      const login: Response = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: manager.context.primaryUser.username,
          password: manager.context.primaryUser.password,
        }),
        signal: testContext.signal,
      });
      assert.equal(login.status, 201);
      const body: PostAuthResponseBodyDto = z
        .strictObject({
          username: z.literal(manager.context.primaryUser.username),
          jwt: z.string().min(1),
        })
        .parse(await login.json());
      const parts: string[] = body.jwt.split('.');
      const signature: string = parts[2];
      parts[2] = `${signature.startsWith('A') ? 'B' : 'A'}${signature.slice(1)}`;
      const response: Response = await fetch(authUrl, {
        headers: { Authorization: `Bearer ${parts.join('.')}` },
        signal: testContext.signal,
      });
      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), {
        statusCode: 401,
        message: 'Unauthorized',
      });
    });

    test('401: incorrect authorization format', async (testContext: TestContext): Promise<void> => {
      const authUrl: string = `${manager.context.apiUrl}/auth`;
      const login: Response = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: manager.context.primaryUser.username,
          password: manager.context.primaryUser.password,
        }),
        signal: testContext.signal,
      });
      assert.equal(login.status, 201);
      const body: PostAuthResponseBodyDto = z
        .strictObject({
          username: z.literal(manager.context.primaryUser.username),
          jwt: z.string().min(1),
        })
        .parse(await login.json());
      for (const authorization of [body.jwt, `Basic ${body.jwt}`]) {
        const response: Response = await fetch(authUrl, {
          headers: { Authorization: authorization },
          signal: testContext.signal,
        });
        assert.equal(response.status, 401);
        assert.deepEqual(await response.json(), {
          statusCode: 401,
          message: 'Unauthorized',
        });
      }
    });
  });
});
