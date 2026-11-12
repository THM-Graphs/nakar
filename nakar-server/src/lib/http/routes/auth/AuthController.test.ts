import type { PostAuthRequestBodyDto } from './dto/PostAuthRequestBodyDto';
import type { PostRegisterRequestBodyDto } from './dto/PostRegisterRequestBodyDto';
import type { E2ETestApplicationUser } from '../../../../e2e/E2ETestApplicationUser';
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import type { SuiteContext, TestContext } from 'node:test';
import { after, before, describe, test } from 'node:test';
import type { PostAuthResponseBodyDto } from './dto/PostAuthResponseBodyDto';
import { E2ETestManager } from '../../../../e2e/E2ETestManager';
import z from 'zod';
import type { JwtPayload } from 'jsonwebtoken';

/* eslint-disable @typescript-eslint/naming-convention -- Strapi settings use snake_case. */
interface AdvancedSettings {
  [key: string]: unknown;
  unique_email: boolean;
  allow_register: boolean;
  email_confirmation: boolean;
  email_reset_password: string | null;
  email_confirmation_redirection: string | null;
  default_role: string;
}

const advancedSettingsResponseSchema: z.ZodType<{
  settings: AdvancedSettings;
}> = z.object({
  settings: z.looseObject({
    unique_email: z.boolean(),
    allow_register: z.boolean(),
    email_confirmation: z.boolean(),
    email_reset_password: z.string().nullable(),
    email_confirmation_redirection: z.string().nullable(),
    default_role: z.string(),
  }),
});
/* eslint-enable @typescript-eslint/naming-convention */

interface RoleAction {
  enabled: boolean;
  policy: string;
}

type RolePermissions = Partial<
  Record<
    string,
    {
      controllers: Partial<Record<string, Partial<Record<string, RoleAction>>>>;
    }
  >
>;

interface Role {
  name: string;
  description: string;
  permissions: RolePermissions;
}

