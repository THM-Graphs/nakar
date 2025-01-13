import { SchemaGetInitialGraph } from '../../../../../src-gen/schema';
import { Transformer } from '../../types/Transformer';
import { createNodeDisplayConfigurationContextFromNode } from '../createNodeDisplayConfigurationContextFromNode';

export function applyNodeConfigurationContext(): Transformer {
  return (graph: SchemaGetInitialGraph): SchemaGetInitialGraph => {
    return {
      ...graph,
      graph: {
        ...graph.graph,
        nodes: graph.graph.nodes.map((node) => ({
          ...node,
          displayConfigurationContext:
            createNodeDisplayConfigurationContextFromNode(node),
        })),
      },
    };
  };
}
