import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CanvasError } from './CanvasError';
import { NotFoundError } from './NotFoundError';

void describe('NotFoundError', (): void => {
  void describe('constructor', (): void => {
    void it('preserves the message and exposes its concrete type and stable code', (): void => {
      const error: NotFoundError = new NotFoundError('message');
      assert.equal(error.message, 'message');
      assert.equal(error.code, 'not-found');
      assert.equal(error.name, 'NotFoundError');
      assert.ok(error instanceof NotFoundError);
      assert.ok(error instanceof CanvasError);
      assert.ok(error instanceof Error);
    });
  });
});
