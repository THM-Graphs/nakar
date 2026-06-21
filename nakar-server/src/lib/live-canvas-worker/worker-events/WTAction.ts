import type { WTActionSetGraph } from './WTActionSetGraph';
import type { WTActionMoveNodes } from './WTActionMoveNodes';
import type { WTActionTriggerPhysics } from './WTActionTriggerPhysics';
import type { WTActionSetLocks } from './WTActionSetLocks';

export type WTAction =
  | WTActionSetGraph
  | WTActionMoveNodes
  | WTActionTriggerPhysics
  | WTActionSetLocks;
