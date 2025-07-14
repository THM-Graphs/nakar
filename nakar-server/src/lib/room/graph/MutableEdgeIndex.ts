import { SMap } from '../../tools/Map';
import { MutableEdge } from './MutableEdge';
import { SSet } from '../../tools/Set';
import { Neo4jRelationship } from '../../neo4j/Neo4jRelationship';
import { MutablePropertyCollection } from './MutablePropertyCollection';

export class MutableEdgeIndex {
  private _byId: SMap<string, MutableEdge>;

  private _byStartNodeId: SMap<string, SMap<string, MutableEdge>>;
  private _byEndNodeId: SMap<string, SMap<string, MutableEdge>>;
  private _byStartAndEndNodeId: SMap<
    string,
    SMap<string, SMap<string, MutableEdge>>
  >;
  private _byType: SMap<string, SSet<MutableEdge>>;

  /* Maps type => count */
  private _typeHistogram: SMap<string, number>;

  /* Maps key => value => count */
  private _propertyHistogram: SMap<string, SMap<string, number>>;

  public constructor(edges: MutableEdge[]) {
    this._byId = new SMap();
    this._byType = new SMap();
    this._byStartNodeId = new SMap();
    this._byEndNodeId = new SMap();
    this._byStartAndEndNodeId = new SMap();
    this._typeHistogram = new SMap();
    this._propertyHistogram = new SMap();

    for (const edge of edges) {
      this.add(edge);
    }
  }

  public get edges(): SSet<MutableEdge> {
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

  public add(edge: MutableEdge): boolean {
    if (this._byId.has(edge.id)) {
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

    this._addToTypeHistogram(edge.type, edge.compressedCount);

    for (const propertyEntry of edge.properties.properties) {
      this._addToPropertyHistogram(propertyEntry[0], propertyEntry[1], 1);
    }

    return true;
  }

  public addNeo4jEdges(neo4jEdges: SMap<string, Neo4jRelationship>): number {
    let result: number = 0;
    for (const relationship of neo4jEdges) {
      const didAdd: boolean = this.addNeo4jEdge(relationship[1]);
      if (didAdd) {
        result += 1;
      }
    }
    return result;
  }

  public addNeo4jEdge(relationship: Neo4jRelationship): boolean {
    const mutableEdge: MutableEdge = new MutableEdge({
      id: relationship.relationship.elementId,
      startNodeId: relationship.relationship.startNodeElementId,
      endNodeId: relationship.relationship.endNodeElementId,
      type: relationship.relationship.type,
      compressedCount: 1,
      width: MutableEdge.defaultWidth,
      properties: MutablePropertyCollection.fromRecord(
        relationship.relationship.properties,
      ),
      namesInQuery: relationship.keys,
      source: relationship.source.nakarId,
    });

    const didAdd: boolean = this.add(mutableEdge);
    return didAdd;
  }

  public remove(edge: MutableEdge): boolean {
    if (!this.has(edge.id)) {
      return false;
    }

    this._byId.delete(edge.id);
    this._byType.get(edge.type)?.delete(edge);
    this._byStartNodeId.get(edge.startNodeId)?.delete(edge.id);
    this._byEndNodeId.get(edge.endNodeId)?.delete(edge.id);
    this._byStartAndEndNodeId
      .get(edge.startNodeId)
      ?.get(edge.endNodeId)
      ?.delete(edge.id);

    this._addToTypeHistogram(edge.type, -edge.compressedCount);

    for (const propertyEntry of edge.properties.properties) {
      this._addToPropertyHistogram(propertyEntry[0], propertyEntry[1], -1);
    }

    return true;
  }

  public get(id: string): MutableEdge | null {
    return this._byId.get(id) ?? null;
  }

  public getByType(type: string): SSet<MutableEdge> {
    return this._byType.get(type) ?? new SSet();
  }

  public has(id: string): boolean {
    return this._byId.has(id);
  }

  public getByStartNodeId(startNodeId: string): MutableEdge[] {
    return (
      this._byStartNodeId
        .get(startNodeId)
        ?.toArray()
        .map((v: [string, MutableEdge]): MutableEdge => v[1]) ?? []
    );
  }

  public getByEndNodeId(endNodeId: string): MutableEdge[] {
    return (
      this._byEndNodeId
        .get(endNodeId)
        ?.toArray()
        .map((v: [string, MutableEdge]): MutableEdge => v[1]) ?? []
    );
  }

  public getByStartAndEndNodeId(
    startNodeId: string,
    endNodeId: string,
  ): MutableEdge[] {
    return (
      this._byStartAndEndNodeId
        .get(startNodeId)
        ?.get(endNodeId)
        ?.toArray()
        .map((v: [string, MutableEdge]): MutableEdge => v[1]) ?? []
    );
  }

  public getByStartOrEndNodeId(nodeId: string): SSet<MutableEdge> {
    const result: SSet<MutableEdge> = new SSet<MutableEdge>();
    for (const startNodeEdge of this.getByStartNodeId(nodeId)) {
      result.add(startNodeEdge);
    }
    for (const endNodeEdge of this.getByEndNodeId(nodeId)) {
      result.add(endNodeEdge);
    }
    return result;
  }

  public byMergingWithNonOverriding(
    otherIndex: MutableEdgeIndex,
  ): MutableEdgeIndex {
    const newIndex: MutableEdgeIndex = new MutableEdgeIndex(
      this.edges.toArray(),
    );

    for (const otherEdge of otherIndex.edges) {
      if (newIndex.has(otherEdge.id)) {
        continue;
      }
      newIndex.add(otherEdge);
    }

    return newIndex;
  }

  public copy(): MutableEdgeIndex {
    return new MutableEdgeIndex(
      this.edges.toArray().map((e: MutableEdge): MutableEdge => e.copy()),
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
