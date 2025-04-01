import { GetDatabaseDBDTO } from '../database/dto/GetDatabaseDBDTO';

export class Neo4jDatabaseInfo {
  public readonly url: string;
  public readonly username: string;
  public readonly password: string;
  public readonly databaseTitle: string;
  public readonly databaseId: string;

  public constructor(data: {
    url: string;
    username: string;
    password: string;
    databaseTitle: string;
    databaseId: string;
  }) {
    this.url = data.url;
    this.username = data.username;
    this.password = data.password;
    this.databaseTitle = data.databaseTitle;
    this.databaseId = data.databaseId;
  }

  public static parse(database: GetDatabaseDBDTO): Neo4jDatabaseInfo {
    if (database.url == null) {
      throw new Error('db url not found');
    }
    if (database.username == null) {
      throw new Error('db username not found');
    }
    if (database.password == null) {
      throw new Error('db password not found');
    }

    return new Neo4jDatabaseInfo({
      url: database.url,
      username: database.username,
      password: database.password,
      databaseTitle: database.title ?? '',
      databaseId: database.documentId,
    });
  }
}
