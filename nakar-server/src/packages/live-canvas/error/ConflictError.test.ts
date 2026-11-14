import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CanvasError } from './CanvasError';
import { ConflictError } from './ConflictError';

void describe('ConflictError', (): void => {
  void describe('constructor', (): void => {
    void it('preserves the message and exposes its concrete type and stable code', (): void => {
      const error: ConflictError = new ConflictError('message');
      assert.equal(error.message, 'message');
      assert.equal(error.code, 'conflict');
      assert.equal(error.name, 'ConflictError');
      assert.ok(error instanceof ConflictError);
      assert.ok(error instanceof CanvasError);
      assert.ok(error instanceof Error);
    });
  });
});
