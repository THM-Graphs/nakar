import { FinalGraphDisplayConfiguration } from '../display-configuration/FinalGraphDisplayConfiguration';
import { Neo4jService } from '../../../neo4j/Neo4jService';
import { MutableEdge } from '../../graph/MutableEdge';
import { MutableGraph } from '../../graph/MutableGraph';
import { SSet } from '../../../../tools/Set';
import { Neo4jRelationship } from '../../../neo4j/Neo4jRelationship';
import { Neo4jGraphElements } from '../../../neo4j/Neo4jGraphElements';
import { SMap } from '../../../../tools/Map';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { Neo4jLoginCredentials } from '../../../neo4j/Neo4jLoginCredentials';

export class ConnectNodes extends ScenarioPipelineStep<void> {
  private _graph: MutableGraph;
  private _config: FinalGraphDisplayConfiguration;
  private _loginCredentials: Neo4jLoginCredentials;
  private _neo4j: Neo4jService;

  public constructor(
    graph: MutableGraph,
    config: FinalGraphDisplayConfiguration,
    loginCredentials: Neo4jLoginCredentials,
    neo4j: Neo4jService,
  ) {
    super('Connect Nodes');
    this._graph = graph;
    this._config = config;
    this._loginCredentials = loginCredentials;
    this._neo4j = neo4j;
  }

  public async run(): Promise<void> {
    const input: MutableGraph = this._graph;
    const config: FinalGraphDisplayConfiguration = this._config;

    if (!config.connectResultNodes) {
      return;
    }

    const nodeIds: SSet<string> = new SSet<string>(input.nodes.keys());

    if (nodeIds.size === 0) {
      return;
    }

    const result: Neo4jGraphElements =
      await this._neo4j.loadConnectingRelationships(
        this._loginCredentials,
        nodeIds,
      );

    const edges: SMap<string, MutableEdge> = result.relationships.map(
      (r: Neo4jRelationship): MutableEdge => MutableEdge.create(r),
    );

    input.addNonDuplicateEdges(edges);
  }
}
