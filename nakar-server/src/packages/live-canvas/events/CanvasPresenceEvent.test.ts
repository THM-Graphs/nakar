import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CanvasPresenceEvent } from './CanvasPresenceEvent';

void describe('CanvasPresenceEvent', (): void => {
  void describe('constructor', (): void => {
    void it('retains the canvas identity, event type and payload', (): void => {
      const event: CanvasPresenceEvent = new CanvasPresenceEvent(
        'canvas',
        'joined',
        TestHarness.user().toData(),
      );
      assert.equal(event.canvasId, 'canvas');
      assert.equal(event.type, 'presence');
      assert.equal(event.action, 'joined');
      assert.deepEqual(event.user, TestHarness.user().toData());
    });
  });
});
