import { SMap } from '../../packages/map/Map';
import { DatabaseService } from '../database/DatabaseService';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';

export class DatabaseReferenceCache {
  private readonly _logger: Logger = createChildLogger(this);

  private readonly _databaseCache: SMap<
    string,
    Result<'api::database-connection.database-connection'>
  >;

  private readonly _nodeConfigurationsCache: SMap<
    string,
    Result<'api::node-configuration.node-configuration'>[]
  >;

  public constructor(private readonly _database: DatabaseService) {
    this._databaseCache = new SMap();
    this._nodeConfigurationsCache = new SMap();
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

  public async getNodeConfigurations(
    databaseId: string,
  ): Promise<Result<'api::node-configuration.node-configuration'>[]> {
    const foundNodeConfigurations:
      | Result<'api::database-connection.database-connection'>[]
      | undefined = this._nodeConfigurationsCache.get(databaseId);
    if (foundNodeConfigurations != null) {
      return foundNodeConfigurations;
    }

    const database: Result<'api::database-connection.database-connection'> | null =
      await this.getDatabase(databaseId);
    if (database == null) {
      this._logger.warn(
        `Tried to get node configuration of non-existing database connection: ${databaseId}`,
      );
    }
    const nodeConfigurations: Result<'api::node-configuration.node-configuration'>[] =
      database != null
        ? await this._database.getNodeConfigurationsOfDatabase(database)
        : [];

    this._nodeConfigurationsCache.set(databaseId, nodeConfigurations);
    return nodeConfigurations;
  }
}
