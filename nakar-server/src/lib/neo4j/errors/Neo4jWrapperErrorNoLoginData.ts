export class Neo4jWrapperErrorNoLoginData extends Error {
  public constructor(field: 'url' | 'username' | 'password') {
    super(`Login for database is missing: ${field}`);
  }
}
