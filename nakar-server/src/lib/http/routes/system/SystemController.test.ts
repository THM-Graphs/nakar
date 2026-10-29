import assert from 'node:assert/strict';
import type { SuiteContext, TestContext } from 'node:test';
import { after, before, describe, test } from 'node:test';
import packageInfo from '../../../../../package.json';
import { E2ETestManager } from '../../../../e2e/E2ETestManager';

describe('/system', (suiteContext: SuiteContext): void => {
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

  describe('/version', (): void => {
    describe('get', (): void => {
      test('200: version without authentication', async (testContext: TestContext): Promise<void> => {
        // when
        const response: Response = await fetch(
          `${manager.context.apiUrl}/system/version`,
          { signal: testContext.signal },
        );

        // then
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), {
          version: packageInfo.version,
        });
      });
    });
  });
});
