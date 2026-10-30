import z from 'zod';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { SuiteContext, TestContext } from 'node:test';
import { after, before, describe, test } from 'node:test';
import { E2ETestManager } from '../../../../e2e/E2ETestManager';

describe('/redirect', (suiteContext: SuiteContext): void => {
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

  describe('/url', (): void => {
    describe('GET', (): void => {
      describe('200', (): void => {
        test('returns null when no redirect matches', async (testContext: TestContext): Promise<void> => {
          // given
          const sourceUrl: string = `https://source.example/${randomUUID()}`;

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/redirect/url?url=${encodeURIComponent(sourceUrl)}`,
            {
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          assert.deepEqual(await response.json(), { url: null });
        });

        test('returns the published target without authentication', async (testContext: TestContext): Promise<void> => {
          // given
          const sourceUrl: string = `https://source.example/${randomUUID()}`;
          const targetUrl: string = `https://target.example/${randomUUID()}`;
          const creation: Response = await fetch(
            `${manager.strapiUrl}/content-manager/collection-types/api::redirect.redirect/actions/publish`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${manager.context.admin.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sourceUrl: sourceUrl,
                targetUrl: targetUrl,
              }),
              signal: testContext.signal,
            },
          );
          assert.equal(creation.status, 200, await creation.text());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/redirect/url?url=${encodeURIComponent(sourceUrl)}`,
            {
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          assert.deepEqual(await response.json(), { url: targetUrl });
          assert.equal(response.headers.get('location'), null);
          assert.equal(response.redirected, false);
        });

        test('does not match a different source URL', async (testContext: TestContext): Promise<void> => {
          // given
          const sourceUrl: string = `https://source.example/${randomUUID()}`;
          const creation: Response = await fetch(
            `${manager.strapiUrl}/content-manager/collection-types/api::redirect.redirect/actions/publish`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${manager.context.admin.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sourceUrl: `${sourceUrl}/other`,
                targetUrl: 'https://target.example/other',
              }),
              signal: testContext.signal,
            },
          );
          assert.equal(creation.status, 200, await creation.text());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/redirect/url?url=${encodeURIComponent(sourceUrl)}`,
            {
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          assert.deepEqual(await response.json(), { url: null });
        });

        test('preserves encoded source and target URLs', async (testContext: TestContext): Promise<void> => {
          // given
          const sourceUrl: string = `https://source.example/${randomUUID()}/ä?name=a+b&value=x%20y#section`;
          const targetUrl: string = `https://target.example/${randomUUID()}?next=%2Fpage&name=ä+b#anchor`;
          const creation: Response = await fetch(
            `${manager.strapiUrl}/content-manager/collection-types/api::redirect.redirect/actions/publish`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${manager.context.admin.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sourceUrl: sourceUrl,
                targetUrl: targetUrl,
              }),
              signal: testContext.signal,
            },
          );
          assert.equal(creation.status, 200, await creation.text());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/redirect/url?url=${encodeURIComponent(sourceUrl)}`,
            {
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          assert.deepEqual(await response.json(), { url: targetUrl });
        });

        test('returns null when the target is missing', async (testContext: TestContext): Promise<void> => {
          // given
          const sourceUrl: string = `https://source.example/${randomUUID()}`;
          const creation: Response = await fetch(
            `${manager.strapiUrl}/content-manager/collection-types/api::redirect.redirect/actions/publish`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${manager.context.admin.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ sourceUrl: sourceUrl, targetUrl: null }),
              signal: testContext.signal,
            },
          );
          assert.equal(creation.status, 200, await creation.text());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/redirect/url?url=${encodeURIComponent(sourceUrl)}`,
            {
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          assert.deepEqual(await response.json(), { url: null });
        });

        test('returns an empty target unchanged', async (testContext: TestContext): Promise<void> => {
          // given
          const sourceUrl: string = `https://source.example/${randomUUID()}`;
          const creation: Response = await fetch(
            `${manager.strapiUrl}/content-manager/collection-types/api::redirect.redirect/actions/publish`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${manager.context.admin.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ sourceUrl: sourceUrl, targetUrl: '' }),
              signal: testContext.signal,
            },
          );
          assert.equal(creation.status, 200, await creation.text());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/redirect/url?url=${encodeURIComponent(sourceUrl)}`,
            {
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          assert.deepEqual(await response.json(), { url: '' });
        });

        test('ignores unpublished redirects', async (testContext: TestContext): Promise<void> => {
          // given
          const sourceUrl: string = `https://source.example/${randomUUID()}`;
          const targetUrl: string = `https://target.example/${randomUUID()}`;
          const creation: Response = await fetch(
            `${manager.strapiUrl}/content-manager/collection-types/api::redirect.redirect`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${manager.context.admin.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sourceUrl: sourceUrl,
                targetUrl: targetUrl,
              }),
              signal: testContext.signal,
            },
          );
          assert.equal(creation.status, 201);
          z.object({ data: z.object({ publishedAt: z.null() }) }).parse(
            await creation.json(),
          );

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/redirect/url?url=${encodeURIComponent(sourceUrl)}`,
            {
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          assert.deepEqual(await response.json(), { url: null });
        });

        test('returns a configured target when multiple redirects match', async (testContext: TestContext): Promise<void> => {
          // given
          const sourceUrl: string = `https://source.example/${randomUUID()}`;
          const firstTarget: string = `https://first.example/${randomUUID()}`;
          const secondTarget: string = `https://second.example/${randomUUID()}`;
          const firstCreation: Response = await fetch(
            `${manager.strapiUrl}/content-manager/collection-types/api::redirect.redirect/actions/publish`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${manager.context.admin.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sourceUrl: sourceUrl,
                targetUrl: firstTarget,
              }),
              signal: testContext.signal,
            },
          );
          assert.equal(firstCreation.status, 200, await firstCreation.text());
          const secondCreation: Response = await fetch(
            `${manager.strapiUrl}/content-manager/collection-types/api::redirect.redirect/actions/publish`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${manager.context.admin.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sourceUrl: sourceUrl,
                targetUrl: secondTarget,
              }),
              signal: testContext.signal,
            },
          );
          assert.equal(secondCreation.status, 200, await secondCreation.text());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/redirect/url?url=${encodeURIComponent(sourceUrl)}`,
            {
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          z.strictObject({ url: z.enum([firstTarget, secondTarget]) }).parse(
            await response.json(),
          );
        });

        test('returns the immediate target without following a redirect chain', async (testContext: TestContext): Promise<void> => {
          // given
          const sourceUrl: string = `https://source.example/${randomUUID()}`;
          const targetUrl: string = `https://target.example/${randomUUID()}`;
          const firstCreation: Response = await fetch(
            `${manager.strapiUrl}/content-manager/collection-types/api::redirect.redirect/actions/publish`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${manager.context.admin.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sourceUrl: sourceUrl,
                targetUrl: targetUrl,
              }),
              signal: testContext.signal,
            },
          );
          assert.equal(firstCreation.status, 200, await firstCreation.text());
          const secondCreation: Response = await fetch(
            `${manager.strapiUrl}/content-manager/collection-types/api::redirect.redirect/actions/publish`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${manager.context.admin.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sourceUrl: targetUrl,
                targetUrl: 'https://final.example/destination',
              }),
              signal: testContext.signal,
            },
          );
          assert.equal(secondCreation.status, 200, await secondCreation.text());

          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/redirect/url?url=${encodeURIComponent(sourceUrl)}`,
            {
              signal: testContext.signal,
            },
          );

          // then
          assert.equal(response.status, 200);
          assert.deepEqual(await response.json(), { url: targetUrl });
        });
      });
      describe('400', (): void => {
        test('rejects a missing URL', async (testContext: TestContext): Promise<void> => {
          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/redirect/url`,
            { signal: testContext.signal },
          );

          // then
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: ['url must be a string'],
          });
        });
        test('rejects repeated URL parameters', async (testContext: TestContext): Promise<void> => {
          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/redirect/url?url=first&url=second`,
            { signal: testContext.signal },
          );

          // then
          assert.equal(response.status, 400);
          assert.deepEqual(await response.json(), {
            statusCode: 400,
            error: 'Bad Request',
            message: ['url must be a string'],
          });
        });
        test('rejects unknown query parameters', async (testContext: TestContext): Promise<void> => {
          // when
          const response: Response = await fetch(
            `${manager.apiUrl}/redirect/url` +
              `?url=${encodeURIComponent(`https://source.example/${randomUUID()}`)}&unexpected=true`,
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
      });
    });
  });
});
