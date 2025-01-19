import { DBDatabase } from '../documents/DBDatabase';

export class Neo4jLoginCredentials {
  public readonly url: string;
  public readonly username: string;
  public readonly password: string;

  public constructor(data: {
    url: string;
    username: string;
    password: string;
  }) {
    this.url = data.url;
    this.username = data.username;
    this.password = data.password;
  }

  public static parse(database: DBDatabase): Neo4jLoginCredentials {
    if (database.url == null) {
      throw new Error('db url not found');
    }
    if (database.username == null) {
      throw new Error('db username not found');
    }
    if (database.password == null) {
      throw new Error('db password not found');
    }

    return new Neo4jLoginCredentials({
      url: database.url,
      username: database.username,
      password: database.password,
    });
  }
}
