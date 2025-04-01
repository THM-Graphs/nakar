import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { Neo4jDatabaseInfo } from '../../../neo4j/Neo4jDatabaseInfo';
import { ScenarioPipelineState } from '../ScenarioPipelineState';

export class ParseNeo4jLoginCredentials extends ScenarioPipelineStep {
  public constructor() {
    super('Parse Neo4j Login Credentials');
  }

  public run(state: ScenarioPipelineState): void {
    const credentials: Neo4jDatabaseInfo = Neo4jDatabaseInfo.parse(
      state.databaseDBDTO,
    );

    state.databaseInfo = credentials;
  }
}
