import { GetNodeDisplayConfigurationDBDTO } from './GetNodeDisplayConfigurationDBDTO';
import { ScaleType } from '../../../tools/ScaleType';

export interface GetGraphDisplayConfigurationDBDTO {
  readonly connectResultNodes: boolean | null;
  readonly growNodesBasedOnDegree: boolean | null;
  readonly growNodesBasedOnDegreeFactor: number | null;
  readonly nodeDisplayConfigurations: GetNodeDisplayConfigurationDBDTO[];
  readonly compressRelationships: boolean | null;
  readonly compressRelationshipsWidthFactor: number | null;
  readonly scaleType: ScaleType | null;
}
