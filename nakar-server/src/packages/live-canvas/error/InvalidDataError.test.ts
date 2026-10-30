import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CanvasError } from './CanvasError';
import { InvalidDataError } from './InvalidDataError';

void describe('InvalidDataError', (): void => {
  void describe('constructor', (): void => {
    void it('preserves the message and exposes its concrete type and stable code', (): void => {
      const error: InvalidDataError = new InvalidDataError('message');
      assert.equal(error.message, 'message');
      assert.equal(error.code, 'invalid-data');
      assert.equal(error.name, 'InvalidDataError');
      assert.ok(error instanceof InvalidDataError);
      assert.ok(error instanceof CanvasError);
      assert.ok(error instanceof Error);
    });
  });
});
