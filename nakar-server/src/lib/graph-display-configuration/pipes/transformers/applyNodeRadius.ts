import {
  SchemaGetInitialGraph,
  SchemaNode,
} from '../../../../../src-gen/schema';
import { GraphDisplayConfiguration } from '../../types/GraphDisplayConfiguration';
import { Transformer } from '../../types/Transformer';
import { createNodeDisplayConfigurationContextFromNode } from '../createNodeDisplayConfigurationContextFromNode';
import { applyNodeDisplayConfigurationContextToTemplate } from '../applyNodeDisplayConfigurationContextToTemplate';

export function applyNodeRadius(): Transformer {
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
            radius: getNodeRadius(node, config) ?? node.radius,
          }),
        ),
      },
    };
  };
}

function getNodeRadius(
  node: SchemaNode,
  config: GraphDisplayConfiguration,
): number | null {
  for (const nodeConfig of config.nodeDisplayConfigurations) {
    if (nodeConfig.targetLabel === null) {
      continue;
    }
    if (nodeConfig.radius === null) {
      continue;
    }
    for (const label of node.labels) {
      if (label !== nodeConfig.targetLabel) {
        continue;
      }
      const data = createNodeDisplayConfigurationContextFromNode(node);
      const newValue = applyNodeDisplayConfigurationContextToTemplate(
        data,
        nodeConfig.radius,
      );
      if (newValue.trim().length === 0) {
        continue;
      }
      const newRadius = parseFloat(newValue);
      if (isNaN(newRadius)) {
        strapi.log.warn(
          `Unable to parse node radius config: ${nodeConfig.radius} for label ${nodeConfig.targetLabel}`,
        );
        continue;
      }
      return newRadius;
    }
  }

  return null;
}
