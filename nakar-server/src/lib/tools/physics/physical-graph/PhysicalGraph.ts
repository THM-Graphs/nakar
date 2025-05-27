import { PhysicalNode } from './PhysicalNode';
import { PhysicalEdge } from './PhysicalEdge';

export interface PhysicalGraph {
  readonly nodes: Record<string, PhysicalNode>;
  readonly edges: Record<string, PhysicalEdge>;
}
