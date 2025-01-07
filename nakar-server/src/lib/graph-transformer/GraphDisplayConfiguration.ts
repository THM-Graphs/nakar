import {NodeDisplayConfiguration} from "./NodeDisplayConfiguration";

export type GraphDisplayConfiguration = {
  connectResultNodes: boolean | null;
  growNodesBasedOnDegree: boolean | null;
  nodeDisplayConfigurations: NodeDisplayConfiguration[]
};
