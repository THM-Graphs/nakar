import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Encryption } from './Encryption';
import { EncryptedPayload } from './EncryptedPayload';
import { NoKeysConfiguredError } from './errors/NoKeysConfiguredError';
import { UnknownKeyIdError } from './errors/UnknownKeyIdError';
import { EmptyKeyError } from './errors/EmptyKeyError';

void describe('Encryption', (): void => {
  void describe('constructor', (): void => {
    void it('creates instance when config has a valid key that matches currentKeyId', (): void => {
      const service: Encryption = new Encryption({
        currentKeyId: 'key1',
        keys: {
          key1: '6536d336-0401-40b4-b0bf-2f894738446d',
        },
      });

      assert.ok(service instanceof Encryption);
    });

    void it('throws NoKeysConfiguredError when keys object is empty', (): void => {
      assert.throws((): void => {
        new Encryption({ currentKeyId: 'key1', keys: {} });
      }, NoKeysConfiguredError);
    });

    void it('throws UnknownKeyIdError when currentKeyId does not match any key id', (): void => {
      assert.throws((): void => {
        new Encryption({
          currentKeyId: 'nonexistent',
          keys: {
            key1: '6e170327-c135-4f33-bac3-c4f7fffc2536',
          },
        });
      }, UnknownKeyIdError);
    });

    void it('throws EmptyKeyError when a key secret is an empty string', (): void => {
      assert.throws((): void => {
        new Encryption({
          currentKeyId: 'key1',
          keys: {
          key1: '',
        },
        });
      }, EmptyKeyError);
    });
  });

  void describe('encrypt', (): void => {
    void it('returns an EncryptedPayload with keyId, iv, authTag, and ciphertext for valid plaintext', (): void => {
      const service: Encryption = new Encryption({
        currentKeyId: 'key1',
        keys: {
          key1: 'bda10a7e-755e-4cef-95bc-bb885b64f041',
        },
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

    void it('encrypts using short key', (): void => {
      const service: Encryption = new Encryption({
        currentKeyId: 'key1',
        keys: {
          key1: 'short',
        },
      });

      const payload: EncryptedPayload = service.encrypt('Hello World');

      assert.ok(payload.ciphertext.length > 0);
      assert.strictEqual(service.decrypt(payload), 'Hello World');
    });

    void it('encrypts various characters', (): void => {
      const service: Encryption = new Encryption({
        currentKeyId: 'key1',
        keys: {
          key1: 'short',
        },
      });

      const payload: EncryptedPayload = service.encrypt(
        'ÄÖÜ23456§"$%&/()😀你好，世界！',
      );

      assert.ok(payload.ciphertext.length > 0);
      assert.strictEqual(
        service.decrypt(payload),
        'ÄÖÜ23456§"$%&/()😀你好，世界！',
      );
    });

    void it('encrypts and decrypts an empty string', (): void => {
      const service: Encryption = new Encryption({
        currentKeyId: 'key1',
        keys: {
          key1: 'bda10a7e-755e-4cef-95bc-bb885b64f041',
        },
      });

      const payload: EncryptedPayload = service.encrypt('');
      assert.strictEqual(service.decrypt(payload), '');
    });
  });

  void describe('decrypt', (): void => {
    void it('returns original plaintext for a payload that was encrypted by this service', (): void => {
      const service: Encryption = new Encryption({
        currentKeyId: 'key1',
        keys: {
          key1: 'ecc1f5b9-0051-4983-9343-1fa3654dd05b',
        },
      });

      const payload: EncryptedPayload = service.encrypt('Hello World');
      const plainText: string = service.decrypt(payload);

      assert.strictEqual(plainText, 'Hello World');
    });

    void it('returns original plaintext for a payload that was encrypted by another instance', (): void => {
      const service1: Encryption = new Encryption({
        currentKeyId: 'key1',
        keys: {
          key1: 'ecc1f5b9-0051-4983-9343-1fa3654dd05b',
        },
      });

      const payload: EncryptedPayload = service1.encrypt('Hello World');

      const service2: Encryption = new Encryption({
        currentKeyId: 'key1',
        keys: {
          key1: 'ecc1f5b9-0051-4983-9343-1fa3654dd05b',
        },
      });
      const plainText: string = service2.decrypt(payload);

      assert.strictEqual(plainText, 'Hello World');
    });

    void it('throws UnknownKeyIdError when payload.keyId does not match any stored key', (): void => {
      const service: Encryption = new Encryption({
        currentKeyId: 'key1',
        keys: {
          key1: 'bd94b613-021a-4fee-b197-891a07eec48a',
        },
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
        keys: {
          key1: 'b876c4ba-a3f7-45d0-9953-15df7074943b',
        },
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

    void it('throws when the payload contains non-base64 characters in the iv', (): void => {
      const service: Encryption = new Encryption({
        currentKeyId: 'key1',
        keys: {
          key1: 'b876c4ba-a3f7-45d0-9953-15df7074943b',
        },
      });

      assert.throws((): void => {
        service.decrypt({
          keyId: 'key1',
          iv: '!!!',
          authTag: 'AAAAAAAAAAAAAAAAAAAAAA==',
          ciphertext: 'AAAAAAAAAAAAAAAAAAAAAA==',
        });
      }, Error);
    });

    void it('decrypts old payload after rotating currentKeyId to a newer key', (): void => {
      const oldService: Encryption = new Encryption({
        currentKeyId: 'key1',
        keys: {
          key1: '164bc928-a67d-4c09-b8a7-33349eab34b9',
        },
      });

      const payload: EncryptedPayload = oldService.encrypt('Hello World');

      const rotatedService: Encryption = new Encryption({
        currentKeyId: 'key2',
        keys: {
          key1: '164bc928-a67d-4c09-b8a7-33349eab34b9',
          key2: 'd14bcdb6-84a9-42b8-9eb5-72df83e86ae5',
        },
      });

      assert.strictEqual(rotatedService.decrypt(payload), 'Hello World');
    });

    void it('encrypts with the new currentKeyId after rotation', (): void => {
      const service: Encryption = new Encryption({
        currentKeyId: 'key2',
        keys: {
          key1: '164bc928-a67d-4c09-b8a7-33349eab34b9',
          key2: 'd14bcdb6-84a9-42b8-9eb5-72df83e86ae5',
        },
      });

      const payload: EncryptedPayload = service.encrypt('Hello World');

      assert.strictEqual(payload.keyId, 'key2');
      assert.strictEqual(service.decrypt(payload), 'Hello World');
    });
  });
});
