import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CanvasRoomEvent } from './CanvasRoomEvent';

void describe('CanvasRoomEvent', (): void => {
  void describe('constructor', (): void => {
    void it('retains the canvas identity, event type and payload', (): void => {
      const event: CanvasRoomEvent = new CanvasRoomEvent('canvas', []);
      assert.equal(event.canvasId, 'canvas');
      assert.equal(event.type, 'room');
      assert.deepEqual(event.canvases, []);
    });
  });
});
