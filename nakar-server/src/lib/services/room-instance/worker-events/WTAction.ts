import { WTActionSetGraph } from './WTActionSetGraph';
import { WTActionMoveNodes } from './WTActionMoveNodes';
import { WTActionLockNode } from './WTActionLockNode';

export type WTAction = WTActionSetGraph | WTActionMoveNodes | WTActionLockNode;
