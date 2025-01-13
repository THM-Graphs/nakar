import { SchemaGetInitialGraph } from '../../../../../src-gen/schema';
import { Transformer } from '../../types/Transformer';

export function applyNodeDegrees(): Transformer {
  return (graph: SchemaGetInitialGraph): SchemaGetInitialGraph => {
    return {
      ...graph,
      graph: {
        ...graph.graph,
        nodes: graph.graph.nodes.map((node) => {
          const outRels = graph.graph.edges.filter(
            (e) => e.startNodeId === node.id,
          );
          const inRels = graph.graph.edges.filter(
            (e) => e.endNodeId === node.id,
          );

          return {
            ...node,
            inDegree: inRels.length,
            outDegree: outRels.length,
            degree: inRels.length + outRels.length,
          };
        }),
      },
    };
  };
}
