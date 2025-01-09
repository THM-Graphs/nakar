import { GraphElements } from '../types/GraphElements';
import { AugmentedNode } from '../types/AugmentedNode';
import { AugmentedRelationship } from '../types/AugmentedRelationship';

export function mergeGraphElements(
  ...elements: GraphElements[]
): GraphElements {
  const nodes: Record<string, AugmentedNode> = {};
  const relationships: Record<string, AugmentedRelationship> = {};
  const tableData: Record<string, unknown>[] = [];

  for (const element of elements) {
    element.nodes.forEach((n) => (nodes[n.elementId] = n));
    element.relationships.forEach((r) => (relationships[r.elementId] = r));
    tableData.push(...element.tableData);
  }

  return {
    nodes: Object.values(nodes),
    relationships: Object.values(relationships),
    tableData: tableData,
  };
}
