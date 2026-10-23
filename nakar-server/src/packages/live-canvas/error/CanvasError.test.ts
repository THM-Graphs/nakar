import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CanvasError } from './CanvasError';
import { ConflictError } from './ConflictError';

void describe('CanvasError', (): void => {
  void describe('constructor', (): void => {
    void it('preserves the shared error contract through a concrete subclass', (): void => {
      const error: CanvasError = new ConflictError('message');
      assert.equal(error.code, 'conflict');
      assert.equal(error.message, 'message');
      assert.equal(error.name, 'ConflictError');
      assert.ok(error instanceof CanvasError);
      assert.ok(error instanceof Error);
    });
  });
});
