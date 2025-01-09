import { AugmentedNode } from './AugmentedNode';
import { AugmentedRelationship } from './AugmentedRelationship';

export type GraphElements = Readonly<{
  nodes: AugmentedNode[];
  relationships: AugmentedRelationship[];
  tableData: Record<string, unknown>[];
}>;
