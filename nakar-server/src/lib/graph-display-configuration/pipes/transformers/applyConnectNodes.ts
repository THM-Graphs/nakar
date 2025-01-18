import { SchemaGetInitialGraph } from '../../../../../src-gen/schema';
import { GraphDisplayConfiguration } from '../../types/GraphDisplayConfiguration';
import { loadConnectingRelationships } from '../../../neo4j/pipes/loadConnectingRelationships';
import { LoginCredentials } from '../../../neo4j/types/LoginCredentials';
import { createRelationship } from '../../../graph-transformer/pipes/createRelationship';
import { Transformer } from '../../types/Transformer';

export function applyConnectNodes(credentials: LoginCredentials): Transformer {
  return async (
    graph: SchemaGetInitialGraph,
    config: GraphDisplayConfiguration,
  ): Promise<SchemaGetInitialGraph> => {
    if (config.connectResultNodes !== true) {
      return graph;
    }

    const nodeIds = new Set<string>(graph.graph.nodes.map((n) => n.id));

    if (nodeIds.size === 0) {
      return graph;
    }

    const result = await loadConnectingRelationships(credentials, nodeIds);

    const edges = result.relationships.map(createRelationship);

    const newEdges = edges.filter(
      (edge) => graph.graph.edges.find((e) => e.id === edge.id) == null,
    );

    return {
      ...graph,
      graph: {
        ...graph.graph,
        edges: [...graph.graph.edges, ...newEdges],
      },
    };
  };
}
