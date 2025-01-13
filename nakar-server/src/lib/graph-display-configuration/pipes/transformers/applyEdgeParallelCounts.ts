import {
  SchemaEdge,
  SchemaGetInitialGraph,
} from '../../../../../src-gen/schema';
import { Transformer } from '../../types/Transformer';

export function applyEdgeParallelCounts(): Transformer {
  return (graph: SchemaGetInitialGraph): SchemaGetInitialGraph => {
    const parallelCounts = new Map<string, number>();
    const parallelIndices = new Map<string, number>();

    for (const edge of graph.graph.edges) {
      if (parallelCounts.has(edge.id)) {
        continue;
      }
      const parallelEdges: SchemaEdge[] = graph.graph.edges.filter(
        (e: SchemaEdge): boolean => edgeIsParallelToOther(edge, e),
      );
      const parallelCount = parallelEdges.length;

      for (let index = 0; index < parallelEdges.length; index += 1) {
        const parallelEdge: SchemaEdge = parallelEdges[index];
        parallelCounts.set(parallelEdge.id, parallelCount);

        if (parallelEdge.isLoop) {
          parallelIndices.set(parallelEdge.id, index);
        } else {
          if (parallelCount % 2 === 0) {
            if (index % 2 === 0) {
              parallelIndices.set(parallelEdge.id, index + 1);
            } else {
              parallelIndices.set(parallelEdge.id, -index);
            }
          } else {
            if (index === 0) {
              parallelIndices.set(parallelEdge.id, 0);
            }
            if (index % 2 === 0) {
              parallelIndices.set(parallelEdge.id, index);
            } else {
              parallelIndices.set(parallelEdge.id, -(index + 1));
            }
          }

          if (
            parallelEdge.startNodeId.localeCompare(parallelEdge.endNodeId) > 0
          ) {
            parallelIndices.set(
              parallelEdge.id,
              -(parallelIndices.get(parallelEdge.id) ?? 0),
            );
          }
        }
      }
    }

    return {
      ...graph,
      graph: {
        ...graph.graph,
        edges: graph.graph.edges.map(
          (edge: SchemaEdge): SchemaEdge => ({
            ...edge,
            parallelIndex: parallelIndices.get(edge.id) ?? 0,
            parallelCount: parallelCounts.get(edge.id) ?? 0,
          }),
        ),
      },
    };
  };
}

function edgeIsParallelToOther(edge: SchemaEdge, e: SchemaEdge): boolean {
  return (
    (e.startNodeId === edge.startNodeId && e.endNodeId === edge.endNodeId) ||
    (e.startNodeId === edge.endNodeId && e.endNodeId === edge.startNodeId)
  );
}
