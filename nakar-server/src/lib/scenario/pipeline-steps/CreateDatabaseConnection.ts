import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { DBDatabase } from '../../documents/collection-types/DBDatabase';
import { Neo4jDatabase } from '../../neo4j/Neo4jDatabase';
import { Neo4jLoginCredentials } from '../../neo4j/Neo4jLoginCredentials';

export class CreateDatabaseConnection extends ScenarioPipelineStep<Neo4jDatabase> {
  private _database: DBDatabase;

  public constructor(database: DBDatabase) {
    super('Create Database Connection');
    this._database = database;
  }

  public run(): Neo4jDatabase {
    const credentials: Neo4jLoginCredentials = Neo4jLoginCredentials.parse(
      this._database,
    );
    const neo4jDatabase: Neo4jDatabase = new Neo4jDatabase(credentials);
    return neo4jDatabase;
  }
}
