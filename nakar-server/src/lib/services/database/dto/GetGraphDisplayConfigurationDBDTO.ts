import { DBNullableBoolean } from '../others/DBNullableBoolean';
import { GetNodeDisplayConfigurationDBDTO } from './GetNodeDisplayConfigurationDBDTO';
import { DBNullableScaleType } from '../others/DBNullableScaleType';
import type { Result } from '@strapi/types/dist/modules/documents/result';

export class GetGraphDisplayConfigurationDBDTO {
  public readonly connectResultNodes: DBNullableBoolean;
  public readonly growNodesBasedOnDegree: DBNullableBoolean;
  public readonly growNodesBasedOnDegreeFactor: number | null;
  public readonly nodeDisplayConfigurations: GetNodeDisplayConfigurationDBDTO[];
  public readonly compressRelationships: DBNullableBoolean;
  public readonly compressRelationshipsWidthFactor: number | null;
  public readonly scaleType: DBNullableScaleType;

  public constructor(data: {
    connectResultNodes: DBNullableBoolean;
    growNodesBasedOnDegree: DBNullableBoolean;
    growNodesBasedOnDegreeFactor: number | null;
    nodeDisplayConfigurations: GetNodeDisplayConfigurationDBDTO[];
    compressRelationships: DBNullableBoolean;
    compressRelationshipsWidthFactor: number | null;
    scaleType: DBNullableScaleType;
  }) {
    this.connectResultNodes = data.connectResultNodes;
    this.growNodesBasedOnDegree = data.growNodesBasedOnDegree;
    this.growNodesBasedOnDegreeFactor = data.growNodesBasedOnDegreeFactor;
    this.nodeDisplayConfigurations = data.nodeDisplayConfigurations;
    this.compressRelationships = data.compressRelationships;
    this.compressRelationshipsWidthFactor =
      data.compressRelationshipsWidthFactor;
    this.scaleType = data.scaleType;
  }
}
