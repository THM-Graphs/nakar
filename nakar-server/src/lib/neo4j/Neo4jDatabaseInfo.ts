import { Result } from '@strapi/types/dist/modules/documents/result';

export class Neo4jDatabaseInfo {
  public readonly url: string;
  public readonly username: string;
  public readonly password: string;
  public readonly database: string | null;
  public readonly nakarId: string;

  public constructor(data: {
    url: string;
    username: string;
    password: string;
    database: string | null;
    nakarId: string;
  }) {
    this.url = data.url;
    this.username = data.username;
    this.password = data.password;
    this.database = data.database;
    this.nakarId = data.nakarId;
  }

  public static parse(
    database: Result<'api::database-connection.database-connection'>,
  ): Neo4jDatabaseInfo {
    if (database.connectionUrl == null) {
      throw new Error('db url not found');
    }
    if (database.username == null) {
      throw new Error('db username not found');
    }
    if (database.password == null) {
      throw new Error('db password not found');
    }

    return new Neo4jDatabaseInfo({
      url: database.connectionUrl,
      username: database.username,
      password: database.password,
      database: database.database ?? null,
      nakarId: database.documentId,
    });
  }
}
