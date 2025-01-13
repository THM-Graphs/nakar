import {
  SchemaGetInitialGraph,
  SchemaNode,
} from '../../../../../src-gen/schema';
import { GraphDisplayConfiguration } from '../../types/GraphDisplayConfiguration';
import { Transformer } from '../../types/Transformer';
import { createNodeDisplayConfigurationContextFromNode } from '../createNodeDisplayConfigurationContextFromNode';
import { applyNodeDisplayConfigurationContextToTemplate } from '../applyNodeDisplayConfigurationContextToTemplate';

export function applyNodeDisplayText(): Transformer {
  return (
    graph: SchemaGetInitialGraph,
    config: GraphDisplayConfiguration,
  ): SchemaGetInitialGraph => {
    return {
      ...graph,
      graph: {
        ...graph.graph,
        nodes: graph.graph.nodes.map(
          (node: SchemaNode): SchemaNode => ({
            ...node,
            displayTitle: getNodeDisplayText(node, config) ?? node.displayTitle,
          }),
        ),
      },
    };
  };
}

function getNodeDisplayText(
  node: SchemaNode,
  config: GraphDisplayConfiguration,
): string | null {
  for (const nodeConfig of config.nodeDisplayConfigurations) {
    if (nodeConfig.targetLabel === null) {
      continue;
    }
    if (nodeConfig.displayText === null) {
      continue;
    }
    for (const label of node.labels) {
      if (label !== nodeConfig.targetLabel) {
        continue;
      }
      const data = createNodeDisplayConfigurationContextFromNode(node);
      const newValue = applyNodeDisplayConfigurationContextToTemplate(
        data,
        nodeConfig.displayText,
      );
      if (newValue.trim().length === 0) {
        continue;
      }
      return newValue;
    }
  }

  return null;
}
