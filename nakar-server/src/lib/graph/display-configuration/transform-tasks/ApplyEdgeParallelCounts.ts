import { TransformTask } from '../TransformTask';
import { MutableGraph } from '../../MutableGraph';

export class ApplyEdgeParallelCounts extends TransformTask {
  public constructor() {
    super('Apply Edge Parallel Counts');
  }

  protected run(input: MutableGraph): void {
    for (const [, edge] of input.edges.entries()) {
      if (edge.parallelCount > 1) {
        continue;
      }
      const parallelEdges = input.edges
        .toArray()
        .filter(([, other]): boolean => edge.isParallelTo(other));
      const parallelCount = parallelEdges.length;

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
