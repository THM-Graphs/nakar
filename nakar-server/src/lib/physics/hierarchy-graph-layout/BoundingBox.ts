import { PhysicalNode } from '../physical-graph/PhysicalNode';
import { HierarchyDummyNode } from './HierarchyDummyNode';

type NodeMap = Record<string, PhysicalNode>;

export class BoundingBox {
  public constructor(
    public readonly minX: number,
    public readonly maxX: number,
    public readonly minY: number,
    public readonly maxY: number,
  ) {}

  public get centerX(): number {
    return (this.minX + this.maxX) / 2;
  }

  public get centerY(): number {
    return (this.minY + this.maxY) / 2;
  }

  public get width(): number {
    return this.maxX - this.minX;
  }

  public static fromNodes(nodeIds: string[], nodes: NodeMap): BoundingBox {
    const visibleNodeIds: string[] = nodeIds.filter(
      (nodeId: string): boolean => !HierarchyDummyNode.isId(nodeId),
    );
    const relevantNodeIds: string[] =
      visibleNodeIds.length > 0 ? visibleNodeIds : nodeIds;

    if (relevantNodeIds.length === 0) {
      return new BoundingBox(0, 0, 0, 0);
    }

    let minX: number = Infinity;
    let maxX: number = -Infinity;
    let minY: number = Infinity;
    let maxY: number = -Infinity;

    for (const nodeId of relevantNodeIds) {
      minX = Math.min(minX, nodes[nodeId].position.x - nodes[nodeId].radius);
      maxX = Math.max(maxX, nodes[nodeId].position.x + nodes[nodeId].radius);
      minY = Math.min(minY, nodes[nodeId].position.y - nodes[nodeId].radius);
      maxY = Math.max(maxY, nodes[nodeId].position.y + nodes[nodeId].radius);
    }

    return new BoundingBox(minX, maxX, minY, maxY);
  }
}
