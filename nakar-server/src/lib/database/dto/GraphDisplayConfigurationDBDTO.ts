import type { NodeDisplayConfigurationDBDTO } from './NodeDisplayConfigurationDBDTO';
import type { ScaleType } from '../../tools/ScaleType';
import type { MergeNodeConfigurationDBDTO } from './MergeNodeConfigurationDBDTO';

export interface GraphDisplayConfigurationDBDTO {
  readonly connectResultNodes: boolean | null;
  readonly growNodesBasedOnDegree: boolean | null;
  readonly growNodesBasedOnDegreeFactor: number | null;
  readonly nodeDisplayConfigurations: NodeDisplayConfigurationDBDTO[];
  readonly compressRelationships: boolean | null;
  readonly compressRelationshipsWidthFactor: number | null;
  readonly scaleType: ScaleType | null;
  readonly mergeNodeConfigurations: MergeNodeConfigurationDBDTO[];
  readonly treatNameInQueryAsLabel: boolean | null;
}
