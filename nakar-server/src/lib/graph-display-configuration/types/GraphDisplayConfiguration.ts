import { NodeDisplayConfiguration } from './NodeDisplayConfiguration';
import { ScaleType } from './ScaleType';

export type GraphDisplayConfiguration = Readonly<{
  connectResultNodes: boolean | null;
  growNodesBasedOnDegree: boolean | null;
  growNodesBasedOnDegreeFactor: number | null;
  nodeDisplayConfigurations: NodeDisplayConfiguration[];
  compressRelationships: boolean | null;
  compressRelationshipsWidthFactor: number | null;
  scaleType: ScaleType | null;
}>;
