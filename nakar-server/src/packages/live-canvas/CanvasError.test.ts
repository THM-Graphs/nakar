import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CanvasError } from './CanvasError';

void describe('CanvasError', (): void => {
  void describe('constructor', (): void => {
    void it('provides a platform-independent domain error with a code', (): void => {
      const error: CanvasError = new CanvasError('conflict', 'message');
      assert.equal(error.code, 'conflict');
      assert.equal(error.message, 'message');
      assert.equal(error.name, 'CanvasError');
      assert.ok(error instanceof Error);
    });
  });
});
