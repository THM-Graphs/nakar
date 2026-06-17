import crypto, { CipherGCM, DecipherGCM } from 'node:crypto';
import { KeyConfig } from './KeyConfig';
import { SMap } from '../map/Map';
import { EncryptedPayload } from './EncryptedPayload';
import { NoKeysConfiguredError } from './errors/NoKeysConfiguredError';
import { UnknownKeyIdError } from './errors/UnknownKeyIdError';
import { EmptyKeyError } from './errors/EmptyKeyError';
import { KeyToShortError } from './errors/KeyToShortError';

export class Encryption {
  private readonly _keys: SMap<string, Buffer> = new SMap<string, Buffer>();
  private readonly _currentKeyId: string;
  private readonly _currentKey: Buffer;

  public constructor(config: KeyConfig) {
    if (
      Object.keys(config.keys satisfies Record<string, string>).length === 0
    ) {
      throw new NoKeysConfiguredError();
    }

    this._currentKeyId = config.currentKeyId;

    for (const entry of Object.entries(
      config.keys satisfies Record<string, string>,
    )) {
      const id: string = entry[0];
      const secret: string = entry[1];
      if (secret.length === 0) {
        throw new EmptyKeyError(id);
      }
      if (secret.length < 32) {
        throw new KeyToShortError(id);
      }

      const buffer: Buffer = crypto
        .createHash('sha256')
        .update(Buffer.from(secret))
        .digest();

      this._keys.set(id, buffer);
    }

    const currentKey: Buffer | undefined = this._keys.get(this._currentKeyId);
    if (currentKey == null) {
      throw new UnknownKeyIdError(this._currentKeyId);
    }

    this._currentKey = currentKey;
  }

  public encrypt(plainText: string): EncryptedPayload {
    const iv: Buffer = crypto.randomBytes(12);

    const cipher: CipherGCM = crypto.createCipheriv(
      'aes-256-gcm',
      this._currentKey,
      iv,
    );

    const ciphertext: Buffer = Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ]);

    return {
      keyId: this._currentKeyId,
      iv: iv.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
      ciphertext: ciphertext.toString('base64'),
      version: 1,
    };
  }

  public decrypt(payload: EncryptedPayload): string {
    const key: Buffer | null = this._keys.get(payload.keyId) ?? null;
    if (key == null) {
      throw new UnknownKeyIdError(payload.keyId);
    }

    const decipher: DecipherGCM = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(payload.iv, 'base64'),
    );

    decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));

    const plainText: Buffer = Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, 'base64')),
      decipher.final(),
    ]);

    return plainText.toString('utf8');
  }
}
