import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { Neo4jLoginCredentials } from '../../../neo4j/Neo4jLoginCredentials';
import { ScenarioPipelineState } from '../ScenarioPipelineState';

export class ParseNeo4jLoginCredentials extends ScenarioPipelineStep {
  public constructor() {
    super('Parse Neo4j Login Credentials');
  }

  public run(state: ScenarioPipelineState): void {
    const credentials: Neo4jLoginCredentials = Neo4jLoginCredentials.parse(
      state.databaseDBDTO,
    );

    state.credentials = credentials;
  }
}
