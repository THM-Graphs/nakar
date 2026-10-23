import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CanvasLimitEvent } from './CanvasLimitEvent';

void describe('CanvasLimitEvent', (): void => {
  void describe('constructor', (): void => {
    void it('retains the canvas identity, event type and payload', (): void => {
      const event: CanvasLimitEvent = new CanvasLimitEvent('canvas', 10);
      assert.equal(event.canvasId, 'canvas');
      assert.equal(event.type, 'limit');
      assert.equal(event.loadedCount, 10);
    });
  });
});
