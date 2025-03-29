import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { GetDatabaseDBDTO } from '../../../database/dto/GetDatabaseDBDTO';
import { Neo4jLoginCredentials } from '../../../neo4j/Neo4jLoginCredentials';
import { LoggerService } from '../../../logger/LoggerService';

export class ParseNeo4jLoginCredentials extends ScenarioPipelineStep<Neo4jLoginCredentials> {
  private _database: GetDatabaseDBDTO;

  public constructor(
    database: GetDatabaseDBDTO,
    private readonly _logger: LoggerService,
  ) {
    super('Parse Neo4j Login Credentials');
    this._database = database;
  }

  public run(): Neo4jLoginCredentials {
    const credentials: Neo4jLoginCredentials = Neo4jLoginCredentials.parse(
      this._database,
    );
    return credentials;
  }
}
