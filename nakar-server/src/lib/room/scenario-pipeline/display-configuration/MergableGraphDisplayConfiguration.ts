import { ScaleType } from '../../../tools/ScaleType';
import type { GraphDisplayConfigurationDBDTO } from '../../../database/dto/GraphDisplayConfigurationDBDTO';
import { MergableNodeDisplayConfiguration } from './MergableNodeDisplayConfiguration';
import { FinalGraphDisplayConfiguration } from './FinalGraphDisplayConfiguration';
import { SMap } from '../../../tools/Map';
import type { NodeDisplayConfigurationDBDTO } from '../../../database/dto/NodeDisplayConfigurationDBDTO';
import type { FinalNodeDisplayConfiguration } from './FinalNodeDisplayConfiguration';
import { SSet } from '../../../tools/Set';
import type { MergeNodeConfiguration } from './MergeNodeConfiguration';
import type { MergeNodeConfigurationDBDTO } from '../../../database/dto/MergeNodeConfigurationDBDTO';
import type { LoggerService } from '../../../logger/LoggerService';

export class MergableGraphDisplayConfiguration {
  public readonly connectResultNodes: boolean | null;
  public readonly growNodesBasedOnDegree: boolean | null;
  public readonly growNodesBasedOnDegreeFactor: number | null;
  public readonly nodeDisplayConfigurations: SMap<
    string,
    MergableNodeDisplayConfiguration
  >;
  public readonly compressRelationships: boolean | null;
  public readonly compressRelationshipsWidthFactor: number | null;
  public readonly scaleType: ScaleType | null;
  public readonly mergeNodeConfigurations: SSet<MergeNodeConfiguration>;
  public readonly treatNameInQueryAsLabel: boolean | null;

