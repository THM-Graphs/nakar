import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CanvasErrorEvent } from './CanvasErrorEvent';

void describe('CanvasErrorEvent', (): void => {
  void describe('constructor', (): void => {
    void it('retains the canvas identity, event type and payload', (): void => {
      const event: CanvasErrorEvent = new CanvasErrorEvent(
        'canvas',
        new Error('test'),
      );
      assert.equal(event.canvasId, 'canvas');
      assert.equal(event.type, 'error');
      assert.ok(event.error instanceof Error);
      assert.equal(event.error.message, 'test');
    });
  });
});
