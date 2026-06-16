export interface SanitizedConfig {
  publicUrl: string;
  allowedOrigins: string[];
  port: number;
  host: string;
  version: string;
  encryptionKeysPath: string;
}
