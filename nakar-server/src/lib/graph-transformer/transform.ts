import {
  SchemaColor,
  SchemaEdge,
  SchemaGetInitialGraph,
  SchemaGraphLabel,
  SchemaGraphProperty,
  SchemaNode,
} from '../../../src-gen/schema';
import { Neo4jGraph } from '../neo4j/types/Neo4jGraph';
import { Neo4jNode } from '../neo4j/types/Neo4jNode';
import { Neo4JProperty } from '../neo4j/types/Neo4JProperty';
import { Neo4jEdge } from '../neo4j/types/Neo4jEdge';
import { GraphDisplayConfiguration } from './GraphDisplayConfiguration';

export function transform(
  neo4jGraph: Neo4jGraph,
  displayConfig: GraphDisplayConfiguration,
): SchemaGetInitialGraph {
  const graph: SchemaGetInitialGraph = {
    graph: {
      nodes: transformNodes(neo4jGraph.nodes),
      edges: transformEdges(neo4jGraph.edges),
    },
    tableData: transformTableData(neo4jGraph.tableData),
    graphMetaData: { labels: [] },
  };

  applyLabels(graph);
  applyNodeDegrees(graph);
  if (displayConfig.growNodesBasedOnDegree == true) {
    applyNodeSizes(graph);
  }
  applyEdgeParallelCounts(graph);

  return graph;
}

function transformNodes(nodes: Map<string, Neo4jNode>): SchemaNode[] {
  return [...nodes.entries()].map(([key, value]) => transformNode(key, value));
}

function transformNode(id: string, node: Neo4jNode): SchemaNode {
  return {
    id: id,
    displayTitle: getNodeDisplayTitle(node),
    labels: transformNodeLabels(node.labels),
    properties: transformProperties(node.properties),
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

function transformNodeLabels(labels: Set<string>): SchemaGraphLabel[] {
  return [...labels.values()].map(transformNodeLabel);
}

function transformNodeLabel(label: string): SchemaGraphLabel {
  return {
    label: label,
    color: { type: 'PresetColor', index: 0 },
    count: 0,
  };
}

function transformProperties(
  properties: Map<string, Neo4JProperty>,
): SchemaGraphProperty[] {
  return [...properties.entries()].map(([key, value]) =>
    transformProperty(key, value),
  );
}

function transformProperty(
  slug: string,
  property: Neo4JProperty,
): SchemaGraphProperty {
  return {
    slug: slug,
    value: property.value,
  };
}

function transformEdges(edges: Map<string, Neo4jEdge>): SchemaEdge[] {
  return [...edges.entries()].map(([key, value]) => transformEdge(key, value));
}

function transformEdge(id: string, edge: Neo4jEdge): SchemaEdge {
  return {
    id: id,
    startNodeId: edge.startNodeId,
    endNodeId: edge.endNodeId,
    type: edge.type,
    properties: transformProperties(edge.properties),
    isLoop: edge.startNodeId == edge.endNodeId,
    parallelCount: 0,
    parallelIndex: 0,
  };
}

function transformTableData(
  tableData: Map<string, string>[],
): Record<string, string>[] {
  return tableData.map((row: Map<string, string>): Record<string, string> => {
    return [...row.entries()].reduce<Record<string, string>>(
      (akku, [key, value]) => {
        akku[key] = value;
        return akku;
      },
      {},
    );
  });
}

function applyLabels(graph: SchemaGetInitialGraph): void {
  let colorIndex: 0 | 1 | 2 | 3 | 4 | 5 = 0;

  for (const node of graph.graph.nodes) {
    for (const label of node.labels) {
      const foundEntry = graph.graphMetaData.labels.find(
        (l) => l.label == label.label,
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

        colorIndex = ((colorIndex + 1) % 6) as 0 | 1 | 2 | 3 | 4 | 5;
      } else {
        foundEntry.count += 1;
        label.count += 1;
        label.color = foundEntry.color;
      }
    }
  }
}

function getNodeDisplayTitle(node: Neo4jNode): string {
  return (
    node.properties.get('name')?.value ??
    node.properties.get('label')?.value ??
    ([...node.properties.values()][0] as Neo4JProperty | null)?.value ??
    [...node.labels.values()].join(', ')
  );
}

function applyNodeDegrees(graph: SchemaGetInitialGraph): void {
  for (const node of graph.graph.nodes) {
    const outRels = graph.graph.edges.filter((e) => e.startNodeId == node.id);
    const inRels = graph.graph.edges.filter((e) => e.endNodeId == node.id);
    node.inDegree = inRels.length;
    node.outDegree = outRels.length;
    node.degree = node.inDegree + node.outDegree;
  }
}

function applyNodeSizes(graph: SchemaGetInitialGraph): void {
  const degrees = graph.graph.nodes.map((n) => n.degree);

  const growFactor = 1;
  const minConnections = Math.min(...degrees);
  const maxConnections = Math.max(...degrees);
  const delta = maxConnections - minConnections;

  for (const node of graph.graph.nodes) {
    if (delta == 0) {
      continue;
    }

    const percent = (node.degree - minConnections) / delta;
    node.radius = node.radius * (1 + growFactor * percent);
  }
}

function applyEdgeParallelCounts(graph: SchemaGetInitialGraph): void {
  for (const edge of graph.graph.edges) {
    if (edge.parallelCount > 0) {
      continue;
    }
    const others = graph.graph.edges.filter((e) => {
      if (e.startNodeId == edge.startNodeId && e.endNodeId == edge.endNodeId) {
        return true;
      } else if (
        e.startNodeId == edge.endNodeId &&
        e.endNodeId == edge.startNodeId
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
        if (other.parallelCount % 2 == 0) {
          if (index % 2 == 0) {
            other.parallelIndex = index + 1;
          } else {
            other.parallelIndex = -index;
          }
        } else {
          if (index == 0) {
            other.parallelIndex = 0;
          }
          if (index % 2 == 0) {
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
