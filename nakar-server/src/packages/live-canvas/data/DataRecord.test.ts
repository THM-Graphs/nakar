import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DataRecord } from './DataRecord';

void describe('DataRecord', (): void => {
  void describe('empty', (): void => {
    void it('supports arbitrary dictionary keys without changing the prototype', (): void => {
      const record: Record<string, number> = DataRecord.empty<number>();
      for (const key of ['__proto__', 'constructor']) {
        record[key] = 1;
      }
      assert.equal(Object.getPrototypeOf(record), null);
      assert.deepEqual(Object.keys(record), ['__proto__', 'constructor']);
    });
  });
});
