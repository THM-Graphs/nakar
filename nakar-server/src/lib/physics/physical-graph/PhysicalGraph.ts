import { PhysicalNode } from './PhysicalNode';
import { PhysicalEdge } from './PhysicalEdge';

export interface PhysicalGraph {
  readonly nodes: Record<string, PhysicalNode | null>;
  readonly edges: Record<string, PhysicalEdge | null>;
}
