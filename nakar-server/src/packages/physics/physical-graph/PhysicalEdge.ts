export interface PhysicalEdge {
  readonly id: string;
  readonly startNodeId: string;
  readonly endNodeId: string;
  readonly edgeType: string;
  readonly title: string;
}
