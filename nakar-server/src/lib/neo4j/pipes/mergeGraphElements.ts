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
    element.nodes.forEach((n) => {
      const oldNode = nodes[n.elementId] as AugmentedNode | null;
      nodes[n.elementId] = {
        ...n,
        keys: new Set([...(oldNode?.keys.values() ?? []), ...n.keys.values()]),
      };
    });
    element.relationships.forEach((r) => {
      const oldRel = relationships[r.elementId] as AugmentedRelationship | null;
      relationships[r.elementId] = {
        ...r,
        keys: new Set([...(oldRel?.keys.values() ?? []), ...r.keys.values()]),
      };
    });
    tableData.push(...element.tableData);
  }

  return {
    nodes: Object.values(nodes),
    relationships: Object.values(relationships),
    tableData: tableData,
  };
}
