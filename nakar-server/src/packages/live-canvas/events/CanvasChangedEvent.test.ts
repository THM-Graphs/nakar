import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CanvasChangedEvent } from './CanvasChangedEvent';

void describe('CanvasChangedEvent', (): void => {
  void describe('constructor', (): void => {
    void it('retains the canvas identity, event type and payload', (): void => {
      const event: CanvasChangedEvent = new CanvasChangedEvent('canvas', [
        'graph',
      ]);
      assert.equal(event.canvasId, 'canvas');
      assert.equal(event.type, 'changed');
      assert.deepEqual(event.changes, ['graph']);
    });
  });
});
