import { SMap } from '../../../tools/Map';
import { MutableEdge } from './MutableEdge';
import { SSet } from '../../../tools/Set';

export class MutableEdgeIndex {
  private _byId: SMap<string, MutableEdge>;

  private _byStartNodeId: SMap<string, SMap<string, MutableEdge>>;
  private _byEndNodeId: SMap<string, SMap<string, MutableEdge>>;
  private _byStartAndEndNodeId: SMap<
    string,
    SMap<string, SMap<string, MutableEdge>>
  >;

  public constructor(edges: MutableEdge[]) {
    this._byId = new SMap();
    this._byStartNodeId = new SMap();
    this._byEndNodeId = new SMap();
    this._byStartAndEndNodeId = new SMap();

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

  public add(edge: MutableEdge): void {
    this._byId.set(edge.id, edge);

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
  }

  public remove(edge: MutableEdge): void {
    this._byId.delete(edge.id);
    this._byStartNodeId.get(edge.startNodeId)?.delete(edge.id);
    this._byEndNodeId.get(edge.endNodeId)?.delete(edge.id);
    this._byStartAndEndNodeId
      .get(edge.startNodeId)
      ?.get(edge.endNodeId)
      ?.delete(edge.id);
  }

  public get(id: string): MutableEdge | null {
    return this._byId.get(id) ?? null;
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
}
