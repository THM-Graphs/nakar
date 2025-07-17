import { ScaleType } from '../../../tools/ScaleType';
import { FinalNodeDisplayConfiguration } from './FinalNodeDisplayConfiguration';
import { SMap } from '../../../tools/Map';
import { MergableGraphDisplayConfiguration } from './MergableGraphDisplayConfiguration';
import { MergeNodeConfiguration } from './MergeNodeConfiguration';
import { SSet } from '../../../tools/Set';

export class FinalGraphDisplayConfiguration {
  public readonly connectResultNodes: boolean;
  public readonly growNodesBasedOnDegree: boolean;
  public readonly growNodesBasedOnDegreeFactor: number;
  public readonly nodeDisplayConfigurations: SMap<
    string,
    FinalNodeDisplayConfiguration
  >;
  public readonly compressRelationships: boolean;
  public readonly compressRelationshipsWidthFactor: number;
  public readonly scaleType: ScaleType;
  public readonly mergeNodeConfigurations: SSet<MergeNodeConfiguration>;

  public constructor(data: {
    connectResultNodes: boolean;
    growNodesBasedOnDegree: boolean;
    growNodesBasedOnDegreeFactor: number;
    nodeDisplayConfigurations: SMap<string, FinalNodeDisplayConfiguration>;
    compressRelationships: boolean;
    compressRelationshipsWidthFactor: number;
    scaleType: ScaleType;
    mergeNodeConfigurations: SSet<MergeNodeConfiguration>;
  }) {
    this.connectResultNodes = data.connectResultNodes;
    this.growNodesBasedOnDegree = data.growNodesBasedOnDegree;
    this.growNodesBasedOnDegreeFactor = data.growNodesBasedOnDegreeFactor;
    this.nodeDisplayConfigurations = data.nodeDisplayConfigurations;
    this.compressRelationships = data.compressRelationships;
    this.compressRelationshipsWidthFactor =
      data.compressRelationshipsWidthFactor;
    this.scaleType = data.scaleType;
    this.mergeNodeConfigurations = data.mergeNodeConfigurations;
  }

  public static empty(): FinalGraphDisplayConfiguration {
    return MergableGraphDisplayConfiguration.empty().finalize();
  }
}
