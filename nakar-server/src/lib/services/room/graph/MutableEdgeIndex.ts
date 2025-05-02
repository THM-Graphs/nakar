import { SMap } from '../../../tools/Map';
import { MutableEdge } from './MutableEdge';
import { SSet } from '../../../tools/Set';

export class MutableEdgeIndex {
  private _edgesById: SMap<string, MutableEdge>;

  public constructor(edges: MutableEdge[]) {
    this._edgesById = new SMap();

    for (const edge of edges) {
      this.add(edge);
    }
  }

  public get edges(): SSet<MutableEdge> {
    return new SSet(this._edgesById.values());
  }

  public get size(): number {
    return this._edgesById.size;
  }

  public get keys(): SSet<string> {
    return new SSet<string>(this._edgesById.keys());
  }

  public add(edge: MutableEdge): void {
    this._edgesById.set(edge.id, edge);
  }

  public remove(edge: MutableEdge): void {
    this._edgesById.delete(edge.id);
  }

  public get(id: string): MutableEdge | null {
    return this._edgesById.get(id) ?? null;
  }
}
