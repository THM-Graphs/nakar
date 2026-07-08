import { SMap } from '../../../packages/map/Map';
import { GraphEdge } from './GraphEdge';
import type { GraphNode } from './GraphNode';
import { SSet } from '../../../packages/set/Set';
import type { ExternalGraphDatabaseRelationship } from '../../external-database/data/ExternalGraphDatabaseRelationship';
import { PropertyCollection } from './PropertyCollection';
import { Range } from '../../../packages/range/Range';
import type { NodeIndex } from './NodeIndex';
import type { ElementCreationReason } from './ElementCreationReason';
import { IdHash } from '../../../packages/hash/IdHash';

export class EdgeIndex {
  private readonly _byId: SMap<string, GraphEdge>;

  private readonly _byStartNodeId: SMap<string, SMap<string, GraphEdge>>;
  private readonly _byEndNodeId: SMap<string, SMap<string, GraphEdge>>;
  private readonly _byStartAndEndNodeId: SMap<
    string,
    SMap<string, SMap<string, GraphEdge>>
  >;
  private readonly _byType: SMap<string, SSet<GraphEdge>>;

  /* Maps type => count */
  private readonly _typeHistogram: SMap<string, number>;

  /* Maps key => value => count */
  private readonly _propertyHistogram: SMap<string, SMap<string, number>>;

  private readonly _compressed: SMap<string, SSet<string>>;

  public constructor(edges: GraphEdge[]) {
    this._byId = new SMap();
    this._byType = new SMap();
    this._byStartNodeId = new SMap();
    this._byEndNodeId = new SMap();
    this._byStartAndEndNodeId = new SMap();
    this._typeHistogram = new SMap();
    this._propertyHistogram = new SMap();
    this._compressed = new SMap();

    for (const edge of edges) {
      this.add(edge);
    }
  }

  public get edges(): SSet<GraphEdge> {
    return new SSet(this._byId.values());
  }

  public get size(): number {
    return this._byId.size;
  }

  public get keys(): SSet<string> {
    return new SSet<string>(this._byId.keys());
  }

  public get typeHistogram(): SMap<string, number> {
    return this._typeHistogram;
  }

  public get propertyHistogram(): SMap<string, SMap<string, number>> {
    return this._propertyHistogram;
  }

  public get edgeTypes(): string[] {
    return this._byType
      .toKeyArray()
      .toSorted((a: string, b: string): number => a.localeCompare(b));
  }

  public reset(): void {
    for (const edge of this.edges) {
      this.remove(edge);
    }
  }

  public add(edge: GraphEdge): boolean {
    if (this._byId.has(edge.id)) {
      return false;
    }
    if (
      (this._compressed.get(edge.sourceId) ?? new SSet()).has(edge.nativeId)
    ) {
      return false;
    }

    this._byId.set(edge.id, edge);
    this._byType.set(
      edge.type,
      (this._byType.get(edge.type) ?? new SSet()).byAdding(edge),
    );

    this._byStartNodeId.set(
      edge.startNodeId,
      (this._byStartNodeId.get(edge.startNodeId) ?? new SMap()).bySetting(
        edge.id,
        edge,
      ),
    );
    this._byEndNodeId.set(
      edge.endNodeId,
      (this._byEndNodeId.get(edge.endNodeId) ?? new SMap()).bySetting(
        edge.id,
        edge,
      ),
    );

    this._byStartAndEndNodeId.set(
      edge.startNodeId,
      (this._byStartAndEndNodeId.get(edge.startNodeId) ?? new SMap()).bySetting(
        edge.endNodeId,
        (
          this._byStartAndEndNodeId
            .get(edge.startNodeId)
            ?.get(edge.endNodeId) ?? new SMap()
        ).bySetting(edge.id, edge),
      ),
    );

    this._addToTypeHistogram(edge.type, edge.representationCount);

    for (const propertyEntry of edge.properties.properties) {
      this._addToPropertyHistogram(propertyEntry[0], propertyEntry[1], 1);
    }

    for (const compressed of edge.compressed) {
      this._compressed.set(
        edge.sourceId,
        (this._compressed.get(edge.sourceId) ?? new SSet()).byAdding(
          compressed,
        ),
      );
    }

    return true;
  }

  public addGraphEdges(
    relationships: ExternalGraphDatabaseRelationship[],
    creationAction: ElementCreationReason,
    nodeIndex: NodeIndex,
  ): number {
    let result: number = 0;
    for (const relationship of relationships) {
      const didAdd: boolean = this.addGraphEdge(
        relationship,
        creationAction,
        nodeIndex,
      );
      if (didAdd) {
        result += 1;
      }
    }
    return result;
  }

  public addGraphEdge(
    relationship: ExternalGraphDatabaseRelationship,
    creationAction: ElementCreationReason,
    nodeIndex: NodeIndex,
  ): boolean {
    const sourceId: string = relationship.source.nakarId;
    const startNativeNodeId: string = relationship.startNodeId;
    const endNativeNodeId: string = relationship.endNodeId;

    const startClusterNode: GraphNode | null =
      nodeIndex.getClusterNodeForCompressedNativeId(
        sourceId,
        startNativeNodeId,
      );
    const endClusterNode: GraphNode | null =
      nodeIndex.getClusterNodeForCompressedNativeId(sourceId, endNativeNodeId);

    const mutableEdge: GraphEdge = new GraphEdge({
      id: sourceId + '_' + IdHash.create(relationship.nativeId),
      nativeId: relationship.nativeId,
      startNodeId:
        startClusterNode?.id ??
        sourceId + '_' + IdHash.create(startNativeNodeId),
      endNodeId:
        endClusterNode?.id ?? sourceId + '_' + IdHash.create(endNativeNodeId),
      type: relationship.type,
      compressed: new SSet(),
      properties: PropertyCollection.fromRecord(relationship.properties),
      namesInQuery: relationship.keys,
      sourceId: relationship.source.nakarId,
      sourceTitle: relationship.source.nakarTitle,
      creationAction: creationAction,
    });

    const didAdd: boolean = this.add(mutableEdge);
    return didAdd;
  }

