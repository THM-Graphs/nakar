import crypto from 'crypto';
import { KeyConfig } from './KeyConfig';
import { SMap } from '../map/Map';
import { EncryptedPayload } from './EncryptedPayload';
import { CipherCCM, DecipherCCM } from 'node:crypto';

export class EncryptionService {
  private readonly _keys: SMap<string, Buffer> = new SMap<string, Buffer>();
  private readonly _currentKeyId: string;

  public constructor(config: KeyConfig) {
    if (config.keys.length === 0) {
      throw new Error('Keine Schlüssel konfiguriert.');
    }

    this._currentKeyId = config.currentKeyId;

    for (const key of config.keys) {
      const secret: Buffer = Buffer.from(key.secret, 'base64');

      if (secret.length !== 32) {
        throw new Error(
          `Schlüssel '${key.id}' muss 32 Byte lang sein (AES-256).`,
        );
      }

      this._keys.set(key.id, secret);
    }

    if (!this._keys.has(this._currentKeyId)) {
      throw new Error(`currentKeyId '${this._currentKeyId}' existiert nicht.`);
    }
  }

  public encrypt(plainText: string): EncryptedPayload {
    const key: Buffer | null = this._keys.get(this._currentKeyId) ?? null;
    if (key == null) {
      throw new Error(`currentKeyId '${this._currentKeyId}' existiert nicht.`);
    }

    const iv: Buffer = crypto.randomBytes(12);

    const cipher: CipherCCM = crypto.createCipheriv('aes-256-gcm', key, iv);

    const ciphertext: Buffer = Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ]);

    return {
      keyId: this._currentKeyId,
      iv: iv.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
      ciphertext: ciphertext.toString('base64'),
    };
  }

  public decrypt(payload: EncryptedPayload): string {
    const key: Buffer | null = this._keys.get(payload.keyId) ?? null;
    if (key == null) {
      throw new Error(`Kein Schlüssel mit ID '${payload.keyId}' gefunden.`);
    }

    const decipher: DecipherCCM = crypto.createDecipheriv(
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
