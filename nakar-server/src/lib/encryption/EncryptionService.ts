import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import z, { ZodError } from 'zod';
import { getConfig } from '../config/getConfig';
import { Encryption } from '../../packages/encryption/Encryption';
import { KeyConfig } from '../../packages/encryption/KeyConfig';
import { createChildLogger } from '../logger/createChildLogger';
import { Logger } from '@strapi/logger';
import { encryptionKeysSchema } from './encryptionKeysSchema';
import { encryptionPayloadSchema } from './encryptionPayloadSchema';
import { EncryptedPayload } from '../../packages/encryption/EncryptedPayload';
import { match, P } from 'ts-pattern';

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
    const encryptionPayload: z.infer<typeof encryptionPayloadSchema> =
      this._encryption.encrypt(plainText);
    return JSON.stringify(encryptionPayload);
  }

  public decrypt(
    payloadString: string,
    options: { contextObjectLabel: string },
  ): string {
    try {
      const payloadJson: unknown = JSON.parse(payloadString);
      const payload: EncryptedPayload =
        encryptionPayloadSchema.parse(payloadJson);
      const plaintext: string = this._encryption.decrypt(payload);
      return plaintext;
    } catch (error: unknown) {
      return match(error)
        .with(P.instanceOf(SyntaxError), (): string => {
          // Encryption version 0. No JSON in password field.
          this._logger.warn(
            `Password of ${options.contextObjectLabel} is not encrypted.`,
          );
          return payloadString;
        })
        .with(P.instanceOf(ZodError), (): string => {
          // Encryption version 0. Password is valid json, but not an encryption payload.
          this._logger.warn(
            `Password of ${options.contextObjectLabel} could not be decrypted.`,
          );
          return payloadString;
        })
        .otherwise((): never => {
          throw error;
        });
    }
  }
}
