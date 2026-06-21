import type { PhysicalNode } from './PhysicalNode';
import type { PhysicalEdge } from './PhysicalEdge';

export interface PhysicalGraph {
  readonly nodes: Record<string, PhysicalNode | null>;
  readonly edges: Record<string, PhysicalEdge | null>;
}
