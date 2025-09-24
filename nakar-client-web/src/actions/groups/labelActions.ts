import { Action } from "../Action.ts";
import { LabelActionParams } from "../LabelActionParams.ts";
import { RemoveLabelAction } from "../RemoveLabelAction.ts";
import { CompressLabelsAction } from "../CompressLabelsAction.ts";
import { LayoutLabelsCircleAction } from "../LayoutLabelsCircleAction.ts";
import { LayoutLabelsForceDirectedAction } from "../LayoutLabelsForceDirectedAction.ts";
import { SelectAllNodesOfLabel } from "../SelectAllNodesOfLabel.ts";

export const labelActions: Action<LabelActionParams>[] = [
  SelectAllNodesOfLabel.shared,
  RemoveLabelAction.shared,
  CompressLabelsAction.shared,
  LayoutLabelsCircleAction.shared,
  LayoutLabelsForceDirectedAction.shared,
];
