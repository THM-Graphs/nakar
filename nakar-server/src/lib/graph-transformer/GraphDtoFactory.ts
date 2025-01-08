import {
  SchemaColor,
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
import {
  ColorIndex,
  ColorIndexSchema,
} from '../graph-display-configuration/ColorIndex';
import { match, P } from 'ts-pattern';

export class GraphDtoFactory {
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

  public static transformEdges(edges: Map<string, Neo4jEdge>): SchemaEdge[] {
    return [...edges.entries()].map(([key, value]) =>
      GraphDtoFactory.transformEdge(key, value),
    );
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

  private static applyAutoNodeDisplayTitle(graph: SchemaGetInitialGraph): void {
    for (const node of graph.graph.nodes) {
      const nameProperty = node.properties.find((p) => p.slug === 'name');
      if (nameProperty != null) {
        node.displayTitle =
          GraphDtoFactory.getDisplayStringFromPropertyValue(nameProperty);
        continue;
      }

      const labelProperty = node.properties.find((p) => p.slug === 'label');
      if (labelProperty != null) {
        node.displayTitle =
          GraphDtoFactory.getDisplayStringFromPropertyValue(labelProperty);
        continue;
      }

      node.displayTitle = node.labels.map((l) => l.label).join(', ');
    }
  }

  public static getDisplayStringFromPropertyValue(
    property: SchemaGraphProperty | undefined | null,
  ): string {
    return match(property?.value)
      .with(P.nullish, () => 'null')
      .with(P.string, (p) => p)
      .with(P.number, (n) => n.toString())
      .with(P.boolean, (n) => n.toString())
      .exhaustive();
  }

  private static applyNodeDegrees(graph: SchemaGetInitialGraph): void {
    for (const node of graph.graph.nodes) {
      const outRels = graph.graph.edges.filter(
        (e) => e.startNodeId === node.id,
      );
      const inRels = graph.graph.edges.filter((e) => e.endNodeId === node.id);
      node.inDegree = inRels.length;
      node.outDegree = outRels.length;
      node.degree = node.inDegree + node.outDegree;
    }
  }

  private static applyEdgeParallelCounts(graph: SchemaGetInitialGraph): void {
    for (const edge of graph.graph.edges) {
      if (edge.parallelCount > 0) {
        continue;
      }
      const others = graph.graph.edges.filter((e) => {
        if (
          e.startNodeId === edge.startNodeId &&
          e.endNodeId === edge.endNodeId
        ) {
          return true;
        } else if (
          e.startNodeId === edge.endNodeId &&
          e.endNodeId === edge.startNodeId
        ) {
          return true;
        } else {
          return false;
        }
      });

      others.forEach((other, index) => {
        other.parallelCount = others.length;

        if (other.isLoop) {
          other.parallelIndex = index;
        } else {
          if (other.parallelCount % 2 === 0) {
            if (index % 2 === 0) {
              other.parallelIndex = index + 1;
            } else {
              other.parallelIndex = -index;
            }
          } else {
            if (index === 0) {
              other.parallelIndex = 0;
            }
            if (index % 2 === 0) {
              other.parallelIndex = index;
            } else {
              other.parallelIndex = -(index + 1);
            }
          }

          if (other.startNodeId.localeCompare(other.endNodeId) > 0) {
            other.parallelIndex = -other.parallelIndex;
          }
        }
      });
    }
  }

  private static applyLabels(graph: SchemaGetInitialGraph): void {
    let colorIndex: ColorIndex = 0;

    for (const node of graph.graph.nodes) {
      for (const label of node.labels) {
        const foundEntry = graph.graphMetaData.labels.find(
          (l) => l.label === label.label,
        );

        if (!foundEntry) {
          const color: SchemaColor = { type: 'PresetColor', index: colorIndex };
          const newEntry: SchemaGraphLabel = {
            label: label.label,
            color: color,
            count: 1,
          };
          graph.graphMetaData.labels.push(newEntry);

          label.color = color;
          label.count = 1;

          colorIndex = ColorIndexSchema.default(0).parse((colorIndex + 1) % 6);
        } else {
          foundEntry.count += 1;
          label.count += 1;
          label.color = foundEntry.color;
        }
      }
    }
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

    GraphDtoFactory.applyAutoNodeDisplayTitle(graph);
    GraphDtoFactory.applyLabels(graph);
    GraphDtoFactory.applyNodeDegrees(graph);
    GraphDtoFactory.applyEdgeParallelCounts(graph);

    return graph;
  }
}
