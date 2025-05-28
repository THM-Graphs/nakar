import { WTActionSetGraph } from './WTActionSetGraph';
import { WTActionMoveNodes } from './WTActionMoveNodes';
import { WTActionLockNode } from './WTActionLockNode';
import { WTActionTriggerPhysics } from './WTActionTriggerPhysics';

export type WTAction =
  | WTActionSetGraph
  | WTActionMoveNodes
  | WTActionLockNode
  | WTActionTriggerPhysics;
