import { EncryptionKey } from './EncryptionKey';

export interface KeyConfig {
  currentKeyId: string;
  keys: EncryptionKey[];
}
