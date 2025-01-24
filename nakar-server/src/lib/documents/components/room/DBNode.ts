import { DBProperty } from './DBProperty';
import { DBStringList } from '../../others/DBStringList';
import type { Result } from '@strapi/types/dist/modules/documents/result';
import { MutableNode } from '../../../graph/MutableNode';
import { Input } from '@strapi/types/dist/modules/documents/params/data';

export class DBNode {
  public readonly nodeId: string;
  public readonly properties: DBProperty[];
  public readonly radius: number;
  public readonly positionX: number;
  public readonly positionY: number;
  public readonly inDegree: number;
  public readonly outDegree: number;
  public readonly customBackgroundColor: string | null;
  public readonly customTitleColor: string | null;
  public readonly customTitle: string | null;
  public readonly labels: DBStringList;
  public readonly namesInQuery: DBStringList;

  public constructor(data: {
    nodeId: string;
    properties: DBProperty[];
    radius: number;
    positionX: number;
    positionY: number;
    inDegree: number;
    outDegree: number;
    customBackgroundColor: string | null;
    customTitleColor: string | null;
    customTitle: string | null;
    labels: DBStringList;
    namesInQuery: DBStringList;
  }) {
    this.nodeId = data.nodeId;
    this.properties = data.properties;
    this.radius = data.radius;
    this.positionX = data.positionX;
    this.positionY = data.positionY;
    this.inDegree = data.inDegree;
    this.outDegree = data.outDegree;
    this.customBackgroundColor = data.customBackgroundColor;
    this.customTitleColor = data.customTitleColor;
    this.customTitle = data.customTitle;
    this.labels = data.labels;
    this.namesInQuery = data.namesInQuery;
  }

  public static parse(
    db: Result<'room.node', { populate: 'properties' }>,
  ): DBNode {
    return new DBNode({
      nodeId: db.nodeId ?? '',
      properties: (db.properties ?? []).map((p) => DBProperty.parse(p)),
      radius: db.radius ?? MutableNode.defaultRadius,
      positionX: db.positionX ?? 0,
      positionY: db.positionY ?? 0,
      inDegree: db.inDegree ?? 0,
      outDegree: db.outDegree ?? 0,
      customBackgroundColor: db.customBackgroundColor ?? null,
      customTitleColor: db.customTitleColor ?? null,
      customTitle: db.customTitle ?? null,
      labels: DBStringList.parse(db.labels),
      namesInQuery: DBStringList.parse(db.namesInQuery),
    });
  }

  public toDb(): Input<'room.node'> {
    return {
      nodeId: this.nodeId,
      properties: this.properties.map((p) => p.toDb()),
      radius: this.radius,
      positionX: this.positionX,
      positionY: this.positionY,
      inDegree: this.inDegree,
      outDegree: this.outDegree,
      customBackgroundColor: this.customBackgroundColor ?? '',
      customTitleColor: this.customTitleColor ?? '',
      customTitle: this.customTitle ?? '',
      labels: this.labels.toDb(),
      namesInQuery: this.namesInQuery.toDb(),
    };
  }
}
