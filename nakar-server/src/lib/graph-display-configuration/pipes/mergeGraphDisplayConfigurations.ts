import { GraphDisplayConfiguration } from '../types/GraphDisplayConfiguration';

export function mergeGraphDisplayConfigurations(
  ...graphDisplayConfigurations: GraphDisplayConfiguration[]
): GraphDisplayConfiguration {
  return graphDisplayConfigurations.reduce<GraphDisplayConfiguration>(
    (akku, next) => ({
      connectResultNodes: next.connectResultNodes ?? akku.connectResultNodes,
      growNodesBasedOnDegree:
        next.growNodesBasedOnDegree ?? akku.growNodesBasedOnDegree,
      nodeDisplayConfigurations: [
        ...next.nodeDisplayConfigurations,
        ...akku.nodeDisplayConfigurations,
      ],
      compressRelationships:
        next.compressRelationships ?? akku.compressRelationships,
      scaleType: next.scaleType ?? akku.scaleType,
    }),
    {
      connectResultNodes: null,
      growNodesBasedOnDegree: null,
      nodeDisplayConfigurations: [],
      compressRelationships: null,
      scaleType: null,
    },
  );
}
