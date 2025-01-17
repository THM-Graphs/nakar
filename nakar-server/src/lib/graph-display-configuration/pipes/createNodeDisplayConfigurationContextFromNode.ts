import { SchemaNode } from '../../../../src-gen/schema';
import { NodeDisplayConfigurationContext } from '../types/NodeDisplayConfigurationContext';

export function createNodeDisplayConfigurationContextFromNode(
  node: SchemaNode,
): NodeDisplayConfigurationContext {
  return {
    id: node.id,
    label: node.labels.reduce<Record<string, true>>(
      (akku, next) => ({ ...akku, [next]: true }),
      {},
    ),
    nameInQuery: node.namesInQuery.reduce<Record<string, true>>(
      (obj, next) => ({
        ...obj,
        [next]: true,
      }),
      {},
    ),
    properties: node.properties.reduce<Record<string, unknown>>(
      (record, property) => {
        record[property.slug] = property.value;
        return record;
      },
      {},
    ),
    degree: node.degree,
    inDegree: node.inDegree,
    outDegree: node.outDegree,
  };
}
