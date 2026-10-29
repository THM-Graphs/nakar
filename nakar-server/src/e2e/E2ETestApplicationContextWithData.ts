import type { E2ETestApplicationContext } from './E2ETestApplicationContext';

export class E2ETestApplicationContextWithData {
  public constructor(
    public readonly username: string,
    public readonly password: string,
    public readonly applicationContext: E2ETestApplicationContext,
  ) {}
}
