import { ScaleType } from './ScaleType';
import { DBGraphDisplayConfiguration } from '../documents/types/DBGraphDisplayConfiguration';
import { MergableNodeDisplayConfiguration } from './MergableNodeDisplayConfiguration';
import { FinalGraphDisplayConfiguration } from './FinalGraphDisplayConfiguration';
import { DBGraphDisplayConfigurationBoolean } from '../documents/types/DBGraphDisplayConfigurationBoolean';
import { match, P } from 'ts-pattern';
import { DBScaleType } from '../documents/types/DBScaleType';

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
      dbConfig?.nodeDisplayConfigurations?.reduce((akku, next) => {
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
      connectResultNodes: MergableGraphDisplayConfiguration.dbBooleanToNative(
        dbConfig?.connectResultNodes,
      ),
      growNodesBasedOnDegree:
        MergableGraphDisplayConfiguration.dbBooleanToNative(
          dbConfig?.growNodesBasedOnDegree,
        ),
      growNodesBasedOnDegreeFactor:
        dbConfig?.growNodesBasedOnDegreeFactor ?? null,
      compressRelationships:
        MergableGraphDisplayConfiguration.dbBooleanToNative(
          dbConfig?.compressRelationships,
        ),
      compressRelationshipsWidthFactor:
        dbConfig?.compressRelationshipsWidthFactor ?? null,
      nodeDisplayConfigurations:
        nodeDisplayConfigurations ??
        new Map<string, MergableNodeDisplayConfiguration>(),
      scaleType: MergableGraphDisplayConfiguration.dbScaleTypeToNative(
        dbConfig?.scaleType,
      ),
    });
  }

  private static dbBooleanToNative(
    input: DBGraphDisplayConfigurationBoolean | null | undefined,
  ): boolean | null {
    return match(input)
      .returnType<boolean | null>()
      .with(P.nullish, () => null)
      .with('inherit', () => null)
      .with('true', () => true)
      .with('false', () => false)
      .exhaustive();
  }

  private static dbScaleTypeToNative(
    input: DBScaleType | null | undefined,
  ): ScaleType | null {
    return match(input)
      .with(P.nullish, () => null)
      .with('inherit', () => null)
      .with('linear', () => ScaleType.linear)
      .with('log10', () => ScaleType.log10)
      .with('logn', () => ScaleType.logN)
      .with('log2', () => ScaleType.log2)
      .exhaustive();
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
