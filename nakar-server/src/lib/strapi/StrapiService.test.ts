import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { SuiteContext, TestContext } from 'node:test';
import { after, before, describe, test } from 'node:test';
import z from 'zod';
import type { E2ETestApplicationUser } from '../../e2e/E2ETestApplicationUser';
import { E2ETestManager } from '../../e2e/E2ETestManager';
import type { PostAuthResponseBodyDto } from '../http/routes/auth/dto/PostAuthResponseBodyDto';

type RolePermissions = Record<
  string,
  { controllers: Record<string, Record<string, { enabled: boolean }>> }
>;

const roleSchema: z.ZodType<{ role: { permissions: RolePermissions } }> =
  z.object({
    role: z.object({
      permissions: z.record(
        z.string(),
        z.object({
          controllers: z.record(
            z.string(),
            z.record(z.string(), z.object({ enabled: z.boolean() })),
          ),
        }),
      ),
    }),
  });

function getEnabledActions(permissions: RolePermissions): string[] {
  const enabledActions: string[] = [];
  for (const [scope, group] of Object.entries(permissions)) {
    for (const [controller, actions] of Object.entries(group.controllers)) {
      for (const [action, setting] of Object.entries(actions)) {
        if (setting.enabled) {
          enabledActions.push(`${scope}.${controller}.${action}`);
        }
      }
    }
  }
  return enabledActions;
}

