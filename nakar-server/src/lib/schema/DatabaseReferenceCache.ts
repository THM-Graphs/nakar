import { SMap } from '../map/Map';
import { DatabaseService } from '../database/DatabaseService';
import { Result } from '@strapi/types/dist/modules/documents/result';

export class DatabaseReferenceCache {
  private readonly _databaseCache: SMap<
    string,
    Result<'api::database-connection.database-connection'>
  >;

  public constructor(private readonly _database: DatabaseService) {
    this._databaseCache = new SMap();
  }

  public async getDatabase(
    databaseId: string,
  ): Promise<Result<'api::database-connection.database-connection'> | null> {
    const foundDatabase:
      | Result<'api::database-connection.database-connection'>
      | undefined = this._databaseCache.get(databaseId);
    if (foundDatabase != null) {
      return foundDatabase;
    }

    const db: Result<'api::database-connection.database-connection'> =
      await this._database.getDatabase(databaseId);

    this._databaseCache.set(databaseId, db);
    return db;
  }
}
