import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MD5Hash } from './MD5Hash';

void describe('MD5Hash', (): void => {
  void describe('create', (): void => {
    void it('creates hash value', (): void => {
      assert.deepEqual(
        MD5Hash.create('hallo, welt'),
        'ffa7b2e2af7675380c2a2d47be5ef612',
      );
    });

    void it('creates hash of empty value', (): void => {
      assert.deepEqual(MD5Hash.create(''), 'd41d8cd98f00b204e9800998ecf8427e');
    });
  });
});
