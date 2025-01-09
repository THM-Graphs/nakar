import { SchemaGetInitialGraph } from '../../../../../src-gen/schema';
import { GraphDisplayConfiguration } from '../../types/GraphDisplayConfiguration';
import { Transformer } from '../../types/Transformer';
import { createNodeDisplayConfigurationContextFromNode } from '../createNodeDisplayConfigurationContextFromNode';
import { applyNodeDisplayConfigurationContextToTemplate } from '../applyNodeDisplayConfigurationContextToTemplate';

export function applyNodeBackgroundColor(): Transformer {
  return (
    graph: SchemaGetInitialGraph,
    config: GraphDisplayConfiguration,
  ): SchemaGetInitialGraph => {
    for (const nodeConfig of config.nodeDisplayConfigurations) {
      if (nodeConfig.targetLabel === null) {
        continue;
      }
      if (nodeConfig.backgroundColor === null) {
        continue;
      }
      for (const node of graph.graph.nodes) {
        if (node.labels.length === 0) {
          continue;
        }
        for (const label of node.labels) {
          if (label.label !== nodeConfig.targetLabel) {
            continue;
          }
          const data = createNodeDisplayConfigurationContextFromNode(node);
          const newValue = applyNodeDisplayConfigurationContextToTemplate(
            data,
            nodeConfig.backgroundColor,
          );
          if (newValue.trim().length === 0) {
            continue;
          }
          label.color = {
            type: 'CustomColor',
            backgroundColor: newValue,
            textColor: '#000000',
          };
        }
      }
    }

    return graph;
  };
}
