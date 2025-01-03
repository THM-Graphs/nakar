import { Neo4jNode } from './neo4j/types/Neo4jNode';
import { Neo4JProperty } from './neo4j/types/Neo4JProperty';
import {
  SchemaColor,
  SchemaGetInitialGraph,
  SchemaGraphLabel,
} from '../../src-gen/schema';

export function applyNodeSizes(graph: SchemaGetInitialGraph): void {
  const nodeConnections: Record<string, number> = {};
  for (const node of graph.graph.nodes) {
    const edges = graph.graph.edges.filter(
      (e) => e.startNodeId == node.id || e.endNodeId == node.id,
    );
    nodeConnections[node.id] = edges.length;
  }

  const minSize = 60;
  const maxSize = 110;
  const sizeDelta = maxSize - minSize;
  const minConnections = Math.min(...Object.values(nodeConnections));
  const maxConnections = Math.max(...Object.values(nodeConnections));
  const delta = maxConnections - minConnections;

  for (const node of graph.graph.nodes) {
    if (delta == 0) {
      node.size = (minSize + maxSize) / 2;
      continue;
    }
    const connections = nodeConnections[node.id];

    const percent = (connections - minConnections) / delta;
    const size = minSize + sizeDelta * percent;
    node.size = size;
  }
}

export function applyLabels(graph: SchemaGetInitialGraph): void {
  let colorIndex: 0 | 1 | 2 | 3 | 4 | 5 = 0;

  for (const node of graph.graph.nodes) {
    for (const label of node.labels) {
      const foundEntry = graph.graphMetaData.labels.find(
        (l: SchemaGraphLabel) => l.label === label.label,
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

export function getNodeDisplayTitle(node: Neo4jNode): string {
  return (
    node.properties.find((p) => p.slug == 'name')?.value ??
    node.properties.find((p) => p.slug == 'label')?.value ??
    (node.properties[0] as Neo4JProperty | null)?.value ??
    node.labels.join(', ')
  );
}
