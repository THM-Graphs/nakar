import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CanvasPhysicsEvent } from './CanvasPhysicsEvent';

void describe('CanvasPhysicsEvent', (): void => {
  void describe('constructor', (): void => {
    void it('retains the canvas identity, event type and payload', (): void => {
      const event: CanvasPhysicsEvent = new CanvasPhysicsEvent(
        'canvas',
        {},
        null,
      );
      assert.equal(event.canvasId, 'canvas');
      assert.equal(event.type, 'physics');
      assert.deepEqual(event.positions, {});
      assert.equal(event.performance, null);
    });
  });
});
