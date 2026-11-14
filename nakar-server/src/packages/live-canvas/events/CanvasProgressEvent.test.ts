import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CanvasProgressEvent } from './CanvasProgressEvent';

void describe('CanvasProgressEvent', (): void => {
  void describe('constructor', (): void => {
    void it('retains the canvas identity, event type and payload', (): void => {
      const event: CanvasProgressEvent = new CanvasProgressEvent(
        'canvas',
        'Loading',
        1,
      );
      assert.equal(event.canvasId, 'canvas');
      assert.equal(event.type, 'progress');
      assert.equal(event.message, 'Loading');
      assert.equal(event.pending, 1);
    });
  });
});
