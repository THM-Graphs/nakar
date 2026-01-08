import { WTActionSetGraph } from './WTActionSetGraph';
import { WTActionMoveNodes } from './WTActionMoveNodes';
import { WTActionTriggerPhysics } from './WTActionTriggerPhysics';
import { WTActionSetLocks } from './WTActionSetLocks';

export type WTAction =
  | WTActionSetGraph
  | WTActionMoveNodes
  | WTActionTriggerPhysics
  | WTActionSetLocks;
