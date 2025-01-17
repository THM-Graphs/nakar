import { NodeDisplayConfiguration } from './NodeDisplayConfiguration';
import { ScaleType } from './ScaleType';

export type GraphDisplayConfiguration = Readonly<{
  connectResultNodes: boolean | null;
  growNodesBasedOnDegree: boolean | null;
  nodeDisplayConfigurations: NodeDisplayConfiguration[];
  compressRelationships: boolean | null;
  scaleType: ScaleType | null;
}>;
