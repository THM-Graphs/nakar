import { Transformer } from '../../types/Transformer';
import {
  SchemaEdge,
  SchemaGetInitialGraph,
} from '../../../../../src-gen/schema';
import { GraphDisplayConfiguration } from '../../types/GraphDisplayConfiguration';

export function compressRelationships(): Transformer {
  return (
    graph: SchemaGetInitialGraph,
    config: GraphDisplayConfiguration,
  ): SchemaGetInitialGraph => {
    if (config.compressRelationships !== true) {
      return graph;
    }

    const relationships: SchemaEdge[] = [];

    for (const startNode of graph.graph.nodes) {
      for (const endNode of graph.graph.nodes) {
        const edges = graph.graph.edges.filter(
          (e) => e.startNodeId === startNode.id && e.endNodeId === endNode.id,
        );
        const edgeTypes = new Set<string>(edges.map((e) => e.type));

        for (const edgeType of edgeTypes.values()) {
          const count = graph.graph.edges.filter(
            (e) =>
              e.startNodeId === startNode.id &&
              e.endNodeId === endNode.id &&
              e.type === edgeType,
          ).length;
          const firstEdge = edges.find((e) => e.type === edgeType);
          if (firstEdge == null) {
            // Should not happen
            console.error('Did not find edge for merging.');
            continue;
          }
          relationships.push({
            ...firstEdge,
            parallelCount: 1,
            parallelIndex: 0,
            compressedCount: count,
          });
        }
      }
    }

    return {
      ...graph,
      graph: {
        ...graph.graph,
        edges: relationships,
      },
    };
  };
}
