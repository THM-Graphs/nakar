import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Encryption } from './Encryption';
import { EncryptedPayload } from './EncryptedPayload';
import { NoKeysConfiguredError } from './errors/NoKeysConfiguredError';
import { InvalidKeyLengthError } from './errors/InvalidKeyLengthError';
import { UnknownKeyIdError } from './errors/UnknownKeyIdError';

void describe('Encryption', (): void => {
  void describe('constructor', (): void => {
    void it('creates instance when config has a valid key that matches currentKeyId', (): void => {
      const service: Encryption = new Encryption({
        currentKeyId: 'key1',
        keys: [
          {
            id: 'key1',
            secret: 'V/dRbrjCVL5awGenc0goXCa4KR0xcvKUPZXdhQiyClQ=',
          },
        ],
      });

      assert.ok(service instanceof Encryption);
    });

    void it('throws NoKeysConfiguredError when keys array is empty', (): void => {
      assert.throws((): void => {
        new Encryption({ currentKeyId: 'key1', keys: [] });
      }, NoKeysConfiguredError);
    });

    void it('throws InvalidKeyLengthError when a key secret is not 32 bytes after base64 decode', (): void => {
      assert.throws((): void => {
        new Encryption({
          currentKeyId: 'key1',
          keys: [{ id: 'key1', secret: 'short' }],
        });
      }, InvalidKeyLengthError);
    });

    void it('throws UnknownKeyIdError when currentKeyId does not match any key id', (): void => {
      assert.throws((): void => {
        new Encryption({
          currentKeyId: 'nonexistent',
          keys: [
            {
              id: 'key1',
              secret: 'V/dRbrjCVL5awGenc0goXCa4KR0xcvKUPZXdhQiyClQ=',
            },
          ],
        });
      }, UnknownKeyIdError);
    });
  });

  void describe('encrypt', (): void => {
    void it('returns an EncryptedPayload with keyId, iv, authTag, and ciphertext for valid plaintext', (): void => {
      const service: Encryption = new Encryption({
        currentKeyId: 'key1',
        keys: [
          {
            id: 'key1',
            secret: 'V/dRbrjCVL5awGenc0goXCa4KR0xcvKUPZXdhQiyClQ=',
          },
        ],
      });

      const payload: EncryptedPayload = service.encrypt('Hello World');

      assert.strictEqual(payload.keyId, 'key1');
      assert.strictEqual(typeof payload.iv, 'string');
      assert.ok(payload.iv.length > 0);
      assert.strictEqual(typeof payload.authTag, 'string');
      assert.ok(payload.authTag.length > 0);
      assert.strictEqual(typeof payload.ciphertext, 'string');
      assert.ok(payload.ciphertext.length > 0);
    });
  });

  void describe('decrypt', (): void => {
    void it('returns original plaintext for a payload that was encrypted by this service', (): void => {
      const service: Encryption = new Encryption({
        currentKeyId: 'key1',
        keys: [
          {
            id: 'key1',
            secret: 'V/dRbrjCVL5awGenc0goXCa4KR0xcvKUPZXdhQiyClQ=',
          },
        ],
      });

      const payload: EncryptedPayload = service.encrypt('Hello World');
      const plainText: string = service.decrypt(payload);

      assert.strictEqual(plainText, 'Hello World');
    });

    void it('throws UnknownKeyIdError when payload.keyId does not match any stored key', (): void => {
      const service: Encryption = new Encryption({
        currentKeyId: 'key1',
        keys: [
          {
            id: 'key1',
            secret: 'V/dRbrjCVL5awGenc0goXCa4KR0xcvKUPZXdhQiyClQ=',
          },
        ],
      });

      assert.throws((): void => {
        service.decrypt({
          keyId: 'nonexistent',
          iv: 'AAAAAAAAAAAAAAAAAAAAAA==',
          authTag: 'AAAAAAAAAAAAAAAAAAAAAA==',
          ciphertext: 'AAAAAAAAAAAAAAAAAAAAAA==',
        });
      }, UnknownKeyIdError);
    });

    void it('throws when the auth tag has been tampered with (GCM integrity check fails)', (): void => {
      const service: Encryption = new Encryption({
        currentKeyId: 'key1',
        keys: [
          {
            id: 'key1',
            secret: 'V/dRbrjCVL5awGenc0goXCa4KR0xcvKUPZXdhQiyClQ=',
          },
        ],
      });

      const payload: EncryptedPayload = service.encrypt('Hello World');
      const corrupted: EncryptedPayload = {
        ...payload,
        authTag: 'AAAAAAAAAAAAAAAAAAAAAA==',
      };

      assert.throws((): void => {
        service.decrypt(corrupted);
      }, Error);
    });

    void it('decrypts old payload after rotating currentKeyId to a newer key', (): void => {
      const oldService: Encryption = new Encryption({
        currentKeyId: 'key1',
        keys: [
          {
            id: 'key1',
            secret: 'V/dRbrjCVL5awGenc0goXCa4KR0xcvKUPZXdhQiyClQ=',
          },
          {
            id: 'key2',
            secret: 'ZyoXJKWlLtYvO9m28IfdABmTyRovn+MjHGr8H7Pb/F0=',
          },
        ],
      });

      const payload: EncryptedPayload = oldService.encrypt('Hello World');

      const rotatedService: Encryption = new Encryption({
        currentKeyId: 'key2',
        keys: [
          {
            id: 'key1',
            secret: 'V/dRbrjCVL5awGenc0goXCa4KR0xcvKUPZXdhQiyClQ=',
          },
          {
            id: 'key2',
            secret: 'ZyoXJKWlLtYvO9m28IfdABmTyRovn+MjHGr8H7Pb/F0=',
          },
        ],
      });

      assert.strictEqual(rotatedService.decrypt(payload), 'Hello World');
    });
  });
});
