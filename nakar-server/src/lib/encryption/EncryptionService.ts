import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import z from 'zod';
import { getConfig } from '../config/getConfig';
import { Encryption } from '../../packages/encryption/Encryption';
import { KeyConfig } from '../../packages/encryption/KeyConfig';
import { createChildLogger } from '../logger/createChildLogger';
import { Logger } from '@strapi/logger';
import { encryptionKeysSchema } from './encryptionKeysSchema';
import { encryptionPayloadSchema } from './encryptionPayloadSchema';
import { EncryptedPayload } from '../../packages/encryption/EncryptedPayload';

@Injectable()
export class EncryptionService {
  private readonly _encryption: Encryption;
  private readonly _logger: Logger;

  public constructor() {
    this._logger = createChildLogger(this);

    const encryptionKeysPath: string = getConfig().encryptionKeysPath;

    this._logger.debug(`Loading encryption keys from ${encryptionKeysPath}.`);

    const raw: unknown = JSON.parse(
      readFileSync(resolve(encryptionKeysPath), 'utf8'),
    );

    const parsed: z.infer<typeof encryptionKeysSchema> =
      encryptionKeysSchema.parse(raw);

    const keyConfig: KeyConfig = {
      currentKeyId: parsed.currentKeyId,
      keys: parsed.keys,
    };

    this._encryption = new Encryption(keyConfig);
    this._logger.info(`Encryption service initialized.`);
  }

  public encrypt(plainText: string): string {
    return JSON.stringify(
      this._encryption.encrypt(plainText) satisfies z.infer<
        typeof encryptionPayloadSchema
      >,
    );
  }

  public decrypt(payloadString: string): string {
    try {
      const payloadJson: unknown = JSON.parse(payloadString);
      const payload: EncryptedPayload =
        encryptionPayloadSchema.parse(payloadJson);
      return this._encryption.decrypt(payload);
    } catch (error: unknown) {
      if (error instanceof SyntaxError) {
        // Version 0
        return payloadString;
      } else {
        throw error;
      }
    }
  }
}
