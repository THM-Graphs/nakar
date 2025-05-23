import { RSPhysicalNode } from '../../room/events/RSPhysicalNode';

export interface WTActionUngrabNode {
  type: 'WTActionUngrabNode';
  node: RSPhysicalNode;
  userId: string;
}
