import { GetInitialGraphDto, NodeDto } from './shared/dto';
import { invertColor } from './Color';
import { Neo4jNode, Neo4JProperty } from './Neo4j';

export function applyNodeSizes(graph: GetInitialGraphDto): void {
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

export function applyNodeColors(graph: GetInitialGraphDto): void {
  const labels: Record<string, string> = {};
  const htmlColors: string[] = [
    '#ff8189',
    '#ffff80',
    '#7dff98',
    '#ffc280',
    '#7fc7ff',
    '#b580ff',
  ];

  let htmlCounter = 0;

  for (const node of graph.graph.nodes) {
    for (const label of node.labels) {
      if (!Object.keys(labels).includes(label)) {
        labels[label] = htmlColors[htmlCounter];
        htmlCounter = (htmlCounter + 1) % htmlColors.length;
      }
    }
  }

  for (const node of graph.graph.nodes) {
    node.backgroundColor = labels[node.labels[0]];
    node.displayTitleColor = invertColor(labels[node.labels[0]]);
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
