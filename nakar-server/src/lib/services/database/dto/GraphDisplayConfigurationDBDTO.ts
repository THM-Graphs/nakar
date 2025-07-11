import { NodeDisplayConfigurationDBDTO } from './NodeDisplayConfigurationDBDTO';
import { ScaleType } from '../../../tools/ScaleType';
import { MergeNodeConfigurationDBDTO } from './MergeNodeConfigurationDBDTO';

export interface GraphDisplayConfigurationDBDTO {
  readonly connectResultNodes: boolean | null;
  readonly growNodesBasedOnDegree: boolean | null;
  readonly growNodesBasedOnDegreeFactor: number | null;
  readonly nodeDisplayConfigurations: NodeDisplayConfigurationDBDTO[];
  readonly compressRelationships: boolean | null;
  readonly compressRelationshipsWidthFactor: number | null;
  readonly scaleType: ScaleType | null;
  readonly mergeNodeConfigurations: MergeNodeConfigurationDBDTO[];
}
