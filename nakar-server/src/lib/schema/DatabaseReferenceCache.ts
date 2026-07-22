import { SMap } from '../../packages/map/Map';
import type { DatabaseService } from '../database/DatabaseService';
import type { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';
import type { Modules } from '@strapi/types';

export class DatabaseReferenceCache {
  private readonly _logger: Logger = createChildLogger(this);

  private readonly _databaseCache: SMap<
    string,
    Modules.Documents.Result<'api::database-connection.database-connection'>
  >;

  private readonly _nodeConfigurationsCache: SMap<
    string,
    Modules.Documents.Result<'api::node-configuration.node-configuration'>[]
  >;

  public constructor(private readonly _database: DatabaseService) {
    this._databaseCache = new SMap();
    this._nodeConfigurationsCache = new SMap();
  }

  public async getDatabase(
    databaseId: string,
  ): Promise<Modules.Documents.Result<'api::database-connection.database-connection'> | null> {
    const foundDatabase:
      | Modules.Documents.Result<'api::database-connection.database-connection'>
      | undefined = this._databaseCache.get(databaseId);
    if (foundDatabase != null) {
      return foundDatabase;
    }

    const db: Modules.Documents.Result<'api::database-connection.database-connection'> =
      await this._database.getDatabase(databaseId);

    this._databaseCache.set(databaseId, db);
    return db;
  }

  public async getNodeConfigurations(
    databaseId: string,
  ): Promise<
    Modules.Documents.Result<'api::node-configuration.node-configuration'>[]
  > {
    const foundNodeConfigurations:
      | Modules.Documents.Result<'api::node-configuration.node-configuration'>[]
      | undefined = this._nodeConfigurationsCache.get(databaseId);
    if (foundNodeConfigurations != null) {
      return foundNodeConfigurations;
    }

    const database: Modules.Documents.Result<'api::database-connection.database-connection'> | null =
      await this.getDatabase(databaseId);
    if (database == null) {
      this._logger.warn(
        `Tried to get node configuration of non-existing database connection: ${databaseId}`,
      );
    }
    const nodeConfigurations: Modules.Documents.Result<'api::node-configuration.node-configuration'>[] =
      database != null
        ? await this._database.getNodeConfigurationsOfDatabase(database)
        : [];

    this._nodeConfigurationsCache.set(databaseId, nodeConfigurations);
    return nodeConfigurations;
  }
}
