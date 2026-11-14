import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CanvasError } from './CanvasError';
import { InvalidStateError } from './InvalidStateError';

void describe('InvalidStateError', (): void => {
  void describe('constructor', (): void => {
    void it('preserves the message and exposes its concrete type and stable code', (): void => {
      const error: InvalidStateError = new InvalidStateError('message');
      assert.equal(error.message, 'message');
      assert.equal(error.code, 'invalid-state');
      assert.equal(error.name, 'InvalidStateError');
      assert.ok(error instanceof InvalidStateError);
      assert.ok(error instanceof CanvasError);
      assert.ok(error instanceof Error);
    });
  });
});
