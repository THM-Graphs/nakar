import type { E2ETestApplicationContext } from './E2ETestApplicationContext';
import type { E2ETestApplicationUser } from './E2ETestApplicationUser';
import type { E2ETestApplicationAdmin } from './E2ETestApplicationAdmin';

export class E2ETestApplicationContextWithData {
  public constructor(
    public readonly primaryUser: E2ETestApplicationUser,
    public readonly secondaryUser: E2ETestApplicationUser,
    public readonly admin: E2ETestApplicationAdmin,
    public readonly applicationContext: E2ETestApplicationContext,
  ) {}
}
