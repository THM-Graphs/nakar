import { WTPhysicalNode } from './WTPhysicalNode';

export interface WTActionMoveNodes {
  type: 'WTActionMoveNodes';
  nodes: readonly WTPhysicalNode[];
  userId: string;
}
