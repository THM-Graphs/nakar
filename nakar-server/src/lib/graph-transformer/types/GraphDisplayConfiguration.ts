import { NodeDisplayConfiguration } from './NodeDisplayConfiguration';

export interface GraphDisplayConfiguration {
  connectResultNodes: boolean | null;
  growNodesBasedOnDegree: boolean | null;
  nodeDisplayConfigurations: NodeDisplayConfiguration[];
}
