import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CanvasLifecycleEvent } from './CanvasLifecycleEvent';

void describe('CanvasLifecycleEvent', (): void => {
  void describe('constructor', (): void => {
    void it('retains the canvas identity, event type and payload', (): void => {
      const event: CanvasLifecycleEvent = new CanvasLifecycleEvent(
        'canvas',
        'destroyed',
      );
      assert.equal(event.canvasId, 'canvas');
      assert.equal(event.type, 'lifecycle');
      assert.equal(event.action, 'destroyed');
    });
  });
});
