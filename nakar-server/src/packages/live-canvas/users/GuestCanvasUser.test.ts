import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { GuestCanvasUser } from './GuestCanvasUser';

void describe('GuestCanvasUser', (): void => {
  void describe('canEditProject', (): void => {
    void it('denies project editing', (): void => {
      assert.equal(
        new GuestCanvasUser(TestHarness.user(null).toData()).canEditProject(),
        false,
      );
    });
  });
});
