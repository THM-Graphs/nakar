export interface SanitizedConfig {
  publicUrl: string;
  allowedOrigins: string[];
  strapiPort: number;
  apiPort: number;
  host: string;
  version: string;
  encryptionKeysPath: string;
}