  public constructor(data: {
    connectResultNodes: boolean | null;
    growNodesBasedOnDegree: boolean | null;
    growNodesBasedOnDegreeFactor: number | null;
    nodeDisplayConfigurations: SMap<string, MergableNodeDisplayConfiguration>;
    compressRelationships: boolean | null;
    compressRelationshipsWidthFactor: number | null;
    scaleType: ScaleType | null;
    mergeNodeConfigurations: SSet<MergeNodeConfiguration>;
    treatNameInQueryAsLabel: boolean | null;
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
    this.treatNameInQueryAsLabel = data.treatNameInQueryAsLabel;
  }

  public static createFromDb(
    dbConfig: GraphDisplayConfigurationDBDTO | undefined | null,
    logger: LoggerService,
  ): MergableGraphDisplayConfiguration {
    const nodeDisplayConfigurations:
      | SMap<string, MergableNodeDisplayConfiguration>
      | undefined = dbConfig?.nodeDisplayConfigurations.reduce(
      (
        akku: SMap<string, MergableNodeDisplayConfiguration>,
        next: NodeDisplayConfigurationDBDTO,
      ): SMap<string, MergableNodeDisplayConfiguration> => {
        const targetLabel: string = next.targetLabel ?? '';
        if (targetLabel === '') {
          logger.warn(
            this,
            'Will skip Node Display Configuration, because Target Label is empty.',
          );
          return akku;
        }
        const existingEntry: MergableNodeDisplayConfiguration | undefined =
          akku.get(targetLabel);
        const newEntry: MergableNodeDisplayConfiguration =
          MergableNodeDisplayConfiguration.createFromDb(next);

        if (existingEntry == null) {
          return akku.bySetting(targetLabel, newEntry);
        } else {
          return akku.bySetting(targetLabel, existingEntry.byMerging(newEntry));
        }
      },
      new SMap<string, MergableNodeDisplayConfiguration>(),
    );

    return new MergableGraphDisplayConfiguration({
      connectResultNodes: dbConfig?.connectResultNodes ?? null,
      growNodesBasedOnDegree: dbConfig?.growNodesBasedOnDegree ?? null,
      growNodesBasedOnDegreeFactor:
        dbConfig?.growNodesBasedOnDegreeFactor ?? null,
      compressRelationships: dbConfig?.compressRelationships ?? null,
      compressRelationshipsWidthFactor:
        dbConfig?.compressRelationshipsWidthFactor ?? null,
      nodeDisplayConfigurations:
        nodeDisplayConfigurations ??
        new SMap<string, MergableNodeDisplayConfiguration>(),
      scaleType: dbConfig?.scaleType ?? null,
      mergeNodeConfigurations: new SSet(
        (dbConfig?.mergeNodeConfigurations ?? []).map(
          (
            mergeNodeConfiguration: MergeNodeConfigurationDBDTO,
          ): MergeNodeConfiguration => ({
            originalLabel: mergeNodeConfiguration.originalLabel ?? '',
            originalProperties: (
              mergeNodeConfiguration.originalProperties ?? ''
            )
              .split(',')
              .map((s: string): string => s.trim()),
            originalDatabaseId: mergeNodeConfiguration.originalDatabaseId ?? '',
            mergeLabel: mergeNodeConfiguration.mergeLabel ?? '',
            mergeProperties: (mergeNodeConfiguration.mergeProperties ?? '')
              .split(',')
              .map((s: string): string => s.trim()),
            mergeDatabaseId: mergeNodeConfiguration.mergeDatabaseId ?? '',
          }),
        ),
      ),
      treatNameInQueryAsLabel: dbConfig?.treatNameInQueryAsLabel ?? null,
    });
  }

  public static empty(): MergableGraphDisplayConfiguration {
    return new MergableGraphDisplayConfiguration({
      connectResultNodes: null,
      growNodesBasedOnDegree: null,
      growNodesBasedOnDegreeFactor: null,
      nodeDisplayConfigurations: new SMap(),
      compressRelationships: null,
      compressRelationshipsWidthFactor: null,
      scaleType: null,
      mergeNodeConfigurations: new SSet(),
      treatNameInQueryAsLabel: null,
    });
  }

  public byMerging(
    other: MergableGraphDisplayConfiguration,
  ): MergableGraphDisplayConfiguration {
    const newNodeDisplayConfigurations: SMap<
      string,
      MergableNodeDisplayConfiguration
    > = new SMap<string, MergableNodeDisplayConfiguration>();
    for (const oldConfigurations of this.nodeDisplayConfigurations.entries()) {
      newNodeDisplayConfigurations.set(
        oldConfigurations[0],
        oldConfigurations[1],
      );
    }
    for (const [key, value] of other.nodeDisplayConfigurations.entries()) {
      const existingEntry: MergableNodeDisplayConfiguration | undefined =
        newNodeDisplayConfigurations.get(key);
      if (existingEntry == null) {
        newNodeDisplayConfigurations.set(key, value);
      } else {
        newNodeDisplayConfigurations.set(key, existingEntry.byMerging(value));
      }
    }

    return new MergableGraphDisplayConfiguration({
      connectResultNodes: other.connectResultNodes ?? this.connectResultNodes,
      growNodesBasedOnDegree:
        other.growNodesBasedOnDegree ?? this.growNodesBasedOnDegree,
      growNodesBasedOnDegreeFactor:
        other.growNodesBasedOnDegreeFactor ?? this.growNodesBasedOnDegreeFactor,
      nodeDisplayConfigurations: newNodeDisplayConfigurations,
      compressRelationships:
        other.compressRelationships ?? this.compressRelationships,
      compressRelationshipsWidthFactor:
        other.compressRelationshipsWidthFactor ??
        this.compressRelationshipsWidthFactor,
      scaleType: other.scaleType ?? this.scaleType,
      mergeNodeConfigurations: this.mergeNodeConfigurations.byMerging(
        other.mergeNodeConfigurations,
      ),
      treatNameInQueryAsLabel:
        other.treatNameInQueryAsLabel ?? this.treatNameInQueryAsLabel,
    });
  }

  public finalize(): FinalGraphDisplayConfiguration {
    return new FinalGraphDisplayConfiguration({
      connectResultNodes: this.connectResultNodes ?? false,
      growNodesBasedOnDegree: this.growNodesBasedOnDegree ?? false,
      growNodesBasedOnDegreeFactor: this.growNodesBasedOnDegreeFactor ?? 2,
      nodeDisplayConfigurations: this.nodeDisplayConfigurations.map(
        (
          mergableNodeDisplayConfiguration: MergableNodeDisplayConfiguration,
        ): FinalNodeDisplayConfiguration =>
          mergableNodeDisplayConfiguration.finalize(),
      ),
      compressRelationships: this.compressRelationships ?? false,
      compressRelationshipsWidthFactor:
        this.compressRelationshipsWidthFactor ?? 10,
      scaleType: this.scaleType ?? ScaleType.linear,
      mergeNodeConfigurations: this.mergeNodeConfigurations,
      treatNameInQueryAsLabel: this.treatNameInQueryAsLabel ?? false,
    });
  }
}
