import type { E2ETestApplicationUser } from './E2ETestApplicationUser';
import type { E2ETestApplicationAdmin } from './E2ETestApplicationAdmin';

export class E2ETestApplicationContextWithData {
  public constructor(
    public readonly primaryUser: E2ETestApplicationUser,
    public readonly secondaryUser: E2ETestApplicationUser,
    public readonly admin: E2ETestApplicationAdmin,
    public readonly strapiPort: number,
    public readonly nestJsPort: number,
    public readonly websocketPort: number,
    public readonly jwtSecret: string,
  ) {}

  public get apiUrl(): string {
    return `http://127.0.0.1:${this.nestJsPort.toString()}/api`;
  }
}
