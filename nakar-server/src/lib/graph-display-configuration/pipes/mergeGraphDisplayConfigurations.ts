import { GraphDisplayConfiguration } from '../types/GraphDisplayConfiguration';

export function mergeGraphDisplayConfigurations(
  ...graphDisplayConfigurations: GraphDisplayConfiguration[]
): GraphDisplayConfiguration {
  return graphDisplayConfigurations.reduce<GraphDisplayConfiguration>(
    (akku, next) => ({
      connectResultNodes: next.connectResultNodes ?? akku.connectResultNodes,
      growNodesBasedOnDegree:
        next.growNodesBasedOnDegree ?? akku.growNodesBasedOnDegree,
      growNodesBasedOnDegreeFactor:
        next.growNodesBasedOnDegreeFactor ?? akku.growNodesBasedOnDegreeFactor,
      nodeDisplayConfigurations: [
        ...next.nodeDisplayConfigurations,
        ...akku.nodeDisplayConfigurations,
      ],
      compressRelationships:
        next.compressRelationships ?? akku.compressRelationships,
      compressRelationshipsWidthFactor:
        next.compressRelationshipsWidthFactor ??
        akku.compressRelationshipsWidthFactor,
      scaleType: next.scaleType ?? akku.scaleType,
    }),
    {
      connectResultNodes: null,
      growNodesBasedOnDegree: null,
      growNodesBasedOnDegreeFactor: null,
      nodeDisplayConfigurations: [],
      compressRelationships: null,
      compressRelationshipsWidthFactor: null,
      scaleType: null,
    },
  );
}
