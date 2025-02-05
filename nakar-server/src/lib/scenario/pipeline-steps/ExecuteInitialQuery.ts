import { DBScenario } from '../../documents/collection-types/DBScenario';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { MutableGraph } from '../../graph/MutableGraph';
import { Neo4jDatabase } from '../../neo4j/Neo4jDatabase';
import { Neo4jGraphElements } from '../../neo4j/Neo4jGraphElements';

export class ExecuteInitialQuery extends ScenarioPipelineStep<MutableGraph> {
  private _query: string;
  private _database: Neo4jDatabase;
  private _scenario: DBScenario;

  public constructor(
    query: string,
    database: Neo4jDatabase,
    scenario: DBScenario,
  ) {
    super('Execute Initial Query');
    this._query = query;
    this._database = database;
    this._scenario = scenario;
  }

  public async run(): Promise<MutableGraph> {
    const graphElements: Neo4jGraphElements = await this._database.executeQuery(
      this._query,
    );
    const graph: MutableGraph = MutableGraph.create(
      graphElements,
      this._scenario,
    );
    return graph;
  }
}
