import { SchemaGetInitialGraph } from '../../../../../src-gen/schema';
import { GraphDisplayConfiguration } from '../../types/GraphDisplayConfiguration';
import { Transformer } from '../../types/Transformer';

export function applyGrowNodeBasedOnDegree(): Transformer {
  return (
    graph: SchemaGetInitialGraph,
    config: GraphDisplayConfiguration,
  ): SchemaGetInitialGraph => {
    if (config.growNodesBasedOnDegree !== true) {
      return graph;
    }

    const degrees = graph.graph.nodes.map((n) => n.degree);

    const growFactor = 1;
    const minConnections = Math.min(...degrees);
    const maxConnections = Math.max(...degrees);
    const delta = maxConnections - minConnections;

    if (delta === 0) {
      return graph;
    }

    for (const node of graph.graph.nodes) {
      const percent = (node.degree - minConnections) / delta;
      node.radius = node.radius * (1 + growFactor * percent);
    }

    return graph;
  };
}
