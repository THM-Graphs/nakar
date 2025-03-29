import { GetScenarioDBDTO } from '../../../database/dto/GetScenarioDBDTO';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { MutableGraph } from '../../graph/MutableGraph';
import { Neo4jService } from '../../../neo4j/Neo4jService';
import { Neo4jGraphElements } from '../../../neo4j/Neo4jGraphElements';
import { LoggerService } from '../../../logger/LoggerService';
import { Neo4jLoginCredentials } from '../../../neo4j/Neo4jLoginCredentials';

export class ExecuteInitialQuery extends ScenarioPipelineStep<MutableGraph> {
  private _query: string;
  private _loginCredentials: Neo4jLoginCredentials;
  private _scenario: GetScenarioDBDTO;

  public constructor(
    query: string,
    loginCredentials: Neo4jLoginCredentials,
    scenario: GetScenarioDBDTO,
    private readonly _logger: LoggerService,
    private readonly _neo4j: Neo4jService,
  ) {
    super('Execute Initial Query');
    this._query = query;
    this._loginCredentials = loginCredentials;
    this._scenario = scenario;
  }

  public async run(): Promise<MutableGraph> {
    const graphElements: Neo4jGraphElements = await this._neo4j.executeQuery(
      this._loginCredentials,
      this._query,
    );
    const graph: MutableGraph = MutableGraph.create(
      graphElements,
      this._scenario,
    );
    this._logger.debug(
      this,
      `Did load ${graph.size.toString()} graph elements.`,
    );
    return graph;
  }
}
