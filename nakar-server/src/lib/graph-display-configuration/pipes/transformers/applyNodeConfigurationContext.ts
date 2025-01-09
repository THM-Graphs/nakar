import { SchemaGetInitialGraph } from '../../../../../src-gen/schema';
import { Transformer } from '../../types/Transformer';
import { createNodeDisplayConfigurationContextFromNode } from '../createNodeDisplayConfigurationContextFromNode';

export function applyNodeConfigurationContext(): Transformer {
  return (graph: SchemaGetInitialGraph): SchemaGetInitialGraph => {
    for (const node of graph.graph.nodes) {
      const data = createNodeDisplayConfigurationContextFromNode(node);
      node.displayConfigurationContext = data;
    }

    return graph;
  };
}
