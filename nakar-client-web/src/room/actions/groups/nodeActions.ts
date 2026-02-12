import { Action } from "../Action.ts";
import { ExpandNodePreviewAction } from "../ExpandNodePreviewAction.ts";
import { RemoveNodesAction } from "../RemoveNodesAction.ts";
import { FocusNodesAction } from "../FocusNodesAction.ts";
import { UnlockNodesAction } from "../UnlockNodesAction.ts";
import { NodesActionParams } from "../NodesActionParams.ts";
import { AddNoteAction } from "../AddNoteAction.ts";
import { ShowShortestPathAction } from "../ShowShortestPathAction.ts";
import { ExpandNodeAction } from "../ExpandNodeAction.ts";

export const nodeActions: Action<NodesActionParams>[] = [
  ExpandNodeAction.shared,
  ExpandNodePreviewAction.shared,
  RemoveNodesAction.shared,
  FocusNodesAction.shared,
  UnlockNodesAction.shared,
  AddNoteAction.shared,
  ShowShortestPathAction.shared,
];
