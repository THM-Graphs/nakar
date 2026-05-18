export interface PhysicalEdge {
  readonly id: string;
  readonly startNodeId: string;
  readonly endNodeId: string;
  readonly edgeType: string;
  readonly compressedCount: number;
  readonly isLoop: boolean;
  readonly title: string;
}
