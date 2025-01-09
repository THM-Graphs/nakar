import { SchemaGetInitialGraph } from '../../../../../src-gen/schema';
import { GraphDisplayConfiguration } from '../../types/GraphDisplayConfiguration';
import { Transformer } from '../../types/Transformer';
import { createNodeDisplayConfigurationContextFromNode } from '../createNodeDisplayConfigurationContextFromNode';
import { applyNodeDisplayConfigurationContextToTemplate } from '../applyNodeDisplayConfigurationContextToTemplate';

export function applyNodeRadius(): Transformer {
  return (
    graph: SchemaGetInitialGraph,
    config: GraphDisplayConfiguration,
  ): SchemaGetInitialGraph => {
    for (const nodeConfig of config.nodeDisplayConfigurations) {
      if (nodeConfig.targetLabel === null) {
        continue;
      }
      if (nodeConfig.radius === null) {
        continue;
      }
      for (const node of graph.graph.nodes) {
        for (const label of node.labels) {
          if (label.label !== nodeConfig.targetLabel) {
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
            console.warn(
              `Unable to parse node radius config: ${nodeConfig.radius} for label ${nodeConfig.targetLabel}`,
            );
            continue;
          }
          node.radius = newRadius;
        }
      }
    }

    return graph;
  };
}
