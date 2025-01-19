import { ScaleType } from '../tools/ScaleType';
import { DBGraphDisplayConfiguration } from '../documents/DBGraphDisplayConfiguration';
import { MergableNodeDisplayConfiguration } from './MergableNodeDisplayConfiguration';
import { FinalGraphDisplayConfiguration } from './FinalGraphDisplayConfiguration';

export class MergableGraphDisplayConfiguration {
  public readonly connectResultNodes: boolean | null;
  public readonly growNodesBasedOnDegree: boolean | null;
  public readonly growNodesBasedOnDegreeFactor: number | null;
  public readonly nodeDisplayConfigurations: Map<
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
    nodeDisplayConfigurations: Map<string, MergableNodeDisplayConfiguration>;
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
    const nodeDisplayConfigurations =
      dbConfig?.nodeDisplayConfigurations.reduce((akku, next) => {
        const targetLabel = next.targetLabel ?? '';
        const existingEntry = akku.get(targetLabel);
        const newEntry = MergableNodeDisplayConfiguration.createFromDb(next);

        if (existingEntry == null) {
          return akku.bySetting(targetLabel, newEntry);
        } else {
          return akku.bySetting(targetLabel, existingEntry.byMerging(newEntry));
        }
      }, new Map<string, MergableNodeDisplayConfiguration>());

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
        new Map<string, MergableNodeDisplayConfiguration>(),
      scaleType: dbConfig?.scaleType.value ?? null,
    });
  }

  public byMerging(
    other: MergableGraphDisplayConfiguration,
  ): MergableGraphDisplayConfiguration {
    const newNodeDisplayConfigurations = new Map<
      string,
      MergableNodeDisplayConfiguration
    >();
    for (const oldConfigurations of this.nodeDisplayConfigurations.entries()) {
      newNodeDisplayConfigurations.set(
        oldConfigurations[0],
        oldConfigurations[1],
      );
    }
    for (const [key, value] of other.nodeDisplayConfigurations.entries()) {
      const existingEntry = newNodeDisplayConfigurations.get(key);
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
        (mergableNodeDisplayConfiguration) =>
          mergableNodeDisplayConfiguration.finalize(),
      ),
      compressRelationships: this.compressRelationships ?? false,
      compressRelationshipsWidthFactor:
        this.compressRelationshipsWidthFactor ?? 10,
      scaleType: this.scaleType ?? ScaleType.linear,
    });
  }
}
