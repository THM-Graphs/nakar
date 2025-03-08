import { MutableGraph } from '../../graph/MutableGraph';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { LoggerService } from '../../../logger/LoggerService';
import { MutableEdge } from '../../graph/MutableEdge';

export class RemoveDanglingRelationships extends ScenarioPipelineStep<void> {
  private _graph: MutableGraph;

  public constructor(
    graph: MutableGraph,
    private readonly _logger: LoggerService,
  ) {
    super('Remove Dangling Relationships');
    this._graph = graph;
  }

  public run(): void {
    this._graph.edges = this._graph.edges.filter(
      (edge: MutableEdge): boolean => {
        const isDangling: boolean =
          !this._graph.nodes.has(edge.startNodeId) ||
          !this._graph.nodes.has(edge.endNodeId);

        if (isDangling) {
          this._logger.debug(
            this,
            `Relationship ${edge.type} (${edge.startNodeId} -> ${edge.endNodeId}) is dangling and will be removed.`,
          );
        }

        return !isDangling;
      },
    );
  }
}
