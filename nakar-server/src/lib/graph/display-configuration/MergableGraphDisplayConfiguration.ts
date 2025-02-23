import { ScaleType } from '../../tools/ScaleType';
import { DBGraphDisplayConfiguration } from '../../documents/components/graph/DBGraphDisplayConfiguration';
import { MergableNodeDisplayConfiguration } from './MergableNodeDisplayConfiguration';
import { FinalGraphDisplayConfiguration } from './FinalGraphDisplayConfiguration';
import { SMap } from '../../tools/Map';
import { DBNodeDisplayConfiguration } from '../../documents/components/graph/DBNodeDisplayConfiguration';
import { FinalNodeDisplayConfiguration } from './FinalNodeDisplayConfiguration';

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

  public constructor(data: {
    connectResultNodes: boolean | null;
    growNodesBasedOnDegree: boolean | null;
    growNodesBasedOnDegreeFactor: number | null;
    nodeDisplayConfigurations: SMap<string, MergableNodeDisplayConfiguration>;
    compressRelationships: boolean | null;
    compressRelationshipsWidthFactor: number | null;
    scaleType: ScaleType | null;
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

  public static createFromDb(
    dbConfig: DBGraphDisplayConfiguration | undefined | null,
  ): MergableGraphDisplayConfiguration {
    const nodeDisplayConfigurations:
      | SMap<string, MergableNodeDisplayConfiguration>
      | undefined = dbConfig?.nodeDisplayConfigurations.reduce(
      (
        akku: SMap<string, MergableNodeDisplayConfiguration>,
        next: DBNodeDisplayConfiguration,
      ): SMap<string, MergableNodeDisplayConfiguration> => {
        const targetLabel: string = next.targetLabel ?? '';
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
      connectResultNodes: dbConfig?.connectResultNodes.value ?? null,
      growNodesBasedOnDegree: dbConfig?.growNodesBasedOnDegree.value ?? null,
      growNodesBasedOnDegreeFactor:
        dbConfig?.growNodesBasedOnDegreeFactor ?? null,
      compressRelationships: dbConfig?.compressRelationships.value ?? null,
      compressRelationshipsWidthFactor:
        dbConfig?.compressRelationshipsWidthFactor ?? null,
      nodeDisplayConfigurations:
        nodeDisplayConfigurations ??
        new SMap<string, MergableNodeDisplayConfiguration>(),
      scaleType: dbConfig?.scaleType.value ?? null,
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
    });
  }
}
