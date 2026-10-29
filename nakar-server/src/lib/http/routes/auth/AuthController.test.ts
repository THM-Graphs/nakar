import assert from 'node:assert/strict';
import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';
import type { PostAuthResponseBodyDto } from './dto/PostAuthResponseBodyDto';
import type { E2ETestApplicationContextWithData } from '../../../../e2e/E2ETestApplicationContextWithData';
import { E2ETestManager } from '../../../../e2e/E2ETestManager';

void describe('/auth', (): void => {
  void describe('post', (): void => {
    void it('201: login user', async (testContext: TestContext): Promise<void> => {
      const context: E2ETestApplicationContextWithData =
        await E2ETestManager.createAppAndData(testContext);
      const authUrl: string = `${context.applicationContext.apiUrl}/auth`;
      const response: Response = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: context.username,
          password: context.password,
        }),
        signal: testContext.signal,
      });
      assert.equal(response.status, 201);
      const body: PostAuthResponseBodyDto = await response.json();
      assert.equal(body.username, context.username);

      // Verify that the returned token authenticates against the real application.
      const authenticated: Response = await fetch(authUrl, {
        headers: { Authorization: `Bearer ${body.jwt}` },
        signal: testContext.signal,
      });
      assert.equal(authenticated.status, 200);
      assert.deepEqual(await authenticated.json(), {
        username: context.username,
      });
    });

    void it('401: wrong password', async (testContext: TestContext): Promise<void> => {
      const context: E2ETestApplicationContextWithData =
        await E2ETestManager.createAppAndData(testContext);
      const authUrl: string = `${context.applicationContext.apiUrl}/auth`;
      const response: Response = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: context.username,
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
  });
});
