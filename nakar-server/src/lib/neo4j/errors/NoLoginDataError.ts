export class NoLoginDataError extends Error {
  public constructor(field: 'url' | 'username' | 'password') {
    super(`Login for database is missing: ${field}`);
  }
}
