import { SMap } from '../tools/Map';
import type { GetDatabaseDBDTO } from '../database/dto/GetDatabaseDBDTO';
import { DatabaseService } from '../database/DatabaseService';

export class DatabaseReferenceCache {
  private readonly _databaseCache: SMap<string, GetDatabaseDBDTO>;

  public constructor(private readonly _database: DatabaseService) {
    this._databaseCache = new SMap();
  }

  public async getDatabase(
    databaseId: string,
  ): Promise<GetDatabaseDBDTO | null> {
    const foundDatabase: GetDatabaseDBDTO | undefined =
      this._databaseCache.get(databaseId);
    if (foundDatabase != null) {
      return foundDatabase;
    }

    const db: GetDatabaseDBDTO | null =
      await this._database.getDatabase(databaseId);
    if (db == null) {
      return null;
    }
    this._databaseCache.set(databaseId, db);
    return db;
  }
}
