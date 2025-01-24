import { DBProperty } from './DBProperty';
import type { Result } from '@strapi/types/dist/modules/documents/result';
import { DBStringList } from '../../others/DBStringList';
import { MutableEdge } from '../../../graph/MutableEdge';
import { Input } from '@strapi/types/dist/modules/documents/params/data';

export class DBEdge {
  public readonly edgeId: string;
  public readonly startNodeId: string;
  public readonly endNodeId: string;
  public readonly type: string;
  public readonly parallelCount: number;
  public readonly parallelIndex: number;
  public readonly compressedCount: number;
  public readonly width: number;
  public readonly properties: DBProperty[];
  public readonly namesInQuery: DBStringList;

  public constructor(data: {
    edgeId: string;
    startNodeId: string;
    endNodeId: string;
    type: string;
    parallelCount: number;
    parallelIndex: number;
    compressedCount: number;
    width: number;
    properties: DBProperty[];
    namesInQuery: DBStringList;
  }) {
    this.edgeId = data.edgeId;
    this.startNodeId = data.startNodeId;
    this.endNodeId = data.endNodeId;
    this.type = data.type;
    this.parallelCount = data.parallelCount;
    this.parallelIndex = data.parallelIndex;
    this.compressedCount = data.compressedCount;
    this.width = data.width;
    this.properties = data.properties;
    this.namesInQuery = data.namesInQuery;
  }

  public static parse(
    db: Result<'room.edge', { populate: 'properties' }>,
  ): DBEdge {
    return new DBEdge({
      edgeId: db.edgeId ?? '',
      startNodeId: db.startNodeId ?? '',
      endNodeId: db.endNodeId ?? '',
      type: db.type ?? '',
      parallelCount: db.parallelCount ?? 1,
      parallelIndex: db.parallelIndex ?? 0,
      compressedCount: db.compressedCount ?? 0,
      width: db.width ?? MutableEdge.defaultWidth,
      properties: (db.properties ?? []).map((p) => DBProperty.parse(p)),
      namesInQuery: DBStringList.parse(db.namesInQuery),
    });
  }

  public toDb(): Input<'room.edge'> {
    return {
      edgeId: this.edgeId,
      startNodeId: this.startNodeId,
      endNodeId: this.endNodeId,
      type: this.type,
      parallelCount: this.parallelCount,
      parallelIndex: this.parallelIndex,
      compressedCount: this.compressedCount,
      width: this.width,
      properties: this.properties.map((p) => p.toDb()),
      namesInQuery: this.namesInQuery.toDb(),
    };
  }
}
