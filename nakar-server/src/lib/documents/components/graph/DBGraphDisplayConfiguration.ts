import { DBNullableBoolean } from '../../others/DBNullableBoolean';
import { DBNodeDisplayConfiguration } from './DBNodeDisplayConfiguration';
import { DBNullableScaleType } from '../../others/DBNullableScaleType';
import type { Result } from '@strapi/types/dist/modules/documents/result';

export class DBGraphDisplayConfiguration {
  public readonly connectResultNodes: DBNullableBoolean;
  public readonly growNodesBasedOnDegree: DBNullableBoolean;
  public readonly growNodesBasedOnDegreeFactor: number | null;
  public readonly nodeDisplayConfigurations: DBNodeDisplayConfiguration[];
  public readonly compressRelationships: DBNullableBoolean;
  public readonly compressRelationshipsWidthFactor: number | null;
  public readonly scaleType: DBNullableScaleType;

  public constructor(data: {
    connectResultNodes: DBNullableBoolean;
    growNodesBasedOnDegree: DBNullableBoolean;
    growNodesBasedOnDegreeFactor: number | null;
    nodeDisplayConfigurations: DBNodeDisplayConfiguration[];
    compressRelationships: DBNullableBoolean;
    compressRelationshipsWidthFactor: number | null;
    scaleType: DBNullableScaleType;
  }) {
    this.connectResultNodes = data.connectResultNodes;
    this.growNodesBasedOnDegree = data.growNodesBasedOnDegree;
    this.growNodesBasedOnDegreeFactor = data.growNodesBasedOnDegreeFactor;
    this.nodeDisplayConfigurations = data.nodeDisplayConfigurations;
    this.compressRelationships = data.compressRelationships;
    this.compressRelationshipsWidthFactor = data.compressRelationshipsWidthFactor;
    this.scaleType = data.scaleType;
  }

  public static parseOrDefault(
    db: Result<'graph.graph-display-configuration', { populate: ['nodeDisplayConfigurations'] }> | null | undefined,
  ): DBGraphDisplayConfiguration {
    return new DBGraphDisplayConfiguration({
      connectResultNodes: DBNullableBoolean.parseOrDefault(db?.connectResultNodes),
      growNodesBasedOnDegree: DBNullableBoolean.parseOrDefault(db?.growNodesBasedOnDegree),
      growNodesBasedOnDegreeFactor: db?.growNodesBasedOnDegreeFactor ?? null,
      nodeDisplayConfigurations:
        db?.nodeDisplayConfigurations?.map(
          (nodeDisplayConfiguration: Result<'graph.node-display-configuration'>): DBNodeDisplayConfiguration =>
            DBNodeDisplayConfiguration.parse(nodeDisplayConfiguration),
        ) ?? [],
      compressRelationships: DBNullableBoolean.parseOrDefault(db?.compressRelationships),
      compressRelationshipsWidthFactor: db?.compressRelationshipsWidthFactor ?? null,
      scaleType: DBNullableScaleType.parseOrDefault(db?.scaleType),
    });
  }
}
