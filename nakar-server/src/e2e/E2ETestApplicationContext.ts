import type { E2ETestApplicationAdmin } from './E2ETestApplicationAdmin';

export class E2ETestApplicationContext {
  public constructor(
    public readonly admin: E2ETestApplicationAdmin,
    public readonly strapiPort: number,
    public readonly nestJsPort: number,
    public readonly websocketPort: number,
    public readonly jwtSecret: string,
  ) {}
}
