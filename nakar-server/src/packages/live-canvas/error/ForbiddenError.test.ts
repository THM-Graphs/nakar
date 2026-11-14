import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CanvasError } from './CanvasError';
import { ForbiddenError } from './ForbiddenError';

void describe('ForbiddenError', (): void => {
  void describe('constructor', (): void => {
    void it('preserves the message and exposes its concrete type and stable code', (): void => {
      const error: ForbiddenError = new ForbiddenError('message');
      assert.equal(error.message, 'message');
      assert.equal(error.code, 'forbidden');
      assert.equal(error.name, 'ForbiddenError');
      assert.ok(error instanceof ForbiddenError);
      assert.ok(error instanceof CanvasError);
      assert.ok(error instanceof Error);
    });
  });
});
