import { NodeDisplayConfiguration } from './NodeDisplayConfiguration';

export type GraphDisplayConfiguration = Readonly<{
  connectResultNodes: boolean | null;
  growNodesBasedOnDegree: boolean | null;
  nodeDisplayConfigurations: NodeDisplayConfiguration[];
}>;
