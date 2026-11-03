import type { E2ETestApplicationAdmin } from './E2ETestApplicationAdmin';
import type { KeyConfig } from '../packages/encryption/KeyConfig';

export class E2ETestApplicationContext {
  public constructor(
    public readonly admin: E2ETestApplicationAdmin,
    public readonly strapiPort: number,
    public readonly nestJsPort: number,
    public readonly websocketPort: number,
    public readonly jwtSecret: string,
    public readonly encryptionKeys: KeyConfig,
  ) {}
}
