import { SchemaGetInitialGraph } from '../../../../../src-gen/schema';
import { Transformer } from '../../types/Transformer';

export function applyNodeDegrees(): Transformer {
  return (graph: SchemaGetInitialGraph): SchemaGetInitialGraph => {
    for (const node of graph.graph.nodes) {
      const outRels = graph.graph.edges.filter(
        (e) => e.startNodeId === node.id,
      );
      const inRels = graph.graph.edges.filter((e) => e.endNodeId === node.id);
      node.inDegree = inRels.length;
      node.outDegree = outRels.length;
      node.degree = node.inDegree + node.outDegree;
    }

    return graph;
  };
}