describe('Strapi Users & Permissions', (suiteContext: SuiteContext): void => {
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

  describe('/api/auth/local', (): void => {
    describe('POST', (): void => {
      describe('200', (): void => {
        test('allows local login without a token', async (testContext: TestContext): Promise<void> => {
          // given
          const user: E2ETestApplicationUser =
            await manager.registerUser(testContext);

          // when
          const response: Response = await fetch(
            `${manager.strapiUrl}/api/auth/local`,
            {
              method: 'POST',
              headers: new Headers([['Content-Type', 'application/json']]),
              body: JSON.stringify({
                identifier: user.username,
                password: user.password,
              }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          z.object({ jwt: z.string().min(1) }).parse(await response.json());
        });
      });
    });

    describe('/register', (): void => {
      describe('POST', (): void => {
        describe('403', (): void => {
          test('rejects public registration', async (testContext: TestContext): Promise<void> => {
            // given
            const username: string = `e2e-${randomUUID()}`;

            // when
            const response: Response = await fetch(
              `${manager.strapiUrl}/api/auth/local/register`,
              {
                method: 'POST',
                headers: new Headers([['Content-Type', 'application/json']]),
                body: JSON.stringify({
                  username,
                  email: `${username}@example.test`,
                  password: randomUUID(),
                }),
                signal: testContext.signal,
              },
            );

            // then
            assert.equal(response.status, 403);
          });
        });
      });
    });
  });

  describe('/api/users/me', (): void => {
    describe('GET', (): void => {
      describe('200', (): void => {
        test('returns the authenticated user', async (testContext: TestContext): Promise<void> => {
          // given
          const user: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            user.username,
            user.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.strapiUrl}/api/users/me`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const identity: { documentId: string; username: string } = z
            .object({ documentId: z.string(), username: z.string() })
            .parse(await response.json());
          assert.deepEqual(identity, {
            documentId: user.documentId,
            username: user.username,
          });
        });
      });

      describe('403', (): void => {
        test('rejects anonymous access to the current user', async (testContext: TestContext): Promise<void> => {
          // when
          const response: Response = await fetch(
            `${manager.strapiUrl}/api/users/me`,
            {
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 403);
        });
      });
    });
  });

  describe('/api/auth/change-password', (): void => {
    describe('POST', (): void => {
      describe('403', (): void => {
        test('rejects password changes by authenticated users', async (testContext: TestContext): Promise<void> => {
          // given
          const user: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            user.username,
            user.password,
            testContext,
          );
          const password: string = randomUUID();

          // when
          const response: Response = await fetch(
            `${manager.strapiUrl}/api/auth/change-password`,
            {
              method: 'POST',
              headers: new Headers([
                ['Authorization', `Bearer ${login.jwt}`],
                ['Content-Type', 'application/json'],
              ]),
              body: JSON.stringify({
                currentPassword: user.password,
                password,
                passwordConfirmation: password,
              }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 403);
        });
      });
    });
  });

  describe('/api/connect/google', (): void => {
    describe('GET', (): void => {
      describe('403', (): void => {
        test('rejects starting a provider login', async (testContext: TestContext): Promise<void> => {
          // when
          const response: Response = await fetch(
            `${manager.strapiUrl}/api/connect/google`,
            {
              redirect: 'manual',
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 403);
        });
      });
    });
  });

  describe('/api/auth/forgot-password', (): void => {
    describe('POST', (): void => {
      describe('403', (): void => {
        test('rejects password recovery requests', async (testContext: TestContext): Promise<void> => {
          // when
          const response: Response = await fetch(
            `${manager.strapiUrl}/api/auth/forgot-password`,
            {
              method: 'POST',
              headers: new Headers([['Content-Type', 'application/json']]),
              body: JSON.stringify({ email: `${randomUUID()}@example.test` }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 403);
        });
      });
    });
  });

  describe('/api/auth/reset-password', (): void => {
    describe('POST', (): void => {
      describe('403', (): void => {
        test('rejects password resets', async (testContext: TestContext): Promise<void> => {
          // given
          const password: string = randomUUID();

          // when
          const response: Response = await fetch(
            `${manager.strapiUrl}/api/auth/reset-password`,
            {
              method: 'POST',
              headers: new Headers([['Content-Type', 'application/json']]),
              body: JSON.stringify({
                code: randomUUID(),
                password,
                passwordConfirmation: password,
              }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 403);
        });
      });
    });
  });

  describe('/api/auth/email-confirmation', (): void => {
    describe('GET', (): void => {
      describe('403', (): void => {
        test('rejects email confirmation', async (testContext: TestContext): Promise<void> => {
          // when
          const response: Response = await fetch(
            `${manager.strapiUrl}/api/auth/email-confirmation?confirmation=${randomUUID()}`,
            {
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 403);
        });
      });
    });
  });

  describe('/api/auth/send-email-confirmation', (): void => {
    describe('POST', (): void => {
      describe('403', (): void => {
        test('rejects requests to send a confirmation email', async (testContext: TestContext): Promise<void> => {
          // when
          const response: Response = await fetch(
            `${manager.strapiUrl}/api/auth/send-email-confirmation`,
            {
              method: 'POST',
              headers: new Headers([['Content-Type', 'application/json']]),
              body: JSON.stringify({ email: `${randomUUID()}@example.test` }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 403);
        });
      });
    });
  });

  describe('/api/auth/refresh', (): void => {
    describe('POST', (): void => {
      describe('403', (): void => {
        test('rejects token refresh requests', async (testContext: TestContext): Promise<void> => {
          // when
          const response: Response = await fetch(
            `${manager.strapiUrl}/api/auth/refresh`,
            {
              method: 'POST',
              headers: new Headers([['Content-Type', 'application/json']]),
              body: JSON.stringify({ refreshToken: randomUUID() }),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 403);
        });
      });
    });
  });

  describe('/api/auth/logout', (): void => {
    describe('POST', (): void => {
      describe('403', (): void => {
        test('rejects logout requests by authenticated users', async (testContext: TestContext): Promise<void> => {
          // given
          const user: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            user.username,
            user.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.strapiUrl}/api/auth/logout`,
            {
              method: 'POST',
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 403);
        });
      });
    });
  });

  describe('/api/auth/sessions', (): void => {
    describe('GET', (): void => {
      describe('403', (): void => {
        test('rejects listing sessions for authenticated users', async (testContext: TestContext): Promise<void> => {
          // given
          const user: E2ETestApplicationUser =
            await manager.registerUser(testContext);
          const login: PostAuthResponseBodyDto = await manager.loginUser(
            user.username,
            user.password,
            testContext,
          );

          // when
          const response: Response = await fetch(
            `${manager.strapiUrl}/api/auth/sessions`,
            {
              headers: new Headers([['Authorization', `Bearer ${login.jwt}`]]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 403);
        });
      });
    });

    describe('/:sessionId', (): void => {
      describe('DELETE', (): void => {
        describe('403', (): void => {
          test('rejects session revocation by authenticated users', async (testContext: TestContext): Promise<void> => {
            // given
            const user: E2ETestApplicationUser =
              await manager.registerUser(testContext);
            const login: PostAuthResponseBodyDto = await manager.loginUser(
              user.username,
              user.password,
              testContext,
            );

            // when
            const response: Response = await fetch(
              `${manager.strapiUrl}/api/auth/sessions/${randomUUID()}`,
              {
                method: 'DELETE',
                headers: new Headers([
                  ['Authorization', `Bearer ${login.jwt}`],
                ]),
                signal: testContext.signal,
              },
            );

            // then
            assert.equal(response.status, 403);
          });
        });
      });
    });
  });

  describe('/users-permissions/roles/:id', (): void => {
    describe('GET', (): void => {
      describe('200', (): void => {
        test('grants Public only the auth callback permission', async (testContext: TestContext): Promise<void> => {
          // given
          const headers: Headers = new Headers([
            ['Authorization', `Bearer ${manager.context.admin.token}`],
          ]);
          const rolesUrl: string = `${manager.strapiUrl}/users-permissions/roles`;
          const rolesResponse: Response = await fetch(rolesUrl, {
            headers,
            signal: testContext.signal,
          });
          assert.equal(rolesResponse.status, 200);
          const roles: { id: number; type: string }[] = z
            .object({
              roles: z.array(z.object({ id: z.number(), type: z.string() })),
            })
            .parse(await rolesResponse.json()).roles;
          const publicRole: { id: number; type: string } | undefined =
            roles.find(
              (role: { id: number; type: string }): boolean =>
                role.type === 'public',
            );
          assert.ok(publicRole, 'Missing Public role');

          // when
          const response: Response = await fetch(
            `${rolesUrl}/${publicRole.id.toString()}`,
            {
              headers,
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const permissions: RolePermissions = roleSchema.parse(
            await response.json(),
          ).role.permissions;
          assert.deepEqual(getEnabledActions(permissions), [
            'plugin::users-permissions.auth.callback',
          ]);
        });

        test('grants Authenticated only the current-user permission', async (testContext: TestContext): Promise<void> => {
          // given
          const roleId: number = manager.context.authenticatedRoleId;

          // when
          const response: Response = await fetch(
            `${manager.strapiUrl}/users-permissions/roles/${roleId.toString()}`,
            {
              headers: new Headers([
                ['Authorization', `Bearer ${manager.context.admin.token}`],
              ]),
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          const permissions: RolePermissions = roleSchema.parse(
            await response.json(),
          ).role.permissions;
          assert.deepEqual(getEnabledActions(permissions), [
            'plugin::users-permissions.user.me',
          ]);
        });
      });
    });
  });
});
