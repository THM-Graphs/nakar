import type { PhysicalNode } from './PhysicalNode';
import type { PhysicalEdge } from './PhysicalEdge';

export interface PhysicalGraph {
  readonly nodes: Record<string, PhysicalNode>;
  readonly edges: Record<string, PhysicalEdge>;
}
