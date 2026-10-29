export class E2ETestApplicationContext {
  public constructor(
    public readonly strapiPort: number,
    public readonly nestJsPort: number,
    public readonly websocketPort: number,
    public readonly jwtSecret: string,
  ) {}

  public get apiUrl(): string {
    return `http://127.0.0.1:${this.nestJsPort.toString()}/api`;
  }
}
