import { SchemaGetInitialGraph } from '../../../../../src-gen/schema';
import { Transformer } from '../../types/Transformer';

export function applyEdgeParallelCounts(): Transformer {
  return (graph: SchemaGetInitialGraph): SchemaGetInitialGraph => {
    for (const edge of graph.graph.edges) {
      if (edge.parallelCount > 0) {
        continue;
      }
      const others = graph.graph.edges.filter((e) => {
        if (
          e.startNodeId === edge.startNodeId &&
          e.endNodeId === edge.endNodeId
        ) {
          return true;
        } else if (
          e.startNodeId === edge.endNodeId &&
          e.endNodeId === edge.startNodeId
        ) {
          return true;
        } else {
          return false;
        }
      });

      others.forEach((other, index) => {
        other.parallelCount = others.length;

        if (other.isLoop) {
          other.parallelIndex = index;
        } else {
          if (other.parallelCount % 2 === 0) {
            if (index % 2 === 0) {
              other.parallelIndex = index + 1;
            } else {
              other.parallelIndex = -index;
            }
          } else {
            if (index === 0) {
              other.parallelIndex = 0;
            }
            if (index % 2 === 0) {
              other.parallelIndex = index;
            } else {
              other.parallelIndex = -(index + 1);
            }
          }

          if (other.startNodeId.localeCompare(other.endNodeId) > 0) {
            other.parallelIndex = -other.parallelIndex;
          }
        }
      });
    }

    return graph;
  };
}
