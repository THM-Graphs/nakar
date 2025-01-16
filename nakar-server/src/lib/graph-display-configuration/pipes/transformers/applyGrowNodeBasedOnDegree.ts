import {
  SchemaGetInitialGraph,
  SchemaNode,
} from '../../../../../src-gen/schema';
import { GraphDisplayConfiguration } from '../../types/GraphDisplayConfiguration';
import { Transformer } from '../../types/Transformer';
import { scaleRange } from '../../../graph-transformer/pipes/scaleRange';

export function applyGrowNodeBasedOnDegree(): Transformer {
  return (
    graph: SchemaGetInitialGraph,
    config: GraphDisplayConfiguration,
  ): SchemaGetInitialGraph => {
    if (config.growNodesBasedOnDegree !== true) {
      return graph;
    }

    const degrees: number[] = graph.graph.nodes.map(
      (n: SchemaNode): number => n.degree,
    );

    const growFactor = 1;
    const minConnections = Math.min(...degrees);
    const maxConnections = Math.max(...degrees);
    const delta = maxConnections - minConnections;

    if (delta === 0) {
      return graph;
    }

    return {
      ...graph,
      graph: {
        ...graph.graph,
        nodes: graph.graph.nodes.map(
          (node: SchemaNode): SchemaNode => ({
            ...node,
            radius: scaleRange(
              minConnections,
              maxConnections,
              node.radius,
              node.radius + node.radius * growFactor,
              node.degree,
            ),
          }),
        ),
      },
    };
  };
}
