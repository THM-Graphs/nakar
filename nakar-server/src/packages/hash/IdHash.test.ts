import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { IdHash } from './IdHash';

void describe('IdHash', (): void => {
  void describe('create', (): void => {
    void it('creates hash value', (): void => {
      assert.deepEqual(
        IdHash.create('hallo, welt'),
        'df3a79a24020ffa9f78e9dc1e35c4ccb42aa2c1bef776c5d35ec477ae3d75841',
      );
    });

    void it('creates hash of empty value', (): void => {
      assert.deepEqual(
        IdHash.create(''),
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      );
    });
  });
});
