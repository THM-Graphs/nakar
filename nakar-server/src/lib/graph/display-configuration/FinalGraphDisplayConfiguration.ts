import { ScaleType } from '../../tools/ScaleType';
import { FinalNodeDisplayConfiguration } from './FinalNodeDisplayConfiguration';

export class FinalGraphDisplayConfiguration {
  public readonly connectResultNodes: boolean;
  public readonly growNodesBasedOnDegree: boolean;
  public readonly growNodesBasedOnDegreeFactor: number;
  public readonly nodeDisplayConfigurations: Map<
    string,
    FinalNodeDisplayConfiguration
  >;
  public readonly compressRelationships: boolean;
  public readonly compressRelationshipsWidthFactor: number;
  public readonly scaleType: ScaleType;

  public constructor(data: {
    connectResultNodes: boolean;
    growNodesBasedOnDegree: boolean;
    growNodesBasedOnDegreeFactor: number;
    nodeDisplayConfigurations: Map<string, FinalNodeDisplayConfiguration>;
    compressRelationships: boolean;
    compressRelationshipsWidthFactor: number;
    scaleType: ScaleType;
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
