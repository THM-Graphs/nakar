import {
  SchemaGraphLabel,
  SchemaGraphProperty,
  SchemaNode,
} from '../../../../src-gen/schema';
import { evaluateInitialDisplayTitle } from './evaluateInitialDisplayTitle';
import { AugmentedNode } from '../../neo4j/types/AugmentedNode';

export function createNode(node: AugmentedNode): SchemaNode {
  return {
    id: node.elementId,
    displayTitle: evaluateInitialDisplayTitle(node),
    labels: node.labels.map(
      (label): SchemaGraphLabel => ({
        label: label,
        color: { type: 'PresetColor', index: 0 },
        count: 0,
      }),
    ),
    properties: Object.entries(node.properties).map(
      (entry): SchemaGraphProperty => ({
        slug: entry[0],
        value: entry[1],
      }),
    ),
    radius: 60,
    position: {
      x: 0,
      y: 0,
    },
    inDegree: 0,
    outDegree: 0,
    degree: 0,
    nameInQuery: node.nameInQuery,
    displayConfigurationContext: {},
  };
}
