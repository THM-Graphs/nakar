import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AuthenticatedCanvasUser } from './AuthenticatedCanvasUser';

import { MockStorageDelegate } from '../testing/MockStorageDelegate.test';

void describe('AuthenticatedCanvasUser', (): void => {
  void describe('canEditProject', (): void => {
    void it('checks owner', (): void => {
      assert.equal(
        new AuthenticatedCanvasUser(
          TestHarness.user('owner').toData(),
        ).canEditProject(new MockStorageDelegate().room),
        true,
      );
    });
    void it('checks collaborator', (): void => {
      assert.equal(
        new AuthenticatedCanvasUser(
          TestHarness.user('collaborator').toData(),
        ).canEditProject(new MockStorageDelegate().room),
        true,
      );
    });
    void it('checks unrelated', (): void => {
      assert.equal(
        new AuthenticatedCanvasUser(
          TestHarness.user('unrelated').toData(),
        ).canEditProject(new MockStorageDelegate().room),
        false,
      );
    });
    void it('checks a missing identity', (): void => {
      assert.equal(
        new AuthenticatedCanvasUser(
          TestHarness.user(null).toData(),
        ).canEditProject(new MockStorageDelegate().room),
        false,
      );
    });
  });
});