const roleSchema: z.ZodType<{ role: Role }> = z.object({
  role: z.looseObject({
    name: z.string(),
    description: z.string(),
    permissions: z.record(
      z.string(),
      z.looseObject({
        controllers: z.record(
          z.string(),
          z.record(
            z.string(),
            z.looseObject({ enabled: z.boolean(), policy: z.string() }),
          ),
        ),
      }),
    ),
  }),
});

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

      test('empty username', async (testContext: TestContext): Promise<void> => {
        // when
        const response: Response = await fetch(`${manager.apiUrl}/auth`, {
          method: 'POST',
          headers: new Headers([['Content-Type', 'application/json']]),
          body: JSON.stringify({
            username: '',
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

      test('empty password', async (testContext: TestContext): Promise<void> => {
        // when
        const response: Response = await fetch(`${manager.apiUrl}/auth`, {
          method: 'POST',
          headers: new Headers([['Content-Type', 'application/json']]),
          body: JSON.stringify({
            username: `e2e-${randomUUID()}`,
            password: '',
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
    });

    describe('400', (): void => {
      test('rejects invalid login bodies', async (testContext: TestContext): Promise<void> => {
        const variants: {
          payload:
            | Omit<PostAuthRequestBodyDto, 'username'>
            | Omit<PostAuthRequestBodyDto, 'password'>
            | (Omit<PostAuthRequestBodyDto, 'username'> & { username: number })
            | (Omit<PostAuthRequestBodyDto, 'password'> & { password: number })
            | (PostAuthRequestBodyDto & { unexpected: boolean });
          expectedBody: {
            statusCode: 400;
            error: 'Bad Request';
            message: string[];
          };
        }[] = [
          {
            payload: { password: randomUUID() },
            expectedBody: {
              statusCode: 400,
              error: 'Bad Request',
              message: ['username must be a string'],
            },
          },
          {
            payload: { username: `e2e-${randomUUID()}` },
            expectedBody: {
              statusCode: 400,
              error: 'Bad Request',
              message: ['password must be a string'],
            },
          },
          {
            payload: { username: 123, password: randomUUID() },
            expectedBody: {
              statusCode: 400,
              error: 'Bad Request',
              message: ['username must be a string'],
            },
          },
          {
            payload: { username: `e2e-${randomUUID()}`, password: 123 },
            expectedBody: {
              statusCode: 400,
              error: 'Bad Request',
              message: ['password must be a string'],
            },
          },
          {
            payload: {
              username: `e2e-${randomUUID()}`,
              password: randomUUID(),
              unexpected: true,
            },
            expectedBody: {
              statusCode: 400,
              error: 'Bad Request',
              message: ['property unexpected should not exist'],
            },
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
          assert.deepEqual(await response.json(), variant.expectedBody);
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
        test('rejects invalid registration bodies', async (testContext: TestContext): Promise<void> => {
          const variants: {
            requestBody: unknown;
            expectedResponseBody: unknown;
          }[] = [
            {
              requestBody: {
                username: `e2e-${randomUUID()}`,
                email: 'invalid',
                password: randomUUID(),
              },
              expectedResponseBody: {
                statusCode: 400,
                message: 'Registration details are invalid.',
              },
            },
            {
              requestBody: {
                username: '',
                email: `${randomUUID()}@example.test`,
                password: randomUUID(),
              },
              expectedResponseBody: {
                statusCode: 400,
                message: 'Registration details are invalid.',
              },
            },
            {
              requestBody: {
                username: `e2e-${randomUUID()}`,
                email: '',
                password: randomUUID(),
              },
              expectedResponseBody: {
                statusCode: 400,
                message: 'Registration details are invalid.',
              },
            },
            {
              requestBody: {
                username: `e2e-${randomUUID()}`,
                email: `${randomUUID()}@example.test`,
                password: '',
              },
              expectedResponseBody: {
                statusCode: 400,
                message: 'Registration details are invalid.',
              },
            },
            {
              requestBody: {
                username: 'ab',
                email: `${randomUUID()}@example.test`,
                password: randomUUID(),
              },
              expectedResponseBody: {
                statusCode: 400,
                message: 'Registration details are invalid.',
              },
            },
            {
              requestBody: {
                username: `e2e-${randomUUID()}`,
                email: `${randomUUID()}@example.test`,
                password: 'abcde',
              },
              expectedResponseBody: {
                statusCode: 400,
                message: 'Registration details are invalid.',
              },
            },
            {
              requestBody: {
                username: `e2e-${randomUUID()}`,
                email: `${randomUUID()}@example.test`,
                password: 'a'.repeat(73),
              },
              expectedResponseBody: {
                statusCode: 400,
                message: 'Registration details are invalid.',
              },
            },
            {
              requestBody: {
                email: `${randomUUID()}@example.test`,
                password: randomUUID(),
              },
              expectedResponseBody: {
                statusCode: 400,
                error: 'Bad Request',
                message: ['username must be a string'],
              },
            },
            {
              requestBody: {
                username: `e2e-${randomUUID()}`,
                password: randomUUID(),
              },
              expectedResponseBody: {
                statusCode: 400,
                error: 'Bad Request',
                message: ['email must be a string'],
              },
            },
            {
              requestBody: {
                username: `e2e-${randomUUID()}`,
                email: `${randomUUID()}@example.test`,
              },
              expectedResponseBody: {
                statusCode: 400,
                error: 'Bad Request',
                message: ['password must be a string'],
              },
            },
            {
              requestBody: {
                username: 123,
                email: `${randomUUID()}@example.test`,
                password: randomUUID(),
              },
              expectedResponseBody: {
                statusCode: 400,
                error: 'Bad Request',
                message: ['username must be a string'],
              },
            },
            {
              requestBody: {
                username: `e2e-${randomUUID()}`,
                email: 123,
                password: randomUUID(),
              },
              expectedResponseBody: {
                statusCode: 400,
                error: 'Bad Request',
                message: ['email must be a string'],
              },
            },
            {
              requestBody: {
                username: `e2e-${randomUUID()}`,
                email: `${randomUUID()}@example.test`,
                password: 123,
              },
              expectedResponseBody: {
                statusCode: 400,
                error: 'Bad Request',
                message: ['password must be a string'],
              },
            },
            {
              requestBody: {
                username: `e2e-${randomUUID()}`,
                email: `${randomUUID()}@example.test`,
                password: randomUUID(),
                role: manager.context.authenticatedRoleId,
              },
              expectedResponseBody: {
                statusCode: 400,
                error: 'Bad Request',
                message: ['property role should not exist'],
              },
            },
          ];

          for (const variant of variants) {
            // when
            const response: Response = await fetch(
              `${manager.apiUrl}/auth/register`,
              {
                method: 'POST',
                headers: new Headers([['Content-Type', 'application/json']]),
                body: JSON.stringify(variant.requestBody),
                signal: testContext.signal,
              },
            );

            // then
            assert.equal(response.status, 400);
            assert.deepEqual(
              await response.json(),
              variant.expectedResponseBody,
            );
          }
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

      describe('503', (): void => {
        test('rejects registration when the register action is disabled', async (testContext: TestContext): Promise<void> => {
          // given
          const headers: Headers = new Headers([
            ['Authorization', `Bearer ${manager.context.admin.token}`],
            ['Content-Type', 'application/json'],
          ]);
          const settingsUrl: string = `${manager.strapiUrl}/users-permissions/advanced`;
          const settingsResponse: Response = await fetch(settingsUrl, {
            headers,
            signal: testContext.signal,
          });
          assert.equal(settingsResponse.status, 200);
          const settings: AdvancedSettings =
            advancedSettingsResponseSchema.parse(
              await settingsResponse.json(),
            ).settings;
          const disabledSettings: AdvancedSettings = { ...settings };
          disabledSettings.allow_register = false;
          const disableResponse: Response = await fetch(settingsUrl, {
            method: 'PUT',
            headers,
            body: JSON.stringify(disabledSettings),
            signal: testContext.signal,
          });
          assert.equal(disableResponse.status, 200);

          try {
            // when
            const response: Response = await fetch(
              `${manager.apiUrl}/auth/register`,
              {
                method: 'POST',
                headers: new Headers([['Content-Type', 'application/json']]),
                body: JSON.stringify({
                  username: `e2e-${randomUUID()}`,
                  email: `${randomUUID()}@example.test`,
                  password: randomUUID(),
                } satisfies PostRegisterRequestBodyDto),
                signal: testContext.signal,
              },
            );

            // then
            assert.equal(response.status, 503);
            assert.deepEqual(await response.json(), {
              statusCode: 503,
              message: 'Service Unavailable',
            });
          } finally {
            const restoreResponse: Response = await fetch(settingsUrl, {
              method: 'PUT',
              headers,
              body: JSON.stringify(settings),
              signal: testContext.signal,
            });
            assert.equal(restoreResponse.status, 200);
          }
        });

        test('rejects registration when the public role lacks the register permission', async (testContext: TestContext): Promise<void> => {
          // given
          const headers: Headers = new Headers([
            ['Authorization', `Bearer ${manager.context.admin.token}`],
            ['Content-Type', 'application/json'],
          ]);
          const rolesUrl: string = `${manager.strapiUrl}/users-permissions/roles`;
          const rolesResponse: Response = await fetch(rolesUrl, {
            headers,
            signal: testContext.signal,
          });
          assert.equal(rolesResponse.status, 200);
          const publicRole: { id: number; type: string } | undefined = z
            .object({
              roles: z.array(z.object({ id: z.number(), type: z.string() })),
            })
            .parse(await rolesResponse.json())
            .roles.find(
              (role: { id: number; type: string }): boolean =>
                role.type === 'public',
            );
          assert.ok(publicRole, 'Missing Public role');
          const roleUrl: string = `${rolesUrl}/${publicRole.id.toString()}`;
          const roleResponse: Response = await fetch(roleUrl, {
            headers,
            signal: testContext.signal,
          });
          assert.equal(roleResponse.status, 200);
          const role: Role = roleSchema.parse(await roleResponse.json()).role;
          const registerPermission: RoleAction | undefined =
            role.permissions['plugin::users-permissions']?.controllers[
              'auth'
            ]?.['register'];
          assert.ok(registerPermission, 'Missing register permission');
          registerPermission.enabled = false;
          const disableResponse: Response = await fetch(roleUrl, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
              name: role.name,
              description: role.description,
              permissions: role.permissions,
            }),
            signal: testContext.signal,
          });
          assert.equal(disableResponse.status, 200);

          try {
            // when
            const response: Response = await fetch(
              `${manager.apiUrl}/auth/register`,
              {
                method: 'POST',
                headers: new Headers([['Content-Type', 'application/json']]),
                body: JSON.stringify({
                  username: `e2e-${randomUUID()}`,
                  email: `${randomUUID()}@example.test`,
                  password: randomUUID(),
                } satisfies PostRegisterRequestBodyDto),
                signal: testContext.signal,
              },
            );

            // then
            assert.equal(response.status, 503);
            assert.deepEqual(await response.json(), {
              statusCode: 503,
              message: 'Service Unavailable',
            });
          } finally {
            registerPermission.enabled = true;
            const restoreResponse: Response = await fetch(roleUrl, {
              method: 'PUT',
              headers,
              body: JSON.stringify({
                name: role.name,
                description: role.description,
                permissions: role.permissions,
              }),
              signal: testContext.signal,
            });
            assert.equal(restoreResponse.status, 200);
          }
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
