import { Neo4jRelationship } from '../neo4j/Neo4jRelationship';
import { MutablePropertyCollection } from './MutablePropertyCollection';
import { SchemaEdge } from '../../../src-gen/schema';

export class MutableEdge {
  public startNodeId: string;
  public endNodeId: string;
  public type: string;
  public parallelCount: number;
  public parallelIndex: number;
  public compressedCount: number;
  public width: number;
  public properties: MutablePropertyCollection;
  public namesInQuery: Set<string>;

  public constructor(data: {
    startNodeId: string;
    endNodeId: string;
    type: string;
    parallelCount: number;
    parallelIndex: number;
    compressedCount: number;
    width: number;
    properties: MutablePropertyCollection;
    namesInQuery: Set<string>;
  }) {
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

  public get isLoop(): boolean {
    return this.startNodeId === this.endNodeId;
  }

  public static create(relationship: Neo4jRelationship): MutableEdge {
    return new MutableEdge({
      startNodeId: relationship.relationship.startNodeElementId,
      endNodeId: relationship.relationship.endNodeElementId,
      type: relationship.relationship.type,
      parallelCount: 1,
      parallelIndex: 0,
      compressedCount: 1,
      width: 2,
      properties: MutablePropertyCollection.create(
        relationship.relationship.properties,
      ),
      namesInQuery: relationship.keys,
    });
  }

  public toDto(id: string): SchemaEdge {
    return {
      id: id,
      startNodeId: this.startNodeId,
      endNodeId: this.endNodeId,
      type: this.type,
      isLoop: this.isLoop,
      parallelCount: this.parallelCount,
      parallelIndex: this.parallelIndex,
      compressedCount: this.compressedCount,
      width: this.width,
      properties: this.properties.toDto(),
      namesInQuery: this.namesInQuery.toArray(),
    };
  }

  public isParallelTo(other: MutableEdge): boolean {
    return (
      (this.startNodeId === other.startNodeId &&
        this.endNodeId === other.endNodeId) ||
      (this.startNodeId === other.endNodeId &&
        this.endNodeId === other.startNodeId)
    );
  }
}