  public remove(edge: GraphEdge): boolean {
    if (!this.has(edge.id)) {
      return false;
    }

    this._byId.delete(edge.id);
    this._byType.get(edge.type)?.delete(edge);
    if ((this._byType.get(edge.type)?.size ?? 0) === 0) {
      this._byType.delete(edge.type);
    }

    this._byStartNodeId.get(edge.startNodeId)?.delete(edge.id);
    if ((this._byStartNodeId.get(edge.startNodeId)?.size ?? 0) === 0) {
      this._byStartNodeId.delete(edge.startNodeId);
    }

    this._byEndNodeId.get(edge.endNodeId)?.delete(edge.id);
    if ((this._byEndNodeId.get(edge.endNodeId)?.size ?? 0) === 0) {
      this._byEndNodeId.delete(edge.endNodeId);
    }

    this._byStartAndEndNodeId
      .get(edge.startNodeId)
      ?.get(edge.endNodeId)
      ?.delete(edge.id);
    if (
      (this._byStartAndEndNodeId.get(edge.startNodeId)?.get(edge.endNodeId)
        ?.size ?? 0) === 0
    ) {
      this._byStartAndEndNodeId.get(edge.startNodeId)?.delete(edge.endNodeId);
    }
    if ((this._byStartAndEndNodeId.get(edge.startNodeId)?.size ?? 0) === 0) {
      this._byStartAndEndNodeId.delete(edge.startNodeId);
    }

    this._addToTypeHistogram(edge.type, -edge.representationCount);

    for (const propertyEntry of edge.properties.properties) {
      this._addToPropertyHistogram(propertyEntry[0], propertyEntry[1], -1);
    }

    for (const compressed of edge.compressed) {
      this._compressed.get(edge.sourceId)?.delete(compressed);
    }
    if ((this._compressed.get(edge.sourceId)?.size ?? 0) === 0) {
      this._compressed.delete(edge.sourceId);
    }

    return true;
  }

  public get(id: string): GraphEdge | null {
    return this._byId.get(id) ?? null;
  }

  public getByType(type: string): SSet<GraphEdge> {
    return this._byType.get(type) ?? new SSet();
  }

  public has(id: string): boolean {
    return this._byId.has(id);
  }

  public getByStartNodeId(startNodeId: string): GraphEdge[] {
    return (
      this._byStartNodeId
        .get(startNodeId)
        ?.toArray()
        .map((v: [string, GraphEdge]): GraphEdge => v[1]) ?? []
    );
  }

  public getByEndNodeId(endNodeId: string): GraphEdge[] {
    return (
      this._byEndNodeId
        .get(endNodeId)
        ?.toArray()
        .map((v: [string, GraphEdge]): GraphEdge => v[1]) ?? []
    );
  }

  public getByStartAndEndNodeId(
    startNodeId: string,
    endNodeId: string,
  ): GraphEdge[] {
    return (
      this._byStartAndEndNodeId
        .get(startNodeId)
        ?.get(endNodeId)
        ?.toArray()
        .map((v: [string, GraphEdge]): GraphEdge => v[1]) ?? []
    );
  }

  public getByStartOrEndNodeId(nodeId: string): SSet<GraphEdge> {
    const result: SSet<GraphEdge> = new SSet<GraphEdge>();
    for (const startNodeEdge of this.getByStartNodeId(nodeId)) {
      result.add(startNodeEdge);
    }
    for (const endNodeEdge of this.getByEndNodeId(nodeId)) {
      result.add(endNodeEdge);
    }
    return result;
  }

  public getEdgeDegreeRange(): Range {
    if (this.edges.size === 0) {
      return Range.one();
    }
    const representationCounts: number[] = this.edges
      .map((edge: GraphEdge): number => edge.representationCount)
      .toArray();

    const range: Range = new Range({
      floor: Math.min(...representationCounts),
      ceiling: Math.max(...representationCounts),
    });

    return range;
  }

  public copy(): EdgeIndex {
    return new EdgeIndex(
      this.edges.toArray().map((e: GraphEdge): GraphEdge => e.copy()),
    );
  }

  private _addToTypeHistogram(type: string, delta: number): void {
    const newValue: number = (this._typeHistogram.get(type) ?? 0) + delta;
    if (newValue === 0) {
      this._typeHistogram.delete(type);
    } else {
      this._typeHistogram.set(type, newValue);
    }
  }

  private _addToPropertyHistogram(
    key: string,
    value: unknown,
    delta: 1 | -1,
  ): void {
    const stringValue: string = JSON.stringify(value);
    const propertyHistogram: SMap<string, number> =
      this._propertyHistogram.get(key) ?? new SMap();
    propertyHistogram.set(
      stringValue,
      (propertyHistogram.get(stringValue) ?? 0) + delta,
    );
    if (propertyHistogram.get(stringValue) === 0) {
      propertyHistogram.delete(stringValue);
    }
    this._propertyHistogram.set(key, propertyHistogram);
    if (this._propertyHistogram.get(key)?.size === 0) {
      this._propertyHistogram.delete(key);
    }
  }
}
