import {
  SchemaEdge,
  SchemaGetInitialGraph,
  SchemaGraphLabel,
  SchemaGraphProperty,
  SchemaNode,
} from '../../../src-gen/schema';
import { Neo4jNode } from '../neo4j/types/Neo4jNode';
import { Neo4jProperty } from '../neo4j/types/Neo4jProperty';
import { Neo4jEdge } from '../neo4j/types/Neo4jEdge';
import { Neo4jGraph } from '../neo4j/types/Neo4jGraph';
import { Neo4jPropertyCollection } from '../neo4j/types/Neo4jPropertyCollection';

export class GraphDtoFactory {
  public static transformEdges(edges: Map<string, Neo4jEdge>): SchemaEdge[] {
    return [...edges.entries()].map(([key, value]) =>
      GraphDtoFactory.transformEdge(key, value),
    );
  }

  private static transformNodes(nodes: Map<string, Neo4jNode>): SchemaNode[] {
    return [...nodes.entries()].map(([key, value]) =>
      GraphDtoFactory.transformNode(key, value),
    );
  }

  private static transformNode(id: string, node: Neo4jNode): SchemaNode {
    return {
      id: id,
      displayTitle: id,
      labels: GraphDtoFactory.transformNodeLabels(node.labels),
      properties: GraphDtoFactory.transformProperties(node.properties),
      radius: 60,
      position: {
        x: 0,
        y: 0,
      },
      degree: 0,
      inDegree: 0,
      outDegree: 0,
      nameInQuery: node.nameInQuery,
      displayConfigurationData: {},
    };
  }

  private static transformNodeLabels(labels: Set<string>): SchemaGraphLabel[] {
    return [...labels.values()].map((l) =>
      GraphDtoFactory.transformNodeLabel(l),
    );
  }

  private static transformNodeLabel(label: string): SchemaGraphLabel {
    return {
      label: label,
      color: { type: 'PresetColor', index: 0 },
      count: 0,
    };
  }

  private static transformProperties(
    properties: Neo4jPropertyCollection,
  ): SchemaGraphProperty[] {
    return [...properties.properties.entries()].map(([key, value]) =>
      GraphDtoFactory.transformProperty(key, value),
    );
  }

  private static transformProperty(
    slug: string,
    property: Neo4jProperty,
  ): SchemaGraphProperty {
    return {
      slug: slug,
      value: property.value,
    };
  }

  private static transformEdge(id: string, edge: Neo4jEdge): SchemaEdge {
    return {
      id: id,
      startNodeId: edge.startNodeId,
      endNodeId: edge.endNodeId,
      type: edge.type,
      properties: GraphDtoFactory.transformProperties(edge.properties),
      isLoop: edge.startNodeId === edge.endNodeId,
      parallelCount: 0,
      parallelIndex: 0,
      nameInQuery: edge.nameInQuery,
    };
  }

  private static transformTableData(
    tableData: Map<string, unknown>[],
  ): Record<string, unknown>[] {
    return tableData.map<Record<string, unknown>>((row) => {
      return [...row.entries()].reduce<Record<string, unknown>>(
        (akku, [key, value]) => {
          akku[key] = value;
          return akku;
        },
        {},
      );
    });
  }

  public transform(neo4jGraph: Neo4jGraph): SchemaGetInitialGraph {
    const graph: SchemaGetInitialGraph = {
      graph: {
        nodes: GraphDtoFactory.transformNodes(neo4jGraph.nodes),
        edges: GraphDtoFactory.transformEdges(neo4jGraph.edges),
      },
      tableData: GraphDtoFactory.transformTableData(neo4jGraph.tableData),
      graphMetaData: { labels: [] },
    };

    return graph;
  }
}
