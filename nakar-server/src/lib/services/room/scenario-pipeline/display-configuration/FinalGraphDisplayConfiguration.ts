import { ScaleType } from '../../../../tools/ScaleType';
import { FinalNodeDisplayConfiguration } from './FinalNodeDisplayConfiguration';
import { SMap } from '../../../../tools/Map';
import { MergableGraphDisplayConfiguration } from './MergableGraphDisplayConfiguration';
import { z } from 'zod';

export class FinalGraphDisplayConfiguration {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    connectResultNodes: z.boolean(),
    growNodesBasedOnDegree: z.boolean(),
    growNodesBasedOnDegreeFactor: z.number(),
    nodeDisplayConfigurations: z.record(
      z.string(),
      FinalNodeDisplayConfiguration.schema,
    ),
    compressRelationships: z.boolean(),
    compressRelationshipsWidthFactor: z.number(),
    scaleType: z.nativeEnum(ScaleType),
  });

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

  public constructor(data: {
    connectResultNodes: boolean;
    growNodesBasedOnDegree: boolean;
    growNodesBasedOnDegreeFactor: number;
    nodeDisplayConfigurations: SMap<string, FinalNodeDisplayConfiguration>;
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

  public static empty(): FinalGraphDisplayConfiguration {
    return MergableGraphDisplayConfiguration.empty().finalize();
  }

  public static fromPlain(
    plain: z.infer<typeof FinalGraphDisplayConfiguration.schema>,
  ): FinalGraphDisplayConfiguration {
    return new FinalGraphDisplayConfiguration({
      connectResultNodes: plain.connectResultNodes,
      growNodesBasedOnDegree: plain.growNodesBasedOnDegree,
      growNodesBasedOnDegreeFactor: plain.growNodesBasedOnDegreeFactor,
      nodeDisplayConfigurations: SMap.fromRecord(
        plain.nodeDisplayConfigurations,
      ).map(
        (
          plainNodeDisplayConfig: z.infer<
            typeof FinalNodeDisplayConfiguration.schema
          >,
        ): FinalNodeDisplayConfiguration => {
          return FinalNodeDisplayConfiguration.fromPlain(
            plainNodeDisplayConfig,
          );
        },
      ),
      compressRelationships: plain.compressRelationships,
      compressRelationshipsWidthFactor: plain.compressRelationshipsWidthFactor,
      scaleType: plain.scaleType,
    });
  }

  public toPlain(): z.infer<typeof FinalGraphDisplayConfiguration.schema> {
    return {
      connectResultNodes: this.connectResultNodes,
      growNodesBasedOnDegree: this.growNodesBasedOnDegree,
      growNodesBasedOnDegreeFactor: this.growNodesBasedOnDegreeFactor,
      nodeDisplayConfigurations: this.nodeDisplayConfigurations
        .map(
          (
            nodeDisplayConfig: FinalNodeDisplayConfiguration,
          ): z.infer<typeof FinalNodeDisplayConfiguration.schema> =>
            nodeDisplayConfig.toPlain(),
        )
        .toRecord(),
      compressRelationships: this.compressRelationships,
      compressRelationshipsWidthFactor: this.compressRelationshipsWidthFactor,
      scaleType: this.scaleType,
    } satisfies z.infer<typeof FinalGraphDisplayConfiguration.schema>;
  }
}
