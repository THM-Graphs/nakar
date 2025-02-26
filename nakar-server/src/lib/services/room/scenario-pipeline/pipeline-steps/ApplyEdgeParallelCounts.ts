import { MutableGraph } from '../../graph/MutableGraph';
import { MutableEdge } from '../../graph/MutableEdge';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';

export class ApplyEdgeParallelCounts extends ScenarioPipelineStep<void> {
  private _graph: MutableGraph;

  public constructor(graph: MutableGraph) {
    super('Apply Edge Parallel Counts');
    this._graph = graph;
  }

  public run(): void {
    const input: MutableGraph = this._graph;

    for (const [, edge] of input.edges.entries()) {
      if (edge.parallelCount > 1) {
        continue;
      }
      const parallelEdges: [string, MutableEdge][] = input.edges
        .toArray()
        .filter(([, other]: [string, MutableEdge]): boolean =>
          edge.isParallelTo(other),
        );
      const parallelCount: number = parallelEdges.length;

      for (const [index, [, parallelEdge]] of parallelEdges.entries()) {
        parallelEdge.parallelCount = parallelCount;

        if (parallelEdge.isLoop) {
          parallelEdge.parallelIndex = index;
        } else {
          if (parallelCount % 2 === 0) {
            if (index % 2 === 0) {
              parallelEdge.parallelIndex = index + 1;
            } else {
              parallelEdge.parallelIndex = -index;
            }
          } else {
            if (index === 0) {
              parallelEdge.parallelIndex = 0;
            }
            if (index % 2 === 0) {
              parallelEdge.parallelIndex = index;
            } else {
              parallelEdge.parallelIndex = -(index + 1);
            }
          }

          if (
            parallelEdge.startNodeId.localeCompare(parallelEdge.endNodeId) > 0
          ) {
            parallelEdge.parallelIndex = -parallelEdge.parallelIndex;
          }
        }
      }
    }
  }
}
