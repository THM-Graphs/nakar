import { Action } from "../Action.ts";
import { ExpandNodesAction } from "../ExpandNodesAction.ts";
import { RemoveNodesAction } from "../RemoveNodesAction.ts";
import { FocusNodesAction } from "../FocusNodesAction.ts";
import { UnlockNodesAction } from "../UnlockNodesAction.ts";
import { NodesActionParams } from "../NodesActionParams.ts";
import { AddNoteAction } from "../AddNoteAction.ts";

export const nodeActions: Action<NodesActionParams>[] = [
  ExpandNodesAction.shared,
  RemoveNodesAction.shared,
  FocusNodesAction.shared,
  UnlockNodesAction.shared,
  AddNoteAction.shared,
];
