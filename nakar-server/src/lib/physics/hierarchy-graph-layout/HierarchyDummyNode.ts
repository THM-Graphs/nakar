import { PhysicalNode } from '../physical-graph/PhysicalNode';

export type DummyNodeId = `__dummy_${number}`;

export class HierarchyDummyNode {
  public static isId(nodeId: string): nodeId is DummyNodeId {
    return nodeId.startsWith('__dummy_');
  }

  public static create(nodeId: DummyNodeId): PhysicalNode {
    return {
      id: nodeId,
      position: {
        x: 0,
        y: 0,
      },
      radius: 0,
      locked: false,
      velocityX: 0,
      velocityY: 0,
    };
  }
}
