import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { DBDatabase } from '../../../database/collection-types/DBDatabase';
import { Neo4jDatabase } from '../../../../tools/neo4j/Neo4jDatabase';
import { Neo4jLoginCredentials } from '../../../../tools/neo4j/Neo4jLoginCredentials';
import { LoggerService } from '../../../logger/LoggerService';

export class CreateDatabaseConnection extends ScenarioPipelineStep<Neo4jDatabase> {
  private _database: DBDatabase;

  public constructor(
    database: DBDatabase,
    private readonly _logger: LoggerService,
  ) {
    super('Create Database Connection');
    this._database = database;
  }

  public run(): Neo4jDatabase {
    const credentials: Neo4jLoginCredentials = Neo4jLoginCredentials.parse(
      this._database,
    );
    const neo4jDatabase: Neo4jDatabase = new Neo4jDatabase(
      credentials,
      this._logger,
    );
    return neo4jDatabase;
  }
}
