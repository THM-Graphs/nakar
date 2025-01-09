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
    }),
    {
      connectResultNodes: null,
      growNodesBasedOnDegree: null,
      nodeDisplayConfigurations: [],
    },
  );
}
