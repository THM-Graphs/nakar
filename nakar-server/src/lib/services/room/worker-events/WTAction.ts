import { WTActionGrabNode } from './WTActionGrabNode';
import { WTActionMoveNodes } from './WTActionMoveNodes';
import { WTActionUngrabNode } from './WTActionUngrabNode';
import { WTActionSetGraph } from './WTActionSetGraph';

export type WTAction =
  | WTActionGrabNode
  | WTActionMoveNodes
  | WTActionUngrabNode
  | WTActionSetGraph;
